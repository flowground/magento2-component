'use strict';
const querystring = require('querystring');
const { messages } = require('elasticio-node');
const axios = require('axios');

exports.process = action;

// exec({
//     body: {
//         query: {
//             scopeId: 0,
//             qty: 300,
//             pageSize: 3
//         }
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

    const queryString = getFormattedQueryString(msg.body.query || {}, msg.body.queryString || '');

    console.log('queryString', queryString);

    const productResponse = await service.get(`${baseUrl}/stockItems/lowStock?${queryString}`);

    console.log('response.status:', productResponse.status);

    this.emit('data', messages.newMessageWithBody({ responseData: productResponse.data }));
}

function getFormattedQueryString(queryParams, queryString) {
    function filterQueryParams(queryParams) {
        return Object.keys(queryParams).reduce((newQueryParams, queryKey) => {
            if (!queryParams[queryKey] && queryParams[queryKey] !== 0) {
                return newQueryParams;
            }

            newQueryParams[queryKey] = queryParams[queryKey];

            return newQueryParams;
        }, {});
    }

    return querystring.stringify(filterQueryParams(queryParams));
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
