'use strict';
const axios = require('axios');
const fs = require('fs');

module.exports.getBaseUrlAndService = getBaseUrlAndService;
module.exports.getMetaModelHelper = getMetaModelHelper;
module.exports.getStoreCodeSelectModel = getStoreCodeSelectModel;
module.exports.getStoreCodes = getStoreCodes;
module.exports.verifyConfig = verifyConfig;
module.exports.getToken = getToken;
module.exports.getObjectSelectModel = getObjectSelectModel;

async function verifyConfig(cfg) {

    let username = cfg.username;
    let password = cfg.password;
    let integrationToken = cfg.integrationToken;
    if ((!username && !password && !integrationToken)
        || (!username && password && !integrationToken)
        || (!username && password && integrationToken)
        || (username && !password && !integrationToken)
        || (username && !password && integrationToken)
        || (username && password && integrationToken)
    ) {
        // console.error('You need to use one of options: Username and Password or Integration Token');
        throw new Error('You need to use one of options: Username and Password or Integration Token');
    }
}

async function getToken(cfg) {

    let url = cfg.url + '/rest/V1/integration/admin/token';
    let username = cfg.username;
    let password = cfg.password;
    let integrationToken = cfg.integrationToken;
    let token = null;
    if (username && password) {
        const result = await axios.post(
            url, {
                username,
                password
            }
        );
        if (!result || !result.data) {
            return token;
        } else {
            token = result.data;
        }
    } else if (integrationToken) {
        token = integrationToken;
    }
    return token;
}

async function getBaseUrlAndService(msg, cfg) {

    let token = await getToken(cfg);
    if (token !== null) {
        let baseUrl = `${cfg.url}/rest/V1`;
        if (cfg.store) {
            baseUrl = `${cfg.url}/rest/${cfg.store}/V1`;
        } else if (msg.body) {
            if (msg.body.store) {
                baseUrl = `${cfg.url}/rest/${msg.body.store}/V1`;
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
    } else {
        console.error('You need to use one of options: Username and Password or Integration Token');
        throw 'You need to use one of options: Username and Password or Integration Token';
    }

}

async function getStoreCodes(cfg) {

    const msg = {};
    const baseUrlAndService = await getBaseUrlAndService(msg, cfg);
    const {baseUrl, service} = baseUrlAndService;

    const response = await service.get(
        `${baseUrl}/store/storeViews`
    );

    let storesCode = response.data;
    let allCode = ['all'];
    allCode.push(...storesCode.map(item => item.code));
    console.log(allCode);
    return allCode;
}

async function getStoreCodeSelectModel(cfg) {
    let listStoreCodes = await getStoreCodes(cfg);
    return listStoreCodes.reduce((optionsSoFar, item) => {
        optionsSoFar[item] = item;
        return optionsSoFar;
    }, {});
}

async function getObjectSelectModel(cfg) {
    return {
        customers: 'customers',
        products: 'products'
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
