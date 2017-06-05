'use strict';

const sinon = require('sinon');
require('chai').should();
const action = require('../../lib/actions/updateOrderStatus');
const nock = require('nock');
const cfg = {
    url: 'http://localhost',
    username: 'magento overlord',
    password: 'otnegam'
};
describe('Magento 2 update order status', () => {
    describe('when status is Shipped', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(200, 'authtoken');
        service.post('/order/1/ship').reply(200, {ok: true});
        before(() => action.process.bind({emit})({
            body: {
                id: 1,
                state: 'Shipped'
            }
        }, cfg));

        it('should ship', () => {
            const requestFailed = !service.isDone() && service.pendingMocks()
                    .includes('POST http://localhost:80/rest/V1/order/1/ship');
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
    describe('when status is Payment received', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(200, 'authtoken');
        service.post('/order/1/invoice').reply(200, {ok: true});
        before(() => action.process.bind({emit})({
            body: {
                id: 1,
                state: 'Payment received'
            }
        }, cfg));

        it('should invoice', () => {
            const requestFailed = !service.isDone() && service.pendingMocks()
                    .includes('POST http://localhost:80/rest/V1/order/1/invoice');
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
    describe('when something goes wrong', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(501, 'some server error')
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
