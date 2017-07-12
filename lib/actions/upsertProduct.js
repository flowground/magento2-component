`use strict`;
const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const axios = require('axios');
const ENTITY_TYPE_ID_PRODUCT = 4;
const crypto = require('crypto');

exports.process = action;

/**
 *
 * categories notation:
 * {
 *   cats: 'Root->Root sub category->...->Category name;Root->Root sub category->...->Category name'
 * }
 */

async function action (msg, cfg) {
    try {
        const authResponse = await axios.post(`${cfg.url}/rest/V1/integration/admin/token`,
            {username: cfg.username, password: cfg.password});
        console.log(JSON.stringify(msg.body))
        const service = axios.create({
            baseURL: cfg.url + '/rest/V1',
            validateStatus: function (status) {
               return [200, 201, 404].includes(status)
            },
            headers: {
               Authorization: 'Bearer ' + authResponse.data
            }
        });
        this.emit('data', messages.newMessageWithBody({sku: msg.body.sku}));
        return

        let productData = {
            name: msg.body.name,
            price: Number(msg.body.price),
            weight: Number(msg.body.weight) || 0,
            customAttributes: []
        };

        if (msg.body.qty) {
            productData.extensionAttributes = {
                stockItem: {
                    qty: msg.body.qty,
                    isInStock: true,
                    isQtyDecimal: true
                }
            }
        }
        productData.attributeSetId = await getAttributeSetId(service, msg.body.attribute_set_name);
        if (msg.body.attrs && msg.body.attrs.length) {
            productData.customAttributes = await getAttributes(service, msg.body.attrs);
        }
        if (msg.body.cats) {
            let categoriesIds = await getCategoriesIds(service, msg.body.cats.split(';'));
            productData.customAttributes.push({
                attribute_code: 'category_ids',
                value: categoriesIds
            });
        }
        let productResponse = await service.get(`/products/${msg.body.sku}`);

        if (productResponse.status === 200) {
            let updateProductResponse = await service.put(`/products/${msg.body.sku}`, {
                product: productData
            });
            console.log(`${msg.body.sku} updated with status ${updateProductResponse.status}`)
            product = updateProductResponse.data;
        } else {

            productData.sku = msg.body.sku;
            let createProductResponse = await service.post('/products/', {
                product: productData
            });
            console.log(`${msg.body.sku} created with status ${createProductResponse.status}`)
            // this is dirty hack, because magento doesn't set price on post request
            console.log(`${msg.body.sku} price ${msg.body.price}`)
            if (!Number(msg.body.price)) {
                productData.price = 0
            }
            console.log(`update ${msg.body.sku} with price ${msg.body.price}`)
            let updateProductResponse = await service.put(`/products/${msg.body.sku}`, {
                product: productData
            });
            product = updateProductResponse.data
            console.log(`${msg.body.sku} updated with status ${updateProductResponse.status}`)
        }

        if (msg.body.mainPicture) {
            await uploadPicture(service, msg.body.sku, msg.body.name, true, msg.body.mainPicture)
        } else {
            console.log(`no main image for ${product.sku}`)
        }

        if (msg.body.imagesString) {
            await Promise.all(msg.body.imagesString.split(';').map(uploadPicture.bind(this, service, msg.body.sku, msg.body.name, false)))
        } else {
            console.log(`no images for ${product.sku}`)
        }
        this.emit('data', messages.newMessageWithBody(product));
    } catch (e) {
        console.log(e);
        this.emit('error', e.response ? e.response.data : e);
    } finally {
        this.emit('end');
    }
}

async function uploadPicture(service, sku, name, isMain, imageUrl) {
    let imagesResponse = await service.get(`/products/${sku}/media`);
    console.log(JSON.stringify(imagesResponse.data, null, 2))
    let itemImagesHashes = imagesResponse.data.map((i) => i.file.split('/').pop().replace('.jpg', '').split('_')[0]);
    const imageResponse = await axios.get(imageUrl);
    const imageContent = imageResponse.data;
    const hash = crypto.createHash('sha256');
    hash.update(new Buffer(imageContent, 'base64'))
    const fileName = hash.digest('hex');
    if (!itemImagesHashes.includes(fileName)) {
        let imageData = {
            entry: {
                media_type: 'image',
                label: name,
                position: 1,
                disabled: false,
                file: `/images/${fileName}.jpg`,
                content: {
                    "base64EncodedData": imageContent,
                    "type": "image/jpeg",
                    "name": fileName
                }
            }
        }
        if (isMain) {
            imageData.entry.types = [
                'thumbnail',
                'image',
                'small_image',
                'swatch_image'
            ]
        }
        let createResponse = await service.post(`/products/${sku}/media`, imageData);
        console.log(createResponse.data)
    }
}

