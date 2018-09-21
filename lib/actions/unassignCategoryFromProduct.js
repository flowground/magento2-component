'use strict';
const { messages } = require('elasticio-node');
const { getBaseUrlAndService, getMetaModelHelper } = require('../helpers');

exports.process = action;

// exec({
//     body: {
//     	"path": {
//     		"categoryId": "1",
//     		"sku": "24-MB01"
//     	}
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

    const response = await service.delete(
        `${baseUrl}/categories/${msg.body.path.categoryId}/products/${msg.body.path.sku}`
    );

    console.log('response.status', response.status);
    console.log('response.data', response.data);

    this.emit('data', messages.newMessageWithBody({responseData: response.data}));
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
    return await getMetaModelHelper(cfg, './lib/schemas/unassignCategoryFromProduct.in.json',
        './lib/schemas/unassignCategoryFromProduct.out.json');
};
