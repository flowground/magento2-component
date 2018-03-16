`use strict`;
const { messages } = require('elasticio-node');
const axios = require('axios');

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
    console.log('msg', JSON.stringify(msg));
    console.log('cfg', JSON.stringify(cfg));

    const { data: token } = await axios.post(
        `${cfg.url}/rest/V1/integration/admin/token`, {
            username: cfg.username,
            password: cfg.password
        }
    );

    const baseUrl = `${cfg.url}/rest/all/V1`;

    const service = await axios.create({
        baseUrl,
        validateStatus: status => [200, 201, 404].includes(status),
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

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
