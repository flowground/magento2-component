/* eslint-disable no-invalid-this */
'use strict';
const querystring = require('querystring');
const {messages} = require('elasticio-node');
const axios = require('axios');
const fs = require('fs');
const {getStoreCodes} = require('../helpers');

exports.process = action;

// exec({
//     body: {
//     	"path": {
//     		"sku": "24-MB01"
//     	},
//     	"query": {
//     		"editMode": true,
//     		"storeId": 1,
//     		"forceReload": false
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
    console.log('Node version is: ' + process.version);

    const {data: token} = await axios.post(
        `${cfg.url}/rest/V1/integration/admin/token`, {
            username: cfg.username,
            password: cfg.password
        }
    );

    const baseUrl = `${cfg.url}/rest${msg.body.path.store ? '/' + msg.body.path.store : ''}/V1`;


    const service = await axios.create({
        baseUrl,
        validateStatus: status => [200, 201, 404].includes(status),
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const response = await service.get(
        `${baseUrl}/products/${msg.body.path.sku}?${querystring.stringify(msg.body.query)}`
    );

    console.log('response.status', response.status);
    console.log('response.data', response.data);

    this.emit('data', messages.newMessageWithBody({
        responseData: response.data
    }));
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
    const inputMeta = JSON.parse(
        fs.readFileSync('./lib/schemas/retrieveProduct.in.json'));
    inputMeta.properties.path.properties.store = await getStoreCodes(cfg);
    const outputMeta = JSON.parse(
        fs.readFileSync('./lib/schemas/retrieveProduct.out.json'));
    return {
        in: inputMeta,
        out: outputMeta
    };
}
