'use strict';

const sinon = require('sinon');
const nock = require('nock');
require('chai').should();

const trigger = require('../../lib/triggers/getCustomers');
const getCustomerGroupsResponse = require('../testData/getCustomerGroupsResponse');
const getCustomersResponse = require('../testData/getCustomersResponse');
const getEmptyCustomersResponse = require('../testData/getEmptyCustomersResponse');

const cfg = {
    url: 'http://localhost',
    username: 'magento overlord',
    password: 'otnegam'
};
const token = 'token';
const regHeaders = {
    reqheaders: {
        authorization: `Bearer ${token}`
    }
};

describe('Magento 2 getProducts trigger', () => {

    it('should works (without snapshot)', async () => {
        const emit = sinon.spy();
        nock(cfg.url)
            .post('/rest/V1/integration/admin/token', {
                username: cfg.username,
                password: cfg.password
            })
            .reply(200, token);
        nock(cfg.url, regHeaders)
            .get('/rest/V1/customerGroups/search?searchCriteria=searchCriteria')
            .reply(200, getCustomerGroupsResponse);
        nock(cfg.url, regHeaders)
            .get('/rest/V1/customers/search?searchCriteria=searchCriteria')
            .reply(200, getCustomersResponse);
        await trigger.process.bind({
            emit
        })({}, cfg, {});
        emit.getCall(0).args[0].should.be.eq('data');
        emit.getCall(1).args[1].updated_at.should.be.eq(getCustomersResponse.items[0].updated_at);
    });

    it('should works (with snapshot', async () => {
        const emit = sinon.spy();
        nock(cfg.url)
            .post('/rest/V1/integration/admin/token', {
                username: cfg.username,
                password: cfg.password
            })
            .reply(200, token);
        nock(cfg.url, regHeaders)
            .get('/rest/V1/customerGroups/search?searchCriteria=searchCriteria')
            .reply(200, getCustomerGroupsResponse);
        nock(cfg.url, regHeaders)
// eslint-disable-next-line max-len
            .get('/rest/V1/customers/search?searchCriteria[filter_groups][0][filters][0][field]=updated_at&searchCriteria[filter_groups][0][filters][0][value]=2018-10-02%2012:40:08&searchCriteria[filter_groups][0][filters][0][condition_type]=gt')
            .reply(200, getEmptyCustomersResponse);
        await trigger.process.bind({
            emit
        })({}, cfg, {
            updated_at: '2018-10-02 12:40:08'
        });
        emit.getCall(0).args[0].should.be.eq('snapshot');
    });
});
