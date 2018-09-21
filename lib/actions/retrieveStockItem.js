'use strict';
const { messages } = require('elasticio-node');
const { getBaseUrlAndService, getMetaModelHelper } = require('../helpers');

exports.process = action;

// exec({
//     body: {
//     	"path": {
//     		"productSku": "24-MB01"
//     	},
//     	"query": {
//     		"scopeId": 1
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

    const response = await service.get(
        `${baseUrl}/stockItems/${msg.body.path.productSku}?scopeId=${msg.body.query.scopeId}`
    );

    console.log('response.status:', response.status);

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
    return await getMetaModelHelper(cfg, './lib/schemas/retrieveStockItem.in.json',
        './lib/schemas/retrieveStockItem.out.json');
};
