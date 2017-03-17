`use strict`;
console.log('action file is loaded')
const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const axios = require('axios');
const ENTITY_TYPE_ID_PRODUCT = 4;
const DEFAULT_ATTRIBUTE_SET_ID = 4; // used as skeleton to create new ones

console.log('modules are loaded')
module.exports.process = async function action(msg, cfg) {
    console.log('run action!')
    try {
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
        let productData = {
            name: msg.body.name,
            price: msg.body.price,
            weight: msg.body.weight,
            customAttributes: []
        };
        let attrsResponse = await service.get('/products/attributes?search_criteria');
        let attrs = attrsResponse.data.items;
        let inputAttributes = msg.body.attributes;
        for (let inputAttr of inputAttributes) {
            let attr = attrs.filter((attr) => inputAttr.key === attr.attribute_code).pop();
            if (!attr) {
                let attrData = {
                    attribute_code: inputAttr.key,
                    frontend_input: inputAttr.type,
                    entity_type_id: ENTITY_TYPE_ID_PRODUCT,
                    is_required: false,
                    default_frontend_label: inputAttr.label
                };
                if (['select', 'multiselect'].includes(inputAttr.type)) {
                    attrData.options = [{
                        label: inputAttr.value,
                        is_default: true
                    }];
                }
                let attrCreateResponse = await service.post('/products/attributes', {
                    attribute: attrData
                });
                attr = attrCreateResponse.data;
            }
            let attrValue;
            if (['select', 'multiselect'].includes(attr.frontend_input)) {
                attrValue = attr.options.filter((option) => option.label === inputAttr.value).pop();
                if (!attrValue) {
                    attr.options.push({
                       label: inputAttr.value
                    });
                    let attrUpdateResponse = await service.put(`/products/attributes/${attr.attribute_code}`, {
                        attribute: attr
                    });
                    attr = attrUpdateResponse.data;
                    attrValue = attr.options.filter((option) => option.label === inputAttr.value).pop();
                }
                if (attr.frontend_input === 'select') {
                    attrValue = attrValue.value;
                } else {
                    attrValue = [attrValue.value];
                }
            } else {
                // for text type
                attrValue = inputAttr.value;
            }
            productData.customAttributes.push({
                attribute_code: attr.attribute_code,
                value: attrValue
            });
        }
        let inputAttributeSetName = msg.body.attribute_set_name;
        if (inputAttributeSetName) {
            let attributesSetsResponse = await service.get('/products/attribute-sets/sets/list?search_criteria');
            let attributesSets = attributesSetsResponse.data.items;
            let attributeSet = attributesSets.filter((as) => as.attribute_set_name === inputAttributeSetName).pop();
            if (attributeSet) {
                productData.attributeSetId = attributeSet.attribute_set_id;
            } else {
                let createAttributeSetResponse = await service.post('/products/attribute-sets', {
                    attributeSet: {
                        attribute_set_name: inputAttributeSetName,
                        entity_type_id: ENTITY_TYPE_ID_PRODUCT
                    },
                    skeletonId: DEFAULT_ATTRIBUTE_SET_ID
                });
                productData.attributeSetId = createAttributeSetResponse.data.attribute_set_id;
            }
        } else {
            productData.attributeSetId = DEFAULT_ATTRIBUTE_SET_ID
        }
        let productResponse = await service.get(`/products/${msg.body.sku}`);
        let product;
        if (productResponse.status === 200) {
            let updateProductResponse = await service.put(`/products/${msg.body.sku}`, {
                product: productData
            });
            product = updateProductResponse.data;
        } else {
            productData.sku = msg.body.sku;
            let createProductResponse = await service.post('/products/', {
                product: productData
            });
            product = createProductResponse.data;
        }
        this.emit('data', messages.newMessageWithBody(product));
    } catch (e) {
        this.emit('error', e.response.data);
    } finally {
        this.emit('end');
    }
}
