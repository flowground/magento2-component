'use strict';

const sinon = require('sinon');
require('chai').should();
const action = require('../../lib/triggers/getCustomers');
const nock = require('nock');
const cfg = {
    url: 'http://localhost',
    username: 'magento overlord',
    password: 'otnegam'
};
describe('Magento 2 get customers trigger', () => {
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
        service.get('/customers/search?searchCriteria').reply(201, {
            items: [
                {
                    id: 1,
                    group_id: 1,
                    updated_at: '2017-03-26 10:50:40'
                }
            ]
        });
        before(() => action.process.bind({emit})({}, cfg, {}));
        it('should fetch customers', () => {
            const requestFailed = !service.isDone() && service.pendingMocks()
                    .includes('GET http://localhost:80/rest/V1/customerGroups/search?searchCriteria');
            requestFailed.should.be.false;
        });
        it('should emit result', () => {
            emit.getCall(0).args[0].should.be.eq('data');
            emit.getCall(0).args[1].body.should.be.deep.eq({
                id: 1,
                group_id: 1,
                group_code: 'code',
                updated_at: '2017-03-26 10:50:40'
            });
        });
        it('should emit snapshot', () => {
            emit.getCall(1).args[0].should.be.eq('snapshot');
            emit.getCall(1).args[1].should.be.deep.eq({updated_at: '2017-03-26 10:50:40'});
        });
        it('should end', () => {
            emit.getCall(2).args[0].should.be.eq('end');
        });
    });
    describe('when something goes wrong', () => {
        const emit = sinon.spy();
        const service = nock(`${cfg.url}/rest/V1`);
        service.post('/integration/admin/token').reply(501, 'some server error')
        before(() => action.process.bind({emit})({}, cfg, {}));
        it('should emit error', () => {
            emit.getCall(0).args[0].should.be.eq('error');
            emit.getCall(0).args[1].should.be.eq('some server error');
        });
        it('should emit end', () => {
            emit.getCall(1).args[0].should.be.eq('end');
        });
    });
});
