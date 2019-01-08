'use strict';

const sinon = require('sinon');
const nock = require('nock');
require('chai').should();

const trigger = require('../../lib/triggers/getProducts');
const getProductsResponse = require('../testData/getProductsResponse.json');
const getCategoroesResponse = require('../testData/getCategoroesResponse.json');

const emit = sinon.spy();
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
    it('should works', async () => {
        nock(cfg.url)
            .post('/rest/V1/integration/admin/token', {
                username: cfg.username,
                password: cfg.password
            })
            .reply(200, token);
        nock(cfg.url, regHeaders)
            .get('/rest/V1/products?searchCriteria=searchCriteria')
            .reply(200, getProductsResponse);
        nock(cfg.url, regHeaders)
            .get('/rest/V1/products/24-MB01')
            .reply(200, getProductsResponse.items[0]);
        nock(cfg.url, regHeaders)
            .get('/rest/V1/categories/3')
            .reply(200, getCategoroesResponse);
        await trigger.process.bind({
            emit
        })({}, cfg, {});

        emit.getCall(0).args[0].should.be.eq('data');
        emit.getCall(0).args[1].body.sku.should.be.eq(getProductsResponse.items[0].sku);
        emit.getCall(0).args[1].body.categories[0].name.should.be.eq(getCategoroesResponse.name);
    });
});
