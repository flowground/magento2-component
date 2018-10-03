'use strict';
const querystring = require('querystring');
const { messages } = require('elasticio-node');
const { getBaseUrlAndService, getMetaModelHelper } = require('../helpers');

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
//         "queryString": 'searchCriteria[pageSize]=2'
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
    const baseUrlAndService = await getBaseUrlAndService(msg, cfg);
    const { baseUrl } = baseUrlAndService;
    const { service } = baseUrlAndService;

    const queryString = getFormattedQueryString(msg.body.query || {}, msg.body.queryString || '');

    console.log('queryString', queryString);

    const productResponse = await service.get(`${baseUrl}/orders?${queryString}`);

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

exports.getMetaModel = async function getMetaModel(cfg) {
    return await getMetaModelHelper(cfg, './lib/schemas/retrieveSalesOrdersList.in.json',
        './lib/schemas/retrieveSalesOrdersList.out.json');
};
