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
                return [200, 201, 404, 400].includes(status)
            },
            headers: {
                Authorization: 'Bearer ' + authResponse.data
            }
        });

        const mainProductResponse = await service.get(`/products/${msg.body.sku}`);
        const mainProduct = mainProductResponse.data;

        await Promise.all(msg.body.pieces.map(async (p) => {
            /*
             VISIBILITY_BOTH = 4
             VISIBILITY_IN_CATALOG = 2
             VISIBILITY_IN_SEARCH = 3
             VISIBILITY_NOT_VISIBLE = 1
             */
            let price = mainProduct.tier_prices.reduce((acc, p) => {
                if (p.value > acc) return p.value
                return acc
            }, 0);
            price = Math.max.apply(this, mainProduct.tier_prices.map((p) => p.Unit_Price))
            price = Math.round(price * cfg.priceMultiplier * 100)/100;
            let productData = {
                name: p.sku,
                sku: p.sku,
                price,
                weight: 0,
                visibility: 1,
                attributeSetId: DEFAULT_ATTRIBUTE_SET_ID
            };
            productData.extensionAttributes = {
                stockItem: {
                    qty: p.qty,
                    isInStock: true,
                    isQtyDecimal: true
                }
            };
            console.log(productData);
            let productResponse = await service.get(`/products/${p.sku}`);
            let updateProductResponse
            if (productResponse.status !== 200) {
                let tries = 3

                while (tries--) {
                    let createProductResponse = await service.post('/products/', {product: productData});
                    console.log(`product ${p.sku} created with status ${createProductResponse.status}`)

                    productData.price = price
                    updateProductResponse = await service.put(`/products/${p.sku}`, {
                        product: productData
                    });
                    console.log(`product ${p.sku} updated with status ${updateProductResponse.status}`)
                    if (productResponse.status !== 400) {
                        break
                    }
                }
            }
            await Promise.all(mainProduct.tier_prices.map(async (price) => {
                let tries = 5
                while (tries--) {
                    let r = await service.post(`products/${p.sku}/group-prices/${price.customer_group_id}/tiers/${price.qty}/price/${Math.round(price.value * cfg.priceMultiplier * 100)/100}`);
                    if (r.status !== 400) {
                        break
                    } else {
                        console.log(`Magento returned status code ${r.status}`)
                        console.log(`${tries} tries left`)
                    }
                }
                
                // if (r.status !== 200) {
                //     productData.price = 0
                //     updateProductResponse = await service.put(`/products/${p.sku}`, {
                //         product: productData
                //     });
                //     r = await service.post(`products/${p.sku}/group-prices/${price.customer_group_id}/tiers/${price.qty}/price/${Math.round(price.value * cfg.priceMultiplier * 100)/100}`);
                //     if (r.status !== 200) {
                //         console.log(updateProductResponse)
                //         throw new Error(`Problem with creation ${JSON.stringify(price)} for ${p.sku}, ${JSON.stringify(r.data)}`)
                //     }
                // }
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
        console.log(e.response)
        if (e.response && e.response.status === 500) {
            this.emit('rebound', 'Magento returned 500 status')
        } else {
            this.emit('error', e.response ? e.response.data : e);
        }
    } finally {
        this.emit('end');
    }
}
