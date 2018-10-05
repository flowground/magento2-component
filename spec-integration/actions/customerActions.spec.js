/* eslint-disable no-unused-expressions */
'use strict';

const {expect} = require('chai');
const fs = require('fs');
const sinon = require('sinon');

const actionRetrieveCustomersList = require('../../lib/actions/retrieveCustomersList.js');
const actionCreateCustomer = require('../../lib/actions/createCustomer.js');
const actionUpdateCustomer = require('../../lib/actions/updateCustomer.js');
const actionRetrieveCustomerAddress = require('../../lib/actions/retrieveCustomerAddress.js');
const actionDeleteCustomerAddress = require('../../lib/actions/deleteCustomerAddress.js');
const actionRetrieveCustomer = require('../../lib/actions/retrieveCustomer.js');
const actionDeleteCustomer = require('../../lib/actions/deleteCustomer.js');

describe('Customers Actions Integration Test', function () {
    let url;
    let username;
    let password;
    let cfg;
    let emitter;
    let email = 'integration_test1@example.com';
    let firstname = 'Integration';
    let lastname = 'Test';
    let customerId;
    let firstAddressId;
    let secondAddressId;

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

    describe('Retrieve Customers Lists Tests', () => {
        it('Should be present total_count', async function () {
            const msg = {
                body: {
                    query: {
                        'searchCriteria[pageSize]': 1
                    }
                }
            };
            await actionRetrieveCustomersList.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.have.property('total_count');
        });
    });

    describe('Create Customer Tests', () => {
        it('Should be created new customer', async function () {
            const msg = {
                body: {
                    body: {
                        customer: {
                            email,
                            firstname,
                            lastname,
                            websiteId: 1,
                            addresses: [
                                {
                                    country_id: 'UA',
                                    street: [
                                        'Khreschatyk, 21'
                                    ],
                                    telephone: '(066) 11 22 123',
                                    postcode: '01001',
                                    city: 'Kyiv',
                                    firstname: 'TestName',
                                    lastname: 'TestLastName',
                                    default_billing: true
                                },
                                {
                                    country_id: 'DE',
                                    street: [
                                        'Line 1'
                                    ],
                                    telephone: '(066) 11 22 123',
                                    postcode: '01001',
                                    city: 'Bonn',
                                    firstname: 'Germany Name',
                                    lastname: 'Germany Last Name'
                                }
                            ]
                        }
                    }
                }
            };
            await actionCreateCustomer.process.call(emitter, msg, cfg, null);
            customerId = emitter.emit.getCall(0).args[1].body.responseData.id;
            firstAddressId = emitter.emit.getCall(0).args[1].body.responseData.addresses[0].id;
            secondAddressId = emitter.emit.getCall(0).args[1].body.responseData.addresses[1].id;
            expect(emitter.emit.getCall(0).args[1].body.responseData.email).to.be.equal(email);
            expect(emitter.emit.getCall(0).args[1].body.responseData.addresses).to.have.lengthOf(2);
        });
    });

    describe('Update Customer Tests', () => {
        it('Should be updated last name', async function () {
            const msg = {
                body: {
                    path: {
                        id: customerId
                    },
                    body: {
                        customer: {
                            id: customerId,
                            websiteId: 1,
                            email,
                            firstname,
                            lastname: 'Updated LastName'
                        }
                    }
                }
            };
            await actionUpdateCustomer.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData.id).to.be.equal(customerId);
            expect(emitter.emit.getCall(0).args[1].body.responseData.email).to.be.equal(email);
            expect(emitter.emit.getCall(0).args[1].body.responseData.lastname).to.be.equal('Updated LastName');
        });
    });

    describe('Retrieve Customer Addresses', () => {
        it('Should be retrieve address', async function () {
            const msg = {
                body: {
                    path: {
                        addressId: firstAddressId
                    }
                }
            };
            await actionRetrieveCustomerAddress.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData.customer_id).to.be.equal(customerId);
        });
    });

    describe('Delete Customer Addresses', () => {
        it('Should be deleted customer address', async function () {
            const msg = {
                body: {
                    path: {
                        addressId: secondAddressId
                    }
                }
            };
            await actionDeleteCustomerAddress.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
        });
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

            expect(emitter.emit.getCall(0).args[1].body.responseData.email).to.be.equal(email);
            expect(emitter.emit.getCall(0).args[1].body.responseData.addresses).to.have.lengthOf(1);
        });
    });

    describe('Delete Customer by id', function () {
        it('Delete customer', async function () {
            const msg = {
                body: {
                    path: {
                        customerId
                    }
                }
            };
            await actionDeleteCustomer.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.be.equal(true);
        });
    });
});
