'use strict'
const axios = require('axios')
const messages = require('elasticio-node').messages
const debug  = require('debug')('getProduct');

exports.process = action

async function action(msg, cfg, snapshot) {
    try {
        debug('start trigger');
        debug('snapshot %o', snapshot);
        const API_URL = cfg.url;
        snapshot = snapshot || {};
        let token = (await axios.post(`${API_URL}/rest/V1/integration/admin/token`,
            {username: cfg.username, password: cfg.password})).data
        let options = {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }
        let products = (await axios.get(`${API_URL}/rest/V1/products?searchCriteria`, options)).data.items;
        let result = []
        for (let product of products) {
            debug("product: %o", JSON.stringify(products));
            if (snapshot[product.sku] === product.updated_at) {
                debug("continue for product: %o", product.sku);
                continue
            }
            snapshot[product.sku] = product.updated_at
            let fullProduct = (await axios.get(`${API_URL}/rest/V1/products/${product.sku}`, options)).data;
            debug("fullProduct: %o",JSON.stringify(fullProduct));
            let categoryIds = fullProduct.custom_attributes.filter((attr) => attr.attribute_code === 'category_ids').pop().value;
            debug("categoryIds: %o",categoryIds);
            let categories = []
            for (let categoryId of categoryIds) {
                let category = (await axios.get(`${API_URL}/rest/V1/categories/${categoryId}`, options)).data;
                if (category.parent_id) {
                    let parent = (await axios.get(`${API_URL}/rest/V1/categories/${category.parent_id}`, options)).data;
                    category.parent = parent.name
                }
                categories.push({
                    name: category.name,
                    parent: category.parent
                })
            }
            fullProduct.categories = categories;
            if (product.options) {
                for (let option of product.options) {
                    for (let variant of option.values) {
                        result.push({
                            name: fullProduct.name + ' ' + option.title + ': ' + variant.title,
                            price: variant.price,
                            sku: fullProduct.sku + '-' + option.option_id + '-' + variant.option_type_id,
                            categories
                        })
                    }
                }
            }
            const result = {
                name: fullProduct.name,
                price: fullProduct.price,
                sku: fullProduct.sku,
                categories
            }
            debug("emitting data %o", JSON.stringify(result));
            this.emit('data', messages.newMessageWithBody(result));
        }
        debug("emitting snapshot %o", snapshot);
        this.emit('snapshot', snapshot)
    } catch (error) {
        this.emit('error', error)
    } finally {
        this.emit('end')
    }
}
