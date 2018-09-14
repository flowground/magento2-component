`use strict`;

const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const axios = require('axios');

exports.process = trigger;

async function trigger(msg, cfg, snapshot) {
    try {
        console.log('start trigger')
        console.log('snapshot ', snapshot)
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
        let searchCriteria = 'searchCriteria=searchCriteria';
        if (snapshot.updated_at) {
            searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=updated_at&searchCriteria[filter_groups][0][filters][0][value]=${snapshot.updated_at}&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`;
        }
        let customersGroupsResponse = await service.get(`customerGroups/search?searchCriteria=searchCriteria`);
        let groups = customersGroupsResponse.data.items;
        let customersResponse = await service.get(`customers/search?${searchCriteria}`);
        console.log(customersResponse.data)
        let customers = customersResponse.data.items;
        customers.map((customer) => {
            let group = groups.filter((g) => g.id === customer.group_id).pop();
            if (group) {
                customer.group_code = group.code;
            } else {
                customer.group_code = null;
            }
            if (customer.addresses) {
                customer.addresses = customer.addresses.map((a) => {
                    a.street = a.street.map((s) => {
                        return {name: s}
                    });
                    return a;
                });
            }
            this.emit('data', messages.newMessageWithBody(customer));
        });
        let updated_at = customers.reduce((date, customer) => {

            if (customer.updated_at > date) return customer.updated_at;
            return date;
        }, snapshot.updated_at || '');
        this.emit('snapshot', {updated_at});
    } catch (e) {
        console.log(e);
        this.emit('error', e.response ? e.response.data : e);
    } finally {
        this.emit('end');
    }
}
