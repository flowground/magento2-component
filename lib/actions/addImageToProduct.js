'use strict';
const querystring = require('querystring');
const { messages } = require('elasticio-node');
const axios = require('axios');

exports.process = action;

// exec({
//     body: {
//     	"path": {
//     		"sku": "24-MB02"
//     	},
//     	"body": {
//     		"entry": {
//     			"media_type": "image",
//     			"label": "string_3682",
//     			"disabled": false,
//     			"types": [],
//     			"content": {
//     				"base64_encoded_data": "iVBORw0KGgoAAAANSUhEUgAAAAUA AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO 9TXL0Y4OHwAAAABJRU5ErkJggg==",
//     				"type": "image/png",
//     				"name": "helloworld112"
//     			},
//     			"extension_attributes": {}
//     		}
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

    const response = await service.post(
        `${baseUrl}/products/${msg.body.path.sku}/media`,
        msg.body.body
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
