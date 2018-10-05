/* eslint-disable no-unused-expressions */
'use strict';

const {expect} = require('chai');
const fs = require('fs');
const sinon = require('sinon');

const actionRetrieveProduct = require('../../lib/actions/retrieveProduct.js');
const actionRetrieveProductImages = require('../../lib/actions/retrieveProductImages.js');

describe('Products Actions Integration Test', function () {
    let url;
    let username;
    let password;
    let productSku;
    let productName;
    let cfg;
    let emitter;

    this.timeout(10000);
    before(function () {
        if (fs.existsSync('.env')) {
            require('dotenv').config();
        }

        url = process.env.MAGENTO2_URL;
        username = process.env.MAGENTO2_USERNAME;
        password = process.env.MAGENTO2_PASSWORD;
        productSku = process.env.MAGENTO2_PRODUCTSKU;
        productName = process.env.MAGENTO2_PRODUCTNAME;
    });

    beforeEach(function () {
        cfg = {
            url,
            username,
            password
        };

        emitter = {
            emit: sinon.spy()
        };
    });

    describe('Retrieve Product Tests', function () {
        it('Get product from sku', async function () {
            const msg = {
                body: {
                    path: {
                        sku: productSku
                    }
                }
            };
            await actionRetrieveProduct.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData.name).to.be.equal(productName);
        });
    });

    describe('Retrieve Product Images Tests', function () {
        it('Get product images from product sku', async function () {
            const msg = {
                body: {
                    path: {
                        sku: productSku
                    }
                }
            };
            await actionRetrieveProductImages.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData[0].media_type).to.be.equal('image');
        });
    });
});
