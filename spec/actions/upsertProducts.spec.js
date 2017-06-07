'use strict';

const sinon = require('sinon');
require('chai').should();
const action = require('../../lib/actions/upsertProduct');
const nock = require('nock');
const cfg = {
    url: 'http://localhost',
    username: 'magento overlord',
    password: 'otnegam'
};
describe('Magento 2 upsert product action', () => {
    describe('when product contains new attributes and new attributes set', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(200, 'authtoken');
        service.get('/products/attributes?search_criteria').reply(200, {
           items: []
        });
        service.post('/products/attributes').reply(201, {
            attribute_code: 'color',
            frontend_input: 'multiselect',
            entity_type_id: 4,
            is_required: false,
            default_frontend_label: 'Color',
            options: [{
                label: 'color of emptyness',
                value: 123
            }]
        });
        service.get('/products/attribute-sets/sets/list?search_criteria').reply(200, {
            items: [{
                attribute_set_name: 'Default',
                attribute_set_id: 4
            }]
        });
        service.post('/products/attribute-sets').reply(201, {
            attribute_set_name: 'some set',
            attribute_set_id: 5
        });
        service.get('/products/cap').reply(404, 'Not found');
        service.post('/products/').reply(201, {
            name: 'cap',
            sku: 'cap',
            price: 10.1,
            weight: 1,
            attributeSetId: 'some set',
            customAttributes: [{
                label: 'Color',
                key: 'color',
                value: 'color of emptyness',
                type: 'multiselect'
            }]
        })
        service.put('/products/cap').reply(201, {
            name: 'cap',
            sku: 'cap',
            price: 10.1,
            weight: 1,
            attributeSetId: 'some set',
            customAttributes: [{
                label: 'Color',
                key: 'color',
                value: 'color of emptyness',
                type: 'multiselect'
            }]
        })
        before(() => action.process.bind({emit})({
            body: {
                name: 'cap',
                sku: 'cap',
                price: 10.1,
                attribute_set_name: 'some set',
                weight: 1,
                attrs: [{
                    label: 'Color',
                    key: 'color',
                    value: 'color of emptyness',
                    type: 'multiselect'
                }]
            }
        }, cfg));
        it('should create new attribute set', () => {
            const requestFailed = !service.isDone() && service.pendingMocks()
                    .includes('POST http://localhost:80/rest/V1/products/attribute-sets');
            requestFailed.should.be.false;
        });
        it('should create new attribute', () => {
            const requestFailed = !service.isDone() && service.pendingMocks()
                    .includes('POST http://localhost:80/rest/V1/products/attributes');
            requestFailed.should.be.false;
        });
        it('should create product', () => {
            const requestFailed = !service.isDone() && service.pendingMocks()
                    .includes('POST http://localhost:80/rest/V1/products');
            requestFailed.should.be.false;
        });
        it('should emit a new product', () => {
            emit.getCall(0).args[0].should.be.eq('data');
            emit.getCall(0).args[1].body.should.be.deep.eq({
                "attributeSetId": "some set",
                "customAttributes": [
                    {
                        "key": "color",
                        "label": "Color",
                        "type": "multiselect",
                        "value": "color of emptyness",
                    }
                ],
                "name": "cap",
                "price": 10.1,
                "sku": "cap",
                "weight": 1
            });
        });
        it('should end', () => {
            emit.getCall(1).args[0].should.be.eq('end');
        });
    });
    describe('when product contains existing attribute set and existing attributes but new attribute option', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(200, 'authtoken');
        service.get('/products/attributes?search_criteria').reply(200, {
            items: [{
                attribute_code: 'color',
                frontend_input: 'multiselect',
                entity_type_id: 4,
                is_required: false,
                default_frontend_label: 'Color',
                options: [{
                    label: 'color of emptiness',
                    value: 123
                }]
            }]
        });
        service.put('/products/attributes/color').reply(200, {
            attribute_code: 'color',
            frontend_input: 'multiselect',
            entity_type_id: 4,
            is_required: false,
            default_frontend_label: 'Color',
            options: [{
                label: 'color of emptiness',
                value: 123
            }, {
                label: 'sandy',
                value: 124
            }]
        });
        service.get('/products/attribute-sets/sets/list?search_criteria').reply(200, {
            items: [{
                attribute_set_name: 'Default',
                attribute_set_id: 4
            }]
        });
        service.get('/products/cap').reply(404, 'Not found');
        service.post('/products/').reply(201, (uri, body) => body);
        service.put('/products/cap').reply(201, (uri, body) => body);
        before(() => action.process.bind({emit})({
            body: {
                name: 'cap',
                sku: 'cap',
                price: 10.1,
                attribute_set_name: 'Default',
                weight: 1,
                qty: 10,
                attrs: [{
                    label: 'Color',
                    key: 'color',
                    value: 'sandy',
                    type: 'multiselect'
                }]
            }
        }, cfg));
        it('should create new attribute option', () => {
            const requestFailed = !service.isDone() && service.pendingMocks()
                    .includes('PUT http://localhost:80/rest/V1/products/attributes');
            requestFailed.should.be.false;
        });
        it('should create product', () => {
            emit.getCall(0).args[0].should.be.eq('data');
            emit.getCall(0).args[1].body.product.should.be.deep.eq({
                attributeSetId: 4,
                customAttributes: [{
                    attribute_code: 'color',
                    value: [
                        124
                    ]
                }],
                "extensionAttributes": {
                    "stockItem": {
                        "isInStock": true,
                        "qty": 10
                    }
                },
                name: 'cap',
                price: 10.1,
                sku: 'cap',
                weight: 1
            });
        });
        it('should end', () => {
            emit.getCall(1).args[0].should.be.eq('end');
        });
    });
    describe('when product contains existing attribute set and existing attributes', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(200, 'authtoken');
        service.get('/products/attributes?search_criteria').reply(200, {
            items: [{
                attribute_code: 'color',
                frontend_input: 'multiselect',
                entity_type_id: 4,
                is_required: false,
                default_frontend_label: 'Color',
                options: [{
                    label: 'color of emptiness',
                    value: 123
                }]
            }]
        });
        service.get('/products/attribute-sets/sets/list?search_criteria').reply(200, {
            items: [{
                attribute_set_name: 'Default',
                attribute_set_id: 4
            }]
        });
        service.get('/products/cap').reply(404, 'Not found');
        service.post('/products/').reply(201, (uri, body) => body);
        service.put('/products/cap').reply(201, (uri, body) => body);
        before(() => action.process.bind({emit})({
            body: {
                name: 'cap',
                sku: 'cap',
                price: 10.1,
                attribute_set_name: 'Default',
                weight: 1,
                qty: 10,
                attrs: [{
                    label: 'Color',
                    key: 'color',
                    value: 'color of emptiness',
                    type: 'multiselect'
                }]
            }
        }, cfg));
        it('should create product', () => {
            emit.getCall(0).args[0].should.be.eq('data');
            emit.getCall(0).args[1].body.product.should.be.deep.eq({
                attributeSetId: 4,
                customAttributes: [{
                    attribute_code: 'color',
                    value: [
                        123
                    ]
                }],
                "extensionAttributes": {
                    "stockItem": {
                        "isInStock": true,
                        "qty": 10
                    }
                },
                name: 'cap',
                price: 10.1,
                sku: 'cap',
                weight: 1
            });
        });
        it('should end', () => {
            emit.getCall(1).args[0].should.be.eq('end');
        });
    });
    describe('when product product exists', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(200, 'authtoken');
        service.get('/products/attributes?search_criteria').reply(200, {
            items: [{
                attribute_code: 'color',
                frontend_input: 'multiselect',
                entity_type_id: 4,
                is_required: false,
                default_frontend_label: 'Color',
                options: [{
                    label: 'color of emptiness',
                    value: 123
                }]
            }]
        });
        service.get('/products/attribute-sets/sets/list?search_criteria').reply(200, {
            items: [{
                attribute_set_name: 'Default',
                attribute_set_id: 4
            }]
        });
        service.get('/products/cap').reply(200, {
            attributeSetId: 4,
            customAttributes: [{
                attribute_code: 'color',
                value: [
                    123
                ]
            }],
            name: 'cap',
            price: 10.1,
            sku: 'cap',
            weight: 1
        });
        service.put('/products/cap').reply(201, (uri, body) => body);
        before(() => action.process.bind({emit})({
            body: {
                name: 'Cap',
                sku: 'cap',
                price: 9.1,
                attribute_set_name: 'Default',
                weight: 1,
                qty: 10,
                attrs: [{
                    label: 'Color',
                    key: 'color',
                    value: 'color of emptiness',
                    type: 'multiselect'
                }]
            }
        }, cfg));
        it('should emit product', () => {
            console.log(emit.getCall(0).args[1])
            emit.getCall(0).args[0].should.be.eq('data');
            emit.getCall(0).args[1].body.product.should.be.deep.eq({
                attributeSetId: 4,
                customAttributes: [{
                    attribute_code: 'color',
                    value: [
                        123
                    ]
                }],
                "extensionAttributes": {
                    "stockItem": {
                        "isInStock": true,
                        "qty": 10
                    }
                },
                name: 'Cap',
                price: 9.1,
                weight: 1
            });
        });
        it('should end', () => {
            emit.getCall(1).args[0].should.be.eq('end');
        });
    });
    describe('when something goes wrong', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(501, 'some server error')
        before(() => action.process.bind({emit})({
            body: {
                name: 'cap',
                sku: 'cap',
                price: 10.1,
                attribute_set_name: 'Default',
                weight: 1,
                attrs: [{
                    label: 'Color',
                    key: 'color',
                    value: 'color of emptiness',
                    type: 'multiselect'
                }]
            }
        }, cfg));
        it('should emit error', () => {
            emit.getCall(0).args[0].should.be.eq('error');
            emit.getCall(0).args[1].should.be.eq('some server error');
        });
        it('should emit end', () => {
            emit.getCall(1).args[0].should.be.eq('end');
        });
    });
});
