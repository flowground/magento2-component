`use strict`;

const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const axios = require('axios');

exports.process = processAction;

async function processAction(msg, cfg) {
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
        let orderResponse = await service.get('orders/000000001')

    } catch (e) {
        this.emit('error', e.response.data);
    } finally {
        this.emit('end');
    }
}

processAction.bind({emit: console.log})({}, {
    url: 'http://magento2.fabric-house.xyz',
    username: 'fabrichouse',
    password: 'r4E2WS2Z'
})
