/* eslint-disable no-unused-expressions */
'use strict';

const {expect} = require('chai');
const fs = require('fs');
const sinon = require('sinon');

const actionRetrieveCustomer = require('../../lib/actions/retrieveCustomer.js');
const actionRetrieveCustomerAddress = require('../../lib/actions/retrieveCustomerAddress.js');
const actionRetrieveProduct = require('../../lib/actions/retrieveProduct.js');
const actionRetrieveProductImages = require('../../lib/actions/retrieveProductImages.js');

describe('Integration Test', function () {
    let url;
    let username;
    let password;
    let customerId;
    let customerEmail;
    let customerAddressId;
    let customerAddressCity;
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
        customerId = process.env.MAGENTO2_CUSTOMERID;
        customerEmail = process.env.MAGENTO2_CUSTOMEREMAIL;
        customerAddressId = process.env.MAGENTO2_CUSTOMERADDRESSID;
        customerAddressCity = process.env.MAGENTO2_CUSTOMERADDRESSCITY;
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

    describe('Retrieve Customer Tests', function () {
        it('Get customer from id', async function () {
            const msg = {
                body: {
                    path: {
                        customerId: customerId
                    }
                }
            };
            await actionRetrieveCustomer.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData.email).to.be.equal(customerEmail);
        });
    });

    describe('Retrieve Customer Address Tests', function () {
        it('Get customer address from addressId', async function () {
            const msg = {
                body: {
                    path: {
                        addressId: customerAddressId
                    }
                }
            };
            await actionRetrieveCustomerAddress.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData.city).to.be.equal(customerAddressCity);
        });
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
