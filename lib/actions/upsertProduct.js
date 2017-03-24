`use strict`;
const elasticio = require('elasticio-node');
const messages = elasticio.messages;
// const axios = require('axios');
// const ENTITY_TYPE_ID_PRODUCT = 4;
// const DEFAULT_ATTRIBUTE_SET_ID = 4; // used as skeleton to create new ones

exports.process = action;

async function action (msg, cfg) {
    console.log('hello test')
    console.log(msg)
    try {
        /*
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
/*
        let inputCategories = msg.body.categories;
        let inputCategriesNames = inputCategories.map((cat) => cat.name)

        let categoriesResponse = await service.get('categories?search_criteria');
        let flatCategories = flattenCategories(categoriesResponse.data);
        let categoriesIds = flatCategories.filter((cat) => inputCategriesNames.includes(cat.name)).map((cat) => cat.id);
        let categoriesNames = flatCategories.filter((cat) => cat.name);
        let categoriesToCreate = inputCategories.filter((cat) => !categoriesNames.includes(cat.name));
        for (let cat of categoriesToCreate) {
            let catData = {
                name: cat.name
            };
            if(cat.parent) {
                let parent = flatCategories.filter((c) => c.name === cat.parent).pop();
                if (!parent) {
                    let createCategoryResponse = await service.post('/categories', {
                        name:
                    });
                }
            }
            //let createCategoryResponse = await service.post('/categories', {})
        }
        console.log(categoriesToCreate)
        console.log(flatCategories, categoriesIds)
        return
        */

        /*
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
        */
        //this.emit('data', messages.newMessageWithBody(product));
        this.emit('data', messages.newMessageWithBody({debug: true}));
    } catch (e) {
        this.emit('error', e.response.data);
    } finally {
        this.emit('end');
    }
}

/*

action.bind({emit: console.log})({body:{
    sku: 'F000015471',//'F000015475',
    name: 'pear',
    price: 300,
    attribute_set_name: 'TestAtrtrSet3',
    categories: [{name: 'Default'}, {name: 'Gear'}, {name: 'Men', parent: 'Gear'}, {name: 'Shirt', parent: 'Fabrichouse - Shop'}],
    weight: 2,
    attributes: [
        {
            label: 'Superpower',
            key: 'sprpwra',
            value: 'transparency',
            type: 'multiselect'
        },
        {
            label: 'Test select attr2',
            key: 'test_select_attr_2',
            value: 'fourth value',
            type: 'select'
        },
        {
            label: 'Left Side Color(test)',
            key: 'lsc_test',
            value: 'F000015475',
            type: 'text'
        },
        {
            label: 'Fabric Type',
            key: 'fh_composition',
            value: 'F000015475',
            type: 'text'
        }
    ]
}}, {
    "url": "http://magento2.fabric-house.xyz",
    "username": "fabrichouse",
    "password": "r4E2WS2Z"
})


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

    */
