`use strict`;
const { messages } = require('elasticio-node');
const axios = require('axios');

exports.process = action;

// const msg = {
//     body: {
//         body: {
//             "customer": {
//                 "email": "qweqweqwe@asdasd123.com",
//                 "firstname": "string123",
//                 "lastname": "string456",
//                 website_id:1
//             }
//         },
//         path: {
//             id: 6
//         }
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

    console.log('request object:', JSON.stringify(msg.body));

    const response = await service.put(
        `${baseUrl}/customers/${msg.body.path.id}`,
        msg.body.body
    );

    console.log('response.status', response.status);
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
