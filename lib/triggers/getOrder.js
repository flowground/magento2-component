`use strict`;

const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const axios = require('axios');

exports.process = processAction;

async function processAction(msg, cfg, snapshot) {
    try {
        const authResponse = await axios.post(`${cfg.url}/rest/V1/integration/admin/token`,
            {username: cfg.username, password: cfg.password});
        const service = axios.create({
            baseURL: cfg.url + '/rest/V1',
            validateStatus: function (status) {
                return [200, 201, 404].includes(status)
            },
            headers: {
                Authorization: 'Bearer ' + authResponse.data
            }
        });
        let searchCriteria = 'searchCriteria';
        if (snapshot) {
            searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=updated_at&searchCriteria[filter_groups][0][filters][0][value]=${snapshot}&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`;
        }
        let orderResponse = await service.get(`orders/?${searchCriteria}`);
        let orders = orderResponse.data.items;
        console.log(JSON.stringify(orders[0]))
        //let update = await service.post('order/000000004/ship')
        //console.log(update.data)
        snapshot = orders.reduce((date, customer) => {
            if (customer.updated_at > date) return customer.updated_at;
        }, snapshot || '');
        this.emit('snapshot', snapshot);
    } catch (e) {
        console.log(e)
        this.emit('error', e.response.data);
    } finally {
        this.emit('end');
    }
}

processAction.bind({emit: console.log})({}, {
    url: 'http://magento2.fabric-house.xyz',
    username: 'fabrichouse',
    password: 'r4E2WS2Z'
}, '2017-03-27 18:31:11')

/*
 On Hold - orders/000000001/hold
 Pending - orders/id/unhold
 Processing - order/id/ship
 Complete - order/id/invoice
 Canceled - orders/id/cancel
 */
