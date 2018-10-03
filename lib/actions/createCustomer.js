'use strict';
const { messages } = require('elasticio-node');
const {getBaseUrlAndService, getMetaModelHelper} = require('../helpers');

exports.process = action;

// const msg = {
//     body: {
//     	"body": {
//     		"customer": {
//     			"email": "asd2asdqwe@adfsdf.com",
//     			"firstname": "aqwe",
//     			"lastname": "skjdfw"
//     		}
//     	}
//     }
// };
//
// exec(msg, {
//     url: 'http',
//     username: 'usernam',
//     password: 'password'
// }).catch(err => {
//     console.log('err.response', err.response);
// });

async function exec(msg, cfg) {
    const baseUrlAndService = await getBaseUrlAndService(msg, cfg);
    const {baseUrl} = baseUrlAndService;
    const {service} = baseUrlAndService;

    const response = await service.post(
        `${baseUrl}/customers`,
        msg.body.body
    );

    console.log('response.status:', response.status);
    console.log('response data:', JSON.stringify(response.data));

    this.emit('data', messages.newMessageWithBody({responseData: response.data}));
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
    return await getMetaModelHelper(cfg, './lib/schemas/createCustomer.in.json',
        './lib/schemas/createCustomer.out.json');
};
