'use strict';

const sinon = require('sinon');
require('chai').should();
const action = require('../../lib/actions/upsertProduct');
const nock = require('nock');

const cfg = {
    url: 'http://localhost',
    username: 'magento overlord',
    password: 'otnegam'
};
describe('Magento 2 upsert product action', () => {
    describe('when request data doen\'t contain "sku" field', () => {
        const emit = sinon.spy();

        it('should emit error', async () => {
            await action.process.bind({
                emit
            })({
                body: {
                    product: {
                        // sku: 'testtesttest3',
                        price: 364.99
                    },
                    saveOptions: true
                }
            }, cfg);

            emit.getCall(0).args[0].should.be.eq('error');
            emit.getCall(0).args[1].message.should.be.eq('"sku" is required');
        });
    });
});
