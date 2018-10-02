const chai = require('chai');
const nock = require('nock');
const expect = chai.expect;
const {getToken, getBaseUrlAndService, getStoreCodes, getStoreCodeSelectModel} = require('../lib/helpers');

describe('Unit test for helpers class methods', function () {
    let url = 'http://example.com';
    let username = 'username';
    let password = 'password';
    let integrationToken = 'integrationToken';
    let cfg;
    let msg;
    let store = 'all';
    let storeCfg = [
        {
            code: 'default'
        },
        {
            code: 'admin'
        }
    ];
    let regHeaders = {
        reqheaders: {
            authorization: 'Bearer integrationToken'
        }
    };

    describe('Test getToken with token', () => {
        it('Set Token to config', async () => {
            nock(url)
                .post('/rest/V1/integration/admin/token', {
                    integrationToken
                })
                .reply(200, integrationToken);
            cfg = {
                url,
                integrationToken
            };
            const result = await getToken(cfg);
            expect(result).to.deep.eq(integrationToken);
        });
    });

    describe('Test getToken with username and password', () => {
        it('Set username and password to config', async () => {
            nock(url)
                .post('/rest/V1/integration/admin/token', {
                    username,
                    password
                })
                .reply(200, 'token');
            cfg = {
                url,
                username,
                password
            };
            const result = await getToken(cfg);
            expect(result).to.deep.eq('token');
        });
    });

    describe('Test getToken with not valid username and password', () => {
        it('Set not valid username and password to config', async () => {
            nock(url)
                .post('/rest/V1/integration/admin/token', {
                    username,
                    password
                })
                .reply(404, 'Failed with status code 404');
            cfg = {
                url,
                username,
                password
            };
            const result = await getToken(cfg);
            expect(result).to.deep.eq(null);
        });
    });

    describe('Test getBaseUrlAndService with Store in message', () => {
        it('Set not valid username and password to config', async () => {
            cfg = {
                url,
                integrationToken
            };
            msg = {
                body: {
                    store
                }
            };
            const result = await getBaseUrlAndService(msg, cfg);
            expect(result.baseUrl).to.deep.eq(url + `/rest/${store}/V1`);
        });
    });

    describe('Test getBaseUrlAndService with Store in config', () => {
        it('Set not valid username and password to config', async () => {
            cfg = {
                url,
                integrationToken,
                store
            };
            msg = {};
            const result = await getBaseUrlAndService(msg, cfg);
            expect(result.baseUrl).to.deep.eq(url + `/rest/${store}/V1`);
        });
    });

    describe('Test getBaseUrlAndService without Store', () => {
        it('Set not valid username and password to config', async () => {
            cfg = {
                url,
                integrationToken
            };
            msg = {};
            const result = await getBaseUrlAndService(msg, cfg);
            expect(result.baseUrl).to.deep.eq(url + '/rest/V1');
        });
    });
    describe('Test getStoreCodes', () => {
        it('First arg need to be "all"', async () => {
            nock(url)
                .post('/rest/V1/integration/admin/token', {
                    username,
                    password
                })
                .reply(200, integrationToken);
            nock(url, regHeaders)
                .get('/rest/V1/store/storeViews')
                .reply(200, storeCfg);
            cfg = {
                url,
                username,
                password
            };
            const result = await getStoreCodes(cfg);
            expect(result).to.deep.eq(['all', 'default', 'admin']);
        });
    });
    describe('Test getStoreCodeSelectModel', () => {
        it('First arg need to be "all"', async () => {
            nock(url)
                .post('/rest/V1/integration/admin/token', {
                    integrationToken
                })
                .reply(200, integrationToken);
            nock(url, regHeaders)
                .get('/rest/V1/store/storeViews')
                .reply(200, storeCfg);
            cfg = {
                url,
                integrationToken
            };
            const result = await getStoreCodeSelectModel(cfg);
            expect(result).to.deep.eq({
                all: 'all',
                default: 'default',
                admin: 'admin'
            });
        });
    });
});
