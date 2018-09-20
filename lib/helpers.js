'use strict';
const axios = require('axios');
module.exports.getStoreCodes = getStoreCodes;
module.exports.getService = getBaseUrlAndService;

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
    return {
        type: 'string',
        required: false,
        enum: allCode
    };
}

async function getBaseUrlAndService(msg, cfg) {
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
    return {
        baseUrl: baseUrl,
        service: service
    };
}
