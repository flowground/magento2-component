`use strict`;

const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const helpers = require('../helpers');
exports.getStoreCodeSelectModel = helpers.getStoreCodeSelectModel;
exports.getObjectSelectModel = helpers.getObjectSelectModel;
const {getBaseUrlAndService} = require('../helpers');

exports.process = trigger;

async function trigger(msg, cfg, snapshot) {
    const baseUrlAndService = await getBaseUrlAndService(msg, cfg);
    const {baseUrl, service} = baseUrlAndService;
    const pollingObject = cfg.pollingObject;
    let url;
    if (pollingObject === 'customers') {
        url = baseUrl + '/customers/search';
    } else if (pollingObject === 'products') {
        url = baseUrl + '/products';
    } else {
        throw 'Check config, you need select polling object';
    }
    let searchCriteria = '?searchCriteria=searchCriteria';
    if (snapshot.updated_at) {
        searchCriteria = '?searchCriteria[filter_groups][0][filters][0][field]=updated_at'
            + `&searchCriteria[filter_groups][0][filters][0][value]=${snapshot.updated_at}`
            + '&searchCriteria[filter_groups][0][filters][0][condition_type]=gt';
    }
    let searchObjectResponse = await service.get(`${url}${searchCriteria}`);
    let searchObjects = searchObjectResponse.data.items;
    for (let searchObject of searchObjects) {
        this.emit('data', messages.newMessageWithBody(searchObject));
    }
    let updated_at = searchObjects.reduce((date, item) => {
        if (item.updated_at > date) {
            return item.updated_at;
        }
        return date;
    }, snapshot.updated_at || '1970-01-01 00:00:00');
    console.log('snapshot', {
        updated_at
    });
    this.emit('snapshot', {
        updated_at
    });
}
