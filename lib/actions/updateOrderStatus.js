`use strict`;

const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const axios = require('axios');

exports.process = processAction;
// navision context
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
        let id = msg.body.id;
        switch (msg.body.state) {
            case 'Shipped': await service.post(`order/${id}/ship`); break;
            case 'Payment received': await service.post(`order/${id}/invoice`); break;
            default: console.log(`No Magento action for ${msg.body.state}`)
        }
        this.emit('data', messages.newMessageWithBody({ok: true}));
    } catch (e) {
        console.log(e)
        this.emit('error', e.response.data);
    } finally {
        this.emit('end');
    }
}
