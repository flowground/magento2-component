`use strict`;
const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const axios = require('axios');

exports.process = action;

async function action (msg, cfg) {
    try {
        const authResponse = await axios.post(`${cfg.url}/rest/V1/integration/admin/token`,
            {username: cfg.username, password: cfg.password});
        const service = axios.create({
            baseURL: cfg.url + '/rest/V1',
            headers: {
                Authorization: 'Bearer ' + authResponse.data
            }
        });
        let customersGroupsResponse = await service.get(`customerGroups/search?searchCriteria`);
        let groups = customersGroupsResponse.data.items;
        let group = groups.filter((g) => g.code === msg.body.customer_group_code).pop();
        if (!group) {
            throw `Customer group id with code ${msg.body.customer_group_code} doesn't exist on magento`;
        }
        let addPriceResponse = await service.post(`products/${msg.body.sku}/group-prices/${group.id}/tiers/${msg.body.qty}/price/${msg.body.price}`);
        this.emit('data', messages.newMessageWithBody({ok: addPriceResponse.data}));
    } catch (e) {
        console.log(e);
        this.emit('error', e.response ? e.response.data : e);
    } finally {
        this.emit('end');
    }
}
