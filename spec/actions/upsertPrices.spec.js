'use strict';

const sinon = require('sinon');
require('chai').should();
const action = require('../../lib/actions/upsertPrices');
const nock = require('nock');
const cfg = {
    url: 'http://localhost',
    username: 'magento overlord',
    password: 'otnegam'
};
describe('Magento 2 upsert prices action', () => {
    describe('when everything goes ok', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(200, 'authtoken');
        service.get('/customerGroups/search?searchCriteria').reply(200, {
            items: [{
                code: 'code',
                id: 1
            }]
        });
        service.get('/products/F000015471').reply(200, true);
        service.post('/products/F000015471/group-prices/1/tiers/8/price/192').reply(201, true);
        before(() => action.process.bind({emit})({
            body: {
                qty: 8,
                price: 192,
                sku: 'F000015471',
                customer_group_code: 'code'
            }
        }, cfg));
        it('should create price', () => {
            const requestFailed = !service.isDone() && service.pendingMocks()
                    .includes('POST http://localhost:80/rest/V1/products/F000015471/group-prices/1/tiers/8/price/192');
            requestFailed.should.be.false;
        });
        it('should emit result', () => {
            emit.getCall(0).args[0].should.be.eq('data');
            emit.getCall(0).args[1].body.should.be.deep.eq({
                ok: true
            });
        });
        it('should end', () => {
            emit.getCall(1).args[0].should.be.eq('end');
        });
    });
    describe('when customers groups doesnt exist', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(200, 'token')
        service.get('/customerGroups/search?searchCriteria').reply(200, {
            items: [{
                code: 'code2',
                id: 2
            }]
        });
        before(() => action.process.bind({emit})({
            body: {
                qty: 8,
                price: 192,
                sku: 'F000015471',
                customer_group_code: 'code'
            }
        }, cfg));
        it('should emit error', () => {
            emit.getCall(0).args[0].should.be.eq('error');
            emit.getCall(0).args[1].should.be.eq(`Customer group id with code code doesn't exist on magento`);
        });
        it('should emit end', () => {
            emit.getCall(1).args[0].should.be.eq('end');
        });
    });
    describe('when something goes wrong', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(400, 'some server error')
        before(() => action.process.bind({emit})({
            body: {
                qty: 8,
                price: 192,
                sku: 'F000015471',
                customer_group_code: 'code'
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
