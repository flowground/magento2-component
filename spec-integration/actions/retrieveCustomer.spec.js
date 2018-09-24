/* eslint-disable no-unused-expressions */
'use strict';

const {expect} = require('chai');
const fs = require('fs');
const sinon = require('sinon');

const action = require('../../lib/actions/retrieveCustomer.js');

describe('Integration Test', function () {
    let url;
    let username;
    let password;
    let customerId;
    let customerEmail;
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
            await action.process.call(emitter, msg, cfg, null);

            expect(emitter.emit.getCall(0).args[1].body.responseData.email).to.be.equal(customerEmail);
        });
    });
});
