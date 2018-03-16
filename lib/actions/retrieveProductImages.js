'use strict';
const querystring = require('querystring');
const { messages } = require('elasticio-node');
const axios = require('axios');

exports.process = action;

// exec({
//     body: {
//     	"path": {
//     		"sku": "24-MB02"
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

    const response = await service.get(
        `${baseUrl}/products/${msg.body.path.sku}/media`
    );

    console.log('response.status', response.status);

    const images = response.data.filter(item => item.media_type === 'image');

    this.emit('data', messages.newMessageWithBody({ responseData: images }));
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
