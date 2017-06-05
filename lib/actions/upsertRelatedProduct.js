`use strict`;
const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const axios = require('axios');
const DEFAULT_ATTRIBUTE_SET_ID = 4;

exports.process = action;

async function action (msg, cfg) {
    try {
        if (!msg.body.pieces || msg.body.pieces.length === 0) {
            this.emit('data', messages.newMessageWithBody({sku: msg.body.sku}));
            return;
        }
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

        const mainProductResponse = await service.get(`/products/${msg.body.sku}`);
        const mainProduct = mainProductResponse.data;

        await Promise.all(msg.body.pieces.map(async (p) => {
            let productData = {
                name: p.sku,
                sku: p.sku,
                price:'0',
                weight: 0,
                attributeSetId: DEFAULT_ATTRIBUTE_SET_ID
            };
            productData.extensionAttributes = {
                stockItem: {
                    qty: p.qty,
                    isInStock: true
                }
            };
            let productResponse = await service.get(`/products/${p.sku}`);
            if (productResponse.status !== 200) {
                await service.post('/products/', { product: productData});
                // this is dirty hack, because magento doesn't create 0 price on post request
                productData.price = 0
                await service.put(`/products/${p.sku}`, {
                    product: productData
                });
            }
            await Promise.all(mainProduct.tier_prices.map(async (price) => {
                await service.post(`products/${p.sku}/group-prices/${price.customer_group_id}/tiers/${price.qty}/price/${Math.round(price.value * cfg.priceMultiplier * 100)/100}`);
            }));
        }));

        let linkingResponse = await service.post(`products/${msg.body.sku}/links`, {
            items: msg.body.pieces.map((piece) => ({
                sku: msg.body.sku,
                link_type: 'related',
                linked_product_sku: piece.sku
            }))
        });

        this.emit('data', messages.newMessageWithBody({sku: msg.body.sku}));
    } catch (e) {
        console.log(e);
        this.emit('error', e.response ? e.response.data : e);
    } finally {
        this.emit('end');
    }
}