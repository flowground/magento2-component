'use strict';
const { messages } = require('elasticio-node');
const { getBaseUrlAndService, getMetaModelHelper } = require('../helpers');

exports.process = action;

// exec({
//     body: {
//     	"path": {
//     		"sku": "24-MB02",
//     		"entryId": 3425
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
        `${baseUrl}/products/${msg.body.path.sku}/media/${msg.body.path.entryId}`
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
    return await getMetaModelHelper(cfg, './lib/schemas/deleteMediaGalleryItem.in.json',
        './lib/schemas/deleteMediaGalleryItem.out.json');
};
