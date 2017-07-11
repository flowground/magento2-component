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

        if (msg.body.prices && msg.body.prices.length) {
            let customersGroupsResponse = await service.get(`customerGroups/search?searchCriteria`);
            let groups = customersGroupsResponse.data.items;
            await Promise.all(msg.body.prices.map(async (price) => {
                let group = groups.filter((g) => g.code === price.customer_group_code).pop();
                if (!group && price.customer_group_code !== '') {
                    throw `Customer group id with code ${price.customer_group_code} doesn't exist on magento`;
                }
                if (price.qty === '0') {
                    price.qty = 1
                }
                try {
                    await service.post(`products/${msg.body.sku}/group-prices/${group.id}/tiers/${price.qty}/price/${price.price}`);
                } catch (e) {
                    console.log('first try failed')
                }
                try {
                    await service.post(`products/${msg.body.sku}/group-prices/${group.id}/tiers/${price.qty}/price/${price.price}`);
                } catch (e) {
                    console.log('second try failed')
                }
            }))
        }
        this.emit('data', messages.newMessageWithBody({sku: msg.body.sku}));
    } catch (e) {
        console.log(e);
        this.emit('error', e.response ? e.response.data : e);
    } finally {
        this.emit('end');
    }
}
