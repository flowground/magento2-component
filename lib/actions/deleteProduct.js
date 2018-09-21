`use strict`;
const { messages } = require('elasticio-node');
const { getBaseUrlAndService, getMetaModelHelper } = require('../helpers');

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

// exec({
//     body: {
//         sku: 'testtesttest1'
//     }
// }, {
//     url: 'http',
//     username: 'usernam',
//     password: 'password'
// }).catch(err => {
//     console.log('err', err);
//     console.log('err.response', err.response);
// });

async function exec(msg, cfg) {
    const baseUrlAndService = await getBaseUrlAndService(msg, cfg);
    const { baseUrl } = baseUrlAndService;
    const { service } = baseUrlAndService;

    const productSku = msg.body.sku;

    console.log('productSku:', productSku);

    const productResponse = await service.delete(`${baseUrl}/products/${productSku}`);

    console.log('response.status:', productResponse.status);

    console.log('response.data:', JSON.stringify(productResponse.data));

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

exports.getMetaModel = async function getMetaModel(cfg) {
    return await getMetaModelHelper(cfg, './lib/schemas/deleteProduct.in.json',
        './lib/schemas/deleteProduct.out.json');
};
