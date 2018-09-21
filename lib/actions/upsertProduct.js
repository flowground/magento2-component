'use strict';

const { messages } = require('elasticio-node');
const { getBaseUrlAndService, getMetaModelHelper } = require('../helpers');

exports.process = action;

// const msg = {
//     body: {
//         "saveOptions": 1,
//         "product": {
//             "id": 2134,
//             "sku": "riversand",
//             "name": "riversand1",
//             "attribute_set_id": 4,
//             "price": 120,
//             "extension_attributes": {
//                     "stock_item": {
//                         "qty": 330,
//                         "is_in_stock": 0,
//                         "is_qty_decimal": 0,
//                         "show_default_notification_message": 0,
//                         "min_qty": 12,
//                         "use_config_min_qty": 1,
//                         "use_config_min_sale_qty": 1,
//                         "use_config_max_sale_qty": 1,
//                         "min_sale_qty": 12,
//                         "max_sale_qty": 23,
//                         "backorders": 12,
//                         "use_config_backorders": 1,
//                         "stock_status_changed_auto": 1,
//                         "is_decimal_divided": 0,
//                         "low_stock_date": "2018-02-24",
//                         "manage_stock": 0,
//                         "use_config_manage_stock": 1,
//                         "enable_qty_increments": 0,
//                         "use_config_enable_qty_inc": 1,
//                         "qty_increments": 1,
//                         "use_config_qty_increments": 1,
//                         "notify_stock_qty": 12,
//                         "use_config_notify_stock_qty": 1
//                     }
//             }
//         }
//     }
// };
//
// exec(msg, {
//     url: 'http',
//     username: 'usernam',
//     password: 'password'
// }).catch(err => {
//     console.log('errorrr');
//     // console.log('err', err);
//     console.log('err.response', err.response);
// });

// const asd = {
//     "product": {
//         "sku": "24-MB01",
//         "price": 123
//     },
//     "saveOptions": true
// }

async function exec(msg, cfg) {
    const baseUrlAndService = await getBaseUrlAndService(msg, cfg);
    const { baseUrl } = baseUrlAndService;
    const { service } = baseUrlAndService;

    const productData = msg.body;

    console.log('productData', JSON.stringify(productData));

    const productResponse = await service.get(`${baseUrl}/products/${productData.product.sku}`);

    let product;

    if (productResponse.status === 200) {
        const updateProductResponse = await service.put(`${baseUrl}/products/${productData.product.sku}`, productData);

        product = updateProductResponse.data;

        console.log(`${product.sku} updated with status ${product.status}`);
    } else {
        const createProductResponse = await service.post(`${baseUrl}/products/`, productData);

        console.log(`${productData.product.sku} created with status ${createProductResponse.status}`);

        // code below is dirty hack, because magento doesn't set price on post request

        if (!productData.product.price) {
            productData.product.price = 0;
        }

        console.log(`update ${productData.product.sku} with price ${productData.price}`);

        const updateProductResponse = await service.put(`${baseUrl}/products/${productData.product.sku}`, productData);

        product = updateProductResponse.data;

        console.log(`${product.sku} updated with status ${updateProductResponse.status}`);
    }

    console.log('product', product);

    this.emit('data', messages.newMessageWithBody({ responseData: product }));
}

async function action(msg, cfg) {
    try {
        validate(msg, cfg);

        await exec.bind(this)(msg, cfg);
    } catch (e) {
        this.emit('error', e);

        if (e.response) {
            for (let i = 0; i < 20; i++) {
                console.log('e.response.data', e.response.data);
            }
        }
    } finally {
        this.emit('end');
    }
}

function validate(msg, cfg) {
    if (!msg.body.product.sku) {
        throw new Error('"sku" is required');
    }
}

exports.getMetaModel = async function getMetaModel(cfg) {
    return await getMetaModelHelper(cfg, './lib/schemas/upsertProduct.in.json',
        './lib/schemas/upsertProduct.out.json');
};
