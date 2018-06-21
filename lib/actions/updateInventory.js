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

    var inventoryData = {
        stockItem: msg.body.stockItem
    };

    const productSku = msg.body.productSku;


    /*
        https://github.com/elasticio/magento2-component/issues/17
    * */
    console.log(`request to: ${baseUrl}/stockItems/${msg.body.path.productSku}`);

    const getResponse = await service.get(
        `${baseUrl}/stockItems/${msg.body.path.productSku}`
    );

    console.log('response data from GET request:', JSON.stringify(getResponse));


    inventoryData.stockItem.item_id = inventoryData.stockItem.item_id || getResponse.data.itemId;
    inventoryData.stockItem.product_id = inventoryData.stockItem.product_id || getResponse.data.productId;
    inventoryData.stockItem.stock_id = inventoryData.stockItem.stock_id || getResponse.data.stockId;
//    inventoryData.stockItem.qty = inventoryData.stockItem.qty || getResponse.data.qty;
//    inventoryData.stockItem.is_in_stock = inventoryData.stockItem.is_in_stock || getResponse.data.isInStock;
    inventoryData.stockItem.is_qty_decimal = inventoryData.stockItem.is_qty_decimal || getResponse.data.isQtyDecimal;
    inventoryData.stockItem.show_default_notification_message = inventoryData.stockItem.show_default_notification_message || getResponse.data.showDefaultNotificationMessage;
    inventoryData.stockItem.use_config_min_qty = inventoryData.stockItem.use_config_min_qty || getResponse.data.useConfigMinQty;
    inventoryData.stockItem.min_qty = inventoryData.stockItem.min_qty || getResponse.data.minQty;
    inventoryData.stockItem.use_config_min_sale_qty = inventoryData.stockItem.use_config_min_sale_qty || getResponse.data.useConfigMinSaleQty;
    inventoryData.stockItem.min_sale_qty = inventoryData.stockItem.min_sale_qty || getResponse.data.minSaleQty;
    inventoryData.stockItem.use_config_max_sale_qty = inventoryData.stockItem.use_config_max_sale_qty || getResponse.data.useConfigMaxSaleQty;
    inventoryData.stockItem.max_sale_qty = inventoryData.stockItem.max_sale_qty || getResponse.data.maxSaleQty;
    inventoryData.stockItem.use_config_backorders = inventoryData.stockItem.use_config_backorders || getResponse.data.useConfigBackorders;
    inventoryData.stockItem.backorders = inventoryData.stockItem.backorders || getResponse.data.backorders;
    inventoryData.stockItem.use_config_notify_stock_qty = inventoryData.stockItem.use_config_notify_stock_qty || getResponse.data.useConfigNotifyStockQty;
    inventoryData.stockItem.notify_stock_qty = inventoryData.stockItem.notify_stock_qty || getResponse.data.notifyStockQty;
    inventoryData.stockItem.use_config_qty_increments = inventoryData.stockItem.use_config_qty_increments || getResponse.data.useConfigQtyIncrements;
    inventoryData.stockItem.qty_increments = inventoryData.stockItem.qty_increments || getResponse.data.qtyIncrements;
    inventoryData.stockItem.use_config_enable_qty_inc = inventoryData.stockItem.use_config_enable_qty_inc || getResponse.data.useConfigEnableQtyInc;
    inventoryData.stockItem.enable_qty_increments = inventoryData.stockItem.enable_qty_increments || getResponse.data.enableQtyIncrements;
    inventoryData.stockItem.use_config_manage_stock = inventoryData.stockItem.use_config_manage_stock || getResponse.data.useConfigManageStock;
    inventoryData.stockItem.manage_stock = inventoryData.stockItem.manage_stock || getResponse.data.manageStock;
    inventoryData.stockItem.low_stock_date = inventoryData.stockItem.low_stock_date || getResponse.data.lowStockDate;
    inventoryData.stockItem.is_decimal_divided = inventoryData.stockItem.is_decimal_divided || getResponse.data.isDecimalDivided;
    inventoryData.stockItem.stock_status_changed_auto = inventoryData.stockItem.stock_status_changed_auto || getResponse.data.stockStatusChangedAuto;
    inventoryData.stockItem.extension_attributes = inventoryData.stockItem.extension_attributes || getResponse.data.extensionAttributes;

    inventoryData.stockItem.is_in_stock = inventoryData.stockItem.is_in_stock || inventoryData.stockItem.qty > 0;

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
