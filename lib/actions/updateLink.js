`use strict`;
const { messages } = require('elasticio-node');
const { getBaseUrlAndService, getMetaModelHelper } = require('../helpers');

exports.process = action;

// const msg = {
//     body: {
//         sku: "24-MB03",
//         items: [
//             {
//                 sku: "24-MB03",
//                 link_type: "related",
//                 linked_product_sku: "24-WB04",
//                 linked_product_type: "simple",
//                 position: 5,
//                 extension_attributes: {
//                 	qty: 3
//                 }
//             }
//         ]
//     }
// };
//
// exec(msg, {
//     url: 'http',
//     username: 'usernam',
//     password: 'password'
// }).catch(err => {
//     console.log('err.response', err.response);
// });

async function exec(msg, cfg) {
    const baseUrlAndService = await getBaseUrlAndService(msg, cfg);
    const { baseUrl } = baseUrlAndService;
    const { service } = baseUrlAndService;

    const entityData = {
        entity: msg.body.entity
    };

    const productSku = msg.body.sku;

    console.log('request object:', JSON.stringify(entityData));

    const productResponse = await service.put(
        `${baseUrl}/products/${productSku}/links`,
        entityData
    );

    console.log('response data:', JSON.stringify(productResponse.data));

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
    return await getMetaModelHelper(cfg, './lib/schemas/updateLink.in.json',
        './lib/schemas/updateLink.out.json');
};
