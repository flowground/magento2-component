/* eslint-disable no-unused-expressions */
'use strict';

const {expect} = require('chai');
const fs = require('fs');
const sinon = require('sinon');

const actionRetrieveSalesOrdersList = require('../../lib/actions/retrieveSalesOrdersList.js');
const actionRetrieveSalesOrder = require('../../lib/actions/retrieveSalesOrder.js');
const actionRetrieveSalesOrderComments = require('../../lib/actions/retrieveSalesOrderComments.js');

describe('Customers Actions Integration Test', function () {
    let url;
    let username;
    let password;
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

    describe('Retrieve Sales Orders List', () => {
        it('Retrieve Sales Orders List with criteria searchCriteria[pageSize] = 1', async function () {
            const msg = {
                body: {
                    query: {
                        'searchCriteria[pageSize]': 1
                    }
                }
            };
            await actionRetrieveSalesOrdersList.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.have.property('total_count');
        });
    });

    describe('Retrieve Sales Order', () => {
        it('Retrieve Sales Order with id = 1', async function () {
            const msg = {
                body: {
                    path: {
                        id: 1
                    }
                }
            };
            await actionRetrieveSalesOrder.process.call(emitter, msg, cfg, null);
            expect(emitter.emit.getCall(0).args[1].body.responseData.entity_id).to.be.equal(1);
        });
    });

    describe('Retrieve Sales Order Comments', () => {
        it('Retrieve Sales Order Comments with id = 2', async function () {
            const msg = {
                body: {
                    path: {
                        id: 2
                    }
                }
            };
            await actionRetrieveSalesOrderComments.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData).to.have.property('total_count');
        });
    });

});
