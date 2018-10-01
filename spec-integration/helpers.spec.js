const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const {getToken, getBaseUrlAndService, getStoreCodes, getStoreCodeSelectModel} = require('../lib/helpers');

describe('Unit test for helpers class methods', function () {
    let url;
    let username;
    let password;
    let integrationToken;
    let cfg;
    let store = 'all';
    let msg;
    before(function () {
        if (fs.existsSync('.env')) {
            require('dotenv').config();
        }

        url = process.env.MAGENTO2_URL;
        username = process.env.MAGENTO2_USERNAME;
        password = process.env.MAGENTO2_PASSWORD;
        integrationToken = process.env.MAGENTO2_TOKEN;
    });

    describe('Test getToken with token', () => {
        it('Set Token to config', async () => {
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
            cfg = {
                url,
                username,
                password
            };
            const result = await getToken(cfg);
            expect(result).to.not.eq(null);
        });
    });

    describe('Test getToken with not valid username and password', () => {
        it('Set not valid username and password to config', async () => {
            cfg = {
                url,
                username: 'wwww',
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
            cfg = {
                url,
                integrationToken
            };
            const result = await getStoreCodes(cfg);
            expect(result[0]).to.deep.eq('all');
        });
    });

    describe('Test getStoreCodeSelectModel', () => {
        it('First arg need to be "all"', async () => {
            cfg = {
                url,
                integrationToken
            };
            const result = await getStoreCodeSelectModel(cfg);
            console.log(result);
            expect(result.all).to.deep.eq('all');
        });
    });
});
