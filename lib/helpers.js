'use strict';
const axios = require('axios');

module.export.getStoreCodes = async function getStoreCodes(cfg) {

    console.log('Node version is: ' + process.version);
    console.log('cfg', JSON.stringify(cfg));

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
    console.log(allCode);
    return allCode;
};
