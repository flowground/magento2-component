'use strict';
const querystring = require('querystring');
const { messages } = require('elasticio-node');
const axios = require('axios');

exports.process = action;

// exec({
//     body: {
//     	"path": {
//     		"sku": "string 2669",
//     		"entryId": "string 2131"
//     	},
//     	"body": {
//     		"entry": {
//     			"id": 138,
//     			"media_type": "string 6550",
//     			"label": "string 4635",
//     			"position": 133,
//     			"disabled": true,
//     			"types": [
//     				"string 5061",
//     				"string 4870"
//     			],
//     			"file": "string 9447",
//     			"content": {
//     				"base64_encoded_data": "string 2316",
//     				"type": "string 1325",
//     				"name": "string 6394"
//     			},
//     			"extension_attributes": {
//     				"video_content": {
//     					"media_type": "string 233",
//     					"video_provider": "string 9065",
//     					"video_url": "string 1394",
//     					"video_title": "string 6527",
//     					"video_description": "string 8270",
//     					"video_metadata": "string 7343"
//     				}
//     			}
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

    const response = await service.put(
        `${baseUrl}/products/${msg.body.path.sku}/media/${msg.body.path.entryId}`,
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
