/* eslint-disable no-unused-expressions */
'use strict';

const {expect} = require('chai');
const fs = require('fs');
const sinon = require('sinon');

const actionUpsertProduct = require('../../lib/actions/upsertProduct.js');
const actionDeleteProduct = require('../../lib/actions/deleteProduct.js');
const actionRetrieveProduct = require('../../lib/actions/retrieveProduct.js');
const actionAddImageToProduct = require('../../lib/actions/addImageToProduct.js');
const actionRetrieveProductImages = require('../../lib/actions/retrieveProductImages.js');
const actionAssignProductToWebsite = require('../../lib/actions/assignProductToWebsite.js');

describe('Products Actions Integration Test', function () {
    let url;
    let username;
    let password;
    let productId;
    let productSku = 'Pen';
    let productName = 'Test Pen';
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

    describe('Upsert Product Tests', function () {
        it('Create than update product', async function () {
            const emitterUpdate = {
                emit: sinon.spy()
            };
            const msg = {
                body: {
                    product: {
                        sku: productSku,
                        name: `Created ${productName}`,
                        price: 120,
                        attribute_set_id: 4
                    },
                    saveOptions: true
                }
            };
            const msgUpdate = {
                body: {
                    product: {
                        sku: productSku,
                        name: productName,
                        price: 20,
                        attribute_set_id: 4
                    },
                    saveOptions: true
                }
            };
            await actionUpsertProduct.process.call(emitter, msg, cfg, null);
            productId = emitter.emit.getCall(0).args[1].body.responseData.id;
            expect(emitter.emit.getCall(0).args[1].body.responseData.sku).to.be.equal(productSku);
            expect(emitter.emit.getCall(0).args[1].body.responseData.name).to.be.equal(`Created ${productName}`);

            await actionUpsertProduct.process.call(emitterUpdate, msgUpdate, cfg, null);
            expect(emitterUpdate.emit.getCall(0).args[1].body.responseData.sku).to.be.equal(productSku);
            expect(emitterUpdate.emit.getCall(0).args[1].body.responseData.name).to.be.equal(productName);
            expect(emitterUpdate.emit.getCall(0).args[1].body.responseData.price).to.be.equal(20);
        });
    });

    describe('Add Image to product', function () {
        it('Add Image to product from sku', async function () {
            const msg = {
                body: {
                    path: {
                        sku: productSku
                    },
                    body: {
                        entry: {
                            media_type: 'image',
                            label: 'string_3682',
                            disabled: false,
                            types: [],
                            content: {
                                base64_encoded_data: 'iVBORw0KGgoAAAANSUhEUgAAAAUA AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO 9TXL0Y4OHwAAAABJRU5ErkJggg==',
                                type: 'image/png',
                                name: 'helloworld112'
                            },
                            extension_attributes: {}
                        }
                    }
                }
            };
            await actionAddImageToProduct.process.call(emitter, msg, cfg, null);

            expect(!(emitter.emit.getCall(0).args[1].body.responseData.message)).to.be.equal(true);
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

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.have.lengthOf(1);
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

    describe('Assign Product To Website', function () {
        it('Assign Product To Website', async function () {
            const msg = {
                body: {
                    path: {
                        sku: productSku
                    },
                    body: {
                        productWebsiteLink: {
                            sku: productSku,
                            website_id: 1
                        }
                    }
                }
            };
            await actionAssignProductToWebsite.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
        });
    });

    describe('Delete Product Tests', function () {
        it('Delete product', async function () {
            const msg = {
                body: {
                    sku: productSku
                }
            };
            await actionDeleteProduct.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
        });
    });
});