async function getCategoriesIds(service, inputCategories) {
    let result = [];
    let categoriesResponse = await service.get('categories?search_criteria');
    let flatCategories = flattenCategories(categoriesResponse.data);
    let root = flatCategories.filter((c) => c.parent_id === 1).pop();
    for (let cat of inputCategories) {
        let path = cat.split('->').reverse();
        if (!path || path.length === 1) {
            let mageCat = flatCategories.filter((c) => c.name === path[0]).pop();
            if (!mageCat) {
                throw new Error(`Root category with the name ${cat.name} doesn't exist`)
            }
            result.push(mageCat.id);
            continue;
        }

        let id = await getCategoryIdByPath(path, root);
        result.push(id);
    }
    return result;

    async function getCategoryIdByPath(path, prev) {
        let pathPart = path.pop();
        let mageCat = flatCategories.filter((c) => c.name.toLowerCase() === pathPart.toLowerCase()).pop();
        if (!mageCat) {
            mageCat = await createNewCategory({
                name: pathPart,
                parent_id: prev.id
            });
        }
        if (path.length === 0) {
            return mageCat.id;
        }
        return await getCategoryIdByPath(path, mageCat);
    }

    async function createNewCategory(category) {
        category.is_active = true;
        let createCategoryResponse = await service.post('/categories', {category});
        return createCategoryResponse.data;
    }
}

async function getAttributes(service, inputAttributes) {
    let attrsResponse = await service.get('/products/attributes?search_criteria');
    let attrs = attrsResponse.data.items;
    let result = [];
    for (let inputAttr of inputAttributes) {
        if (inputAttr.value === '') {
            continue
        }
        let attr = attrs.filter((attr) => {
            return attr.default_frontend_label !== undefined
                && (inputAttr.key.toLowerCase() === attr.attribute_code.toLowerCase()
                || inputAttr.label.toLowerCase() === attr.default_frontend_label.toLowerCase())
        }).pop();

        if (!attr) {
            let attrData = {
                attribute_code: inputAttr.key.toLowerCase(),
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

        if (attr.frontend_input === 'select') {
            attrValue = attr.options.filter((option) => option.label === inputAttr.value).pop();
            if (attrValue === undefined) {
                attr.options.push({
                    label: inputAttr.value
                });
                let attrUpdateResponse = await service.put(`/products/attributes/${attr.attribute_code}`, {
                    attribute: attr
                });
                attr = attrUpdateResponse.data;
                attrValue = attr.options.filter((option) => option.label === inputAttr.value).pop();
            }
            attrValue = attrValue.value;
        }

        if (attr.frontend_input === 'multiselect') {
            let values = inputAttr.value.split(',')
            attrValue = []
            await Promise.all(values.map(async (v) => {
                let magValue = attr.options.filter((option) => option.label === v).pop();
                if (magValue === undefined) {
                    attr.options.push({
                        label: v
                    });
                    let attrUpdateResponse = await service.put(`/products/attributes/${attr.attribute_code}`, {
                        attribute: attr
                    });
                    attr = attrUpdateResponse.data;
                    magValue = attr.options.filter((option) => option.label === v).pop();
                }
                attrValue.push(magValue.value);
            }))
        }

        if (inputAttr.type === 'text') {
            attrValue = inputAttr.value;
        }

        result.push({
            attribute_code: attr.attribute_code,
            value: attrValue
        });
    }
    return result;
}

function flattenCategories (root) {
    function flatten (cat, res) {
        res.push({name: cat.name, id: cat.id, parent_id: cat.parent_id});
        if (cat.children_data.length) {
            cat.children_data.map((childCat) => flatten(childCat, res));
        }
        return res;
    }
    return flatten(root, []);
}

async function getAttributeSetId(service, inputAttributeSetName) {
    const DEFAULT_ATTRIBUTE_SET_ID = 4;
    if (!inputAttributeSetName) return DEFAULT_ATTRIBUTE_SET_ID;
    let setsResponse = await service.get('/products/attribute-sets/sets/list?search_criteria');
    let sets = setsResponse.data.items;
    let set = sets.filter((as) => as.attribute_set_name.toLowerCase() === inputAttributeSetName.toLowerCase()).pop();
    if (set) {
        return set.attribute_set_id;
    } else {
        let createSetResponse = await service.post('/products/attribute-sets', {
            attributeSet: {
                attribute_set_name: inputAttributeSetName,
                entity_type_id: ENTITY_TYPE_ID_PRODUCT
            },
            skeletonId: DEFAULT_ATTRIBUTE_SET_ID
        });
        return createSetResponse.data.attribute_set_id;
    }
}
