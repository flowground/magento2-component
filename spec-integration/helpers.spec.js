const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const {getStoreCodes, getStoreCodeSelectModel} = require('../lib/helpers');

describe('Unit test for helpers class methods', function () {
    let url;
    let username;
    let password;
    let cfg;

    before(function () {
        if (fs.existsSync('.env')) {
            require('dotenv').config();
        }

        url = process.env.MAGENTO2_URL;
        username = process.env.MAGENTO2_USERNAME;
        password = process.env.MAGENTO2_PASSWORD;
    });

    describe('Test getStoreCodes', () => {
        it('First arg need to be "all"', async () => {
            cfg = {
                url,
                username,
                password
            };
            const result = await getStoreCodes(cfg);
            expect(result[0]).to.deep.eq('all');
        });
    });

    describe('Test getStoreCodeSelectModel', () => {
        it('First arg need to be "all"', async () => {
            cfg = {
                url,
                username,
                password
            };
            const result = await getStoreCodeSelectModel(cfg);
            expect(result.all).to.deep.eq('all');
        });
    });
});
