'use strict';
const axios = require('axios');
const fs = require('fs');

module.exports.getBaseUrlAndService = getBaseUrlAndService;
module.exports.getMetaModelHelper = getMetaModelHelper;
module.exports.getStoreCodeSelectModel = getStoreCodeSelectModel;

async function getStoreCodes(cfg) {

    console.log('Node version is: ' + process.version);

    const {data: token} = await axios.post(
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
        `${baseUrl}/store/storeViews`
    );

    let storesCode = response.data;
    let allCode = ['all'];
    allCode.push(...storesCode.map(item => item.code));
    return allCode;
}

async function getBaseUrlAndService(msg, cfg) {
    console.log('Node version is: ' + process.version);

    const {data: token} = await axios.post(
        `${cfg.url}/rest/V1/integration/admin/token`, {
            username: cfg.username,
            password: cfg.password
        }
    );

    let baseUrl = `${cfg.url}/rest/V1`;
    if (cfg.store) {
        baseUrl = `${cfg.url}/rest${'/' + cfg.store}/V1`;
    } else if (msg.body) {
        if (msg.body.store) {
            baseUrl = `${cfg.url}/rest${'/' + msg.body.store}/V1`;
        }
    }

    const service = await axios.create({
        baseUrl,
        validateStatus: status => [200, 201, 404].includes(status),
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return {
        baseUrl: baseUrl,
        service: service
    };
}

async function getMetaModelHelper(cfg, inputMetaFile, outputMetaFile) {
    const inputMeta = JSON.parse(fs.readFileSync(inputMetaFile));
    inputMeta.properties.store = {
        type: 'string',
        required: false,
        enum: await getStoreCodes(cfg)
    };
    const outputMeta = JSON.parse(fs.readFileSync(outputMetaFile));
    return {
        in: inputMeta,
        out: outputMeta
    };
}

async function getStoreCodeSelectModel(cfg) {
    let listStoreCodes = await getStoreCodes(cfg);
    return listStoreCodes.reduce((optionsSoFar, item) => {
        optionsSoFar[item] = item;
        return optionsSoFar;
    }, {});
}
