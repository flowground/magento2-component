`use strict`;
const { messages } = require('elasticio-node');
const { getBaseUrlAndService, getMetaModelHelper } = require('../helpers');

exports.process = action;

// exec({
//     body: {
//         path: {
//             customerId: 6
//         }
//     }
// }, {
//     url: 'http',
//     username: 'usernam',
//     password: 'password'
// }).catch(err => {
//     console.log('err', err);
//     console.log('err.response', err.response);
// });

async function exec(msg, cfg) {
    const baseUrlAndService = await getBaseUrlAndService(msg, cfg);
    const { baseUrl } = baseUrlAndService;
    const { service } = baseUrlAndService;

    const productResponse = await service.delete(`${baseUrl}/customers/${msg.body.path.customerId}`);

    console.log('response.status:', productResponse.status);

    console.log('response.data:', JSON.stringify(productResponse.data));

    this.emit('data', messages.newMessageWithBody({ responseData: productResponse.data }));
}

async function action(msg, cfg) {
    try {
        await exec.bind(this)(msg, cfg);
    } catch (e) {
        this.emit('error', e);

        for (let i = 0; i < 20; i++) {
            console.log('e.response.data', e.response.data);
        }
    } finally {
        this.emit('end');
    }
}

exports.getMetaModel = async function getMetaModel(cfg) {
    return await getMetaModelHelper(cfg, './lib/schemas/deleteCustomer.in.json',
        './lib/schemas/deleteCustomer.out.json');
};
