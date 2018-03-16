`use strict`;
const { messages } = require('elasticio-node');
const axios = require('axios');

exports.process = action;

// const msg = {
//     body: {
//         stockItem: {
//             item_id: 2065,
//             product_id: 2112,
//             stock_id: 1,
//             qty: 250,
//             is_in_stock: true,
//             is_qty_decimal: true,
//             show_default_notification_message: false,
//             use_config_min_qty: true,
//             min_qty: 0,
//             use_config_min_sale_qty: 1,
//             min_sale_qty: 1,
//             use_config_max_sale_qty: false,
//             max_sale_qty: 0.8265,
//             use_config_backorders: true,
//             backorders: 0,
//             use_config_notify_stock_qty: true,
//             notify_stock_qty: 1,
//             use_config_qty_increments: true,
//             qty_increments: 1,
//             use_config_enable_qty_inc: false,
//             enable_qty_increments: true,
//             use_config_manage_stock: true,
//             manage_stock: true,
//             low_stock_date: null,
//             is_decimal_divided: false,
//             stock_status_changed_auto: 0
//         },
//         productSku: 'string_1671-134'
//     }
// };

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

    const inventoryData = {
        stockItem: msg.body.stockItem
    };

    const productSku = msg.body.productSku;

    console.log('request object:', JSON.stringify(inventoryData));

    const productResponse = await service.put(
        `${baseUrl}/products/${productSku}/stockItems/${inventoryData.stockItem.item_id}`,
        inventoryData
    );

    console.log('response data:', JSON.stringify(productResponse.data));

    this.emit('data', messages.newMessageWithBody({ responseData: productResponse.data }));
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
