'use strict';
const querystring = require('querystring');
const { messages } = require('elasticio-node');
const axios = require('axios');

exports.process = action;

// exec({
//     body: {
//     	"query": {
//     		"searchCriteria[filterGroups][0][filters][0][field]": "",
//     		"searchCriteria[filterGroups][0][filters][0][value]": "",
//     		"searchCriteria[filterGroups][0][filters][0][conditionType]": "",
//     		"searchCriteria[sortOrders][][field]": "",
//     		"searchCriteria[sortOrders][][direction]": "",
//     		"searchCriteria[pageSize]": undefined,
//     		"searchCriteria[currentPage]": undefined
//     	},
//         "queryString": 'searchCriteria[pageSize]=77'
//     }
// }, {
//     url: 'http',
//     username: 'usernam',
//     password: 'password'
// }).catch(err => {
//     console.log('err', err);
//     console.log('err.response', err.response);
// });

// ?searchCriteria[filterGroups][0][filters][0][field]=sku&
//                               searchCriteria[filterGroups][0][filters][0][value]=24-MB01&
//                               searchCriteria[filterGroups][0][filters][0][conditionType]=eq

// available query params:
// {
//     "searchCriteria[filterGroups][][filters][][field]": {
//         "type": "string",
//         "required": false
//     },
//     "searchCriteria[filterGroups][][filters][][value]": {
//         "type": "string",
//         "required": false
//     },
//     "searchCriteria[filterGroups][][filters][][conditionType]": {
//         "type": "string",
//         "required": false
//     },
//     "searchCriteria[sortOrders][][field]": {
//         "type": "string",
//         "required": false
//     },
//     "searchCriteria[sortOrders][][direction]": {
//         "type": "string",
//         "required": false
//     },
//     "searchCriteria[pageSize]": {
//         "type": "integer",
//         "required": false
//     },
//     "searchCriteria[currentPage]": {
//         "type": "integer",
//         "required": false
//     }
// }

//  example msg.body data
// {
// 	"query": {
// 		"searchCriteria[filterGroups][][filters][][field]": "string 3811",
// 		"searchCriteria[filterGroups][][filters][][value]": "string 6588",
// 		"searchCriteria[filterGroups][][filters][][conditionType]": "string 4592",
// 		"searchCriteria[sortOrders][][field]": "string 4011",
// 		"searchCriteria[sortOrders][][direction]": "string 6405",
// 		"searchCriteria[pageSize]": 69,
// 		"searchCriteria[currentPage]": 824
// 	}
// }

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

    const response = await service.get(`${baseUrl}/customers/search?${queryString}`);

    console.log('response.status:', response.status);

    this.emit('data', messages.newMessageWithBody({responseData: response.data}));
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

    const stringifiedQueryParams = querystring.stringify(filterQueryParams(queryParams));
    const pastedQueryString = queryString ? `&${queryString}` : '';

    return `${stringifiedQueryParams}${pastedQueryString}` || 'searchCriteria';
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
