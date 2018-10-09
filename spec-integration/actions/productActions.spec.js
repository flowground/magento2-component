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
const actionUnassignProductFromWebsite = require('../../lib/actions/unassignProductFromWebsite.js');
const actionAssignProductToWebsite = require('../../lib/actions/assignProductToWebsite.js');
const actionAssignCategoryToProduct = require('../../lib/actions/assignCategoryToProduct.js');
const actionUnassignCategoryFromProduct = require('../../lib/actions/unassignCategoryFromProduct.js');
const actionRetrieveStockItem = require('../../lib/actions/retrieveStockItem.js');
const actionRetrieveStockItemsList = require('../../lib/actions/retrieveStockItemsList.js');
const actionUpdateStockItem = require('../../lib/actions/updateStockItem.js');
const actionUpdateInventory = require('../../lib/actions/updateInventory.js');
const actionCreateLink = require('../../lib/actions/createLink.js');
const actionRetrieveMediaGalleryOfProduct = require('../../lib/actions/retrieveMediaGalleryOfProduct.js');
const actionUpdateMediaGalleryItem = require('../../lib/actions/updateMediaGalleryItem.js');
const actionDeleteMediaGalleryItem = require('../../lib/actions/deleteMediaGalleryItem.js');
const actionRetrieveProductsList = require('../../lib/actions/retrieveProductsList.js');

describe('Products Actions Integration Test', function () {
    let url;
    let username;
    let password;
    let productId;
    let productSku = 'Pen';
    let productName = 'Test Pen';
    let linkedProductSku = 'Linked Pen';
    let imageEntryId;
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
                        attribute_set_id: 4,
                        extension_attributes: {
                            stock_item: {
                                qty: 10,
                                is_in_stock: true,
                                is_qty_decimal: true
                            }
                        }
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
                        attribute_set_id: 4,
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

    describe('Create product for linking to main product', function () {
        it('Create than update product', async function () {
            const msg = {
                body: {
                    product: {
                        sku: linkedProductSku,
                        name: `Created ${linkedProductSku}`,
                        price: 20,
                        attribute_set_id: 4
                    },
                    saveOptions: true
                }
            };
            await actionUpsertProduct.process.call(emitter, msg, cfg, null);
            expect(emitter.emit.getCall(0).args[1].body.responseData.sku).to.be.equal(linkedProductSku);
        });
    });

    describe('Create Link', function () {
        it('Create link for product', async function () {
            const msg = {
                body: {
                    sku: productSku,
                    items: [
                        {
                            sku: productSku,
                            link_type: 'related',
                            linked_product_sku: linkedProductSku,
                            linked_product_type: 'simple',
                            position: 5,
                            extension_attributes: {
                                qty: 3
                            }
                        }
                    ]
                }
            };
            await actionCreateLink.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
        });
    });

    describe('Update Link', function () {
        it('Update link for product', async function () {
            const msg = {
                body: {
                    sku: productSku,
                    items: [
                        {
                            sku: productSku,
                            link_type: 'related',
                            linked_product_sku: linkedProductSku,
                            linked_product_type: 'simple',
                            position: 1,
                            extension_attributes: {
                                qty: 3
                            }
                        }
                    ]
                }
            };
            await actionCreateLink.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
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
            // imageEntryId = emitter.emit.getCall(0).args[1].body.responseData.message;
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
            imageEntryId = emitter.emit.getCall(0).args[1].body.responseData[0].id;
            expect(emitter.emit.getCall(0).args[1].body.responseData).to.have.lengthOf(1);
        });
    });

    describe('Retrieve Media Gallery Of Product', function () {
        it('Retrieve Media Gallery Of Product from SKU', async function () {
            const msg = {
                body: {
                    path: {
                        sku: productSku
                    }
                }
            };
            await actionRetrieveMediaGalleryOfProduct.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData[0].media_type).to.be.equal('image');
        });
    });

    describe('Delete Media Gallery Of Product', function () {
        it('Delete Media Gallery Of Product from SKU', async function () {
            const msg = {
                body: {
                    path: {
                        sku: productSku,
                        entryId: imageEntryId
                    }
                }
            };
            await actionDeleteMediaGalleryItem.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
        });
    });

    describe('Assign Category To Product', function () {
        it('Assign Category To Product by sku', async function () {
            const msg = {
                body: {
                    path: {
                        categoryId: 11
                    },
                    body: {
                        productLink: {
                            sku: productSku,
                            category_id: 11
                        }
                    }
                }
            };
            await actionAssignCategoryToProduct.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
        });
    });

    describe('Unassign Category To Product', function () {
        it('Unassign Category To Product by sku', async function () {
            const msg = {
                body: {
                    path: {
                        categoryId: 11,
                        sku: productSku
                    }
                }
            };
            await actionUnassignCategoryFromProduct.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
        });
    });

    describe('Update Inventory', function () {
        it('Update product inventory', async function () {
            const msg = {
                body: {
                    productSku,
                    stockItem: {
                        qty: 18
                    }
                }
            };
            await actionUpdateInventory.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(`${productId}`);
        });
    });

    describe('Update Stock Item', function () {
        it('Update Stock Item from product sku', async function () {
            const msg = {
                body: {
                    path: {
                        productSku,
                        itemId: 2062
                    },
                    body: {
                        stockItem: {
                            qty: 16
                        }
                    }
                }
            };
            await actionUpdateStockItem.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(`${productId}`);
        });
    });

    describe('Retrieve Stock Item', function () {
        it('Retrieve Stock Item from product', async function () {
            const msg = {
                body: {
                    path: {
                        productSku
                    },
                    query: {
                        scopeId: 1
                    }
                }
            };
            await actionRetrieveStockItem.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData.qty).to.be.equal(16);
        });
    });

    describe('Retrieve Stock Items List', function () {
        it('Retrieve Stock Items List from product', async function () {
            const msg = {
                body: {
                    query: {
                        scopeId: 0,
                        qty: 100,
                        pageSize: 2
                    }
                }
            };
            await actionRetrieveStockItemsList.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData.items[0].qty).to.be.equal(100);
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

    describe('Unassign Product From Website', function () {
        it('Unassign Product From Website', async function () {
            const msg = {
                body: {
                    path: {
                        sku: productSku,
                        websiteId: 1
                    }
                }
            };
            await actionUnassignProductFromWebsite.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
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
            expect(emitter.emit.getCall(0).args[1].body.responseData.product_links[0].position).to.be.equal(1);
            expect(emitter.emit.getCall(0).args[1].body.responseData.extension_attributes.website_ids).to.be.empty;
        });
    });

    describe('Retrieve Products List Tests', function () {
        it('Get products list with search criteria PageSize = 2', async function () {
            const msg = {
                    body: {
                        queryString: 'searchCriteria[pageSize]=2'
                    }
                }
            ;
            await actionRetrieveProductsList.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData.items).to.have.lengthOf(2);
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
            const msgLinkedProduct = {
                body: {
                    sku: linkedProductSku
                }
            };
            await actionDeleteProduct.process.call(emitter, msgLinkedProduct, cfg, null);
            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
        });
    });
});
