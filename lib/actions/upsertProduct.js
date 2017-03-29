`use strict`;
const elasticio = require('elasticio-node');
const messages = elasticio.messages;
const axios = require('axios');
const ENTITY_TYPE_ID_PRODUCT = 4;


exports.process = action;

/**
 *
 * categories notation:
 * {
 *   categories: [
 *      {
 *          name: 'Category name',
 *          path: 'Root->Root sub category->...->Category name'
 *      }
 *   ]
 * }
 */

async function action (msg, cfg) {
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
            price: Number(msg.body.price),
            weight: Number(msg.body.weight),
            customAttributes: []
        };
        productData.attributeSetId = await getAttributeSetId(service, msg.body.attribute_set_name);
        productData.customAttributes = await getAttributes(service, msg.body.attributes);
        if (msg.body.categories && msg.body.categories.length > 0) {
            let categoriesIds = await getCategoriesIds(service, msg.body.categories);
            productData.customAttributes.push({
                attribute_code: 'category_ids',
                value: categoriesIds
            });
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
        console.log(e);
        this.emit('error', e.response ? e.response.data : e);
    } finally {
        this.emit('end');
    }
}

async function getCategoriesIds(service, inputCategories) {
    let result = [];
    let categoriesResponse = await service.get('categories?search_criteria');
    let flatCategories = flattenCategories(categoriesResponse.data);
    let root = flatCategories.filter((c) => c.parent_id === 1).pop();
    for (let cat of inputCategories) {
        let path = cat.path.split('->').reverse();
        if (!path || path.length === 1) {
            let mageCat = flatCategories.filter((c) => c.name === cat.name).pop();
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
        let mageCat = flatCategories.filter((c) => c.name === pathPart).pop();
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
    if (!inputAttributes.length) return [];
    let attrsResponse = await service.get('/products/attributes?search_criteria');
    let attrs = attrsResponse.data.items;
    let result = [];
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
    let set = sets.filter((as) => as.attribute_set_name === inputAttributeSetName).pop();
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
//
// action.bind({emit: console.log})({body:{
//     sku: 'F000015471',//'F000015475',
//     name: 'pear',
//     price: 300,
//     attribute_set_name: 'TestAtrtrSet',
//     categories: [
//         { name: 'Fabrichouse - Shop', path: 'Fabrichouse - Shop' },
//         { name: 'Man Pelle test', path: 'Fabrichouse - Shop->Pelle(test2)->Man Pelle test' },
//         { name: 'Bottoni', path: 'Fabrichouse - Shop->Pelle->Bottoni' }
//     ],
//     weight: 2,
//     attributes: [
//         {
//             label: 'Superpower',
//             key: 'sprpwra',
//             value: 'transparency',
//             type: 'multiselect'
//         },
//         {
//             label: 'Test select attr2',
//             key: 'test_select_attr_2',
//             value: 'fourth value',
//             type: 'select'
//         },
//         {
//             label: 'Left Side Color(test)',
//             key: 'lsc_test',
//             value: 'F000015475',
//             type: 'text'
//         },
//         {
//             label: 'Fabric Type',
//             key: 'fh_composition',
//             value: 'F000015475',
//             type: 'text'
//         }
//     ]
// }}, {
//     "url": "http://magento2.fabric-house.xyz",
//     "username": "fabrichouse",
//     "password": "r4E2WS2Z"
// })
