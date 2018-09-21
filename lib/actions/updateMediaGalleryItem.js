'use strict';
const { messages } = require('elasticio-node');
const { getBaseUrlAndService, getMetaModelHelper } = require('../helpers');

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
    const baseUrlAndService = await getBaseUrlAndService(msg, cfg);
    const { baseUrl } = baseUrlAndService;
    const { service } = baseUrlAndService;

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

exports.getMetaModel = async function getMetaModel(cfg) {
    return await getMetaModelHelper(cfg, './lib/schemas/updateMediaGalleryItem.in.json',
        './lib/schemas/updateMediaGalleryItem.out.json');
};
