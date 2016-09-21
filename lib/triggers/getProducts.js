'use strict'
const axios = require('axios')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const messages = require('elasticio-node').messages

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

/*async(action.bind({emit: console.log}))({}, {
  username: 'bohdan',
  password: 'Elastic2016',
  url: 'http://magento.elastic.io/'
})*/

exports.process = async(action)

function action (msg, cfg, snapshot)  {
  try {
    const API_URL = cfg.url
    snapshot = snapshot || {}
    let token = await(axios.post(`${API_URL}/rest/V1/integration/admin/token`,
      {username: cfg.username, password: cfg.password})).data
    let options = {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }
    let products = await(axios.get(`${API_URL}/rest/V1/products?searchCriteria`, options)).data.items
    let result = []
    for (let product of products) {
      if (snapshot[product.sku] === product.updated_at) {
        continue
      }
      snapshot[product.sku] = product.updated_at
      let fullProduct = await(axios.get(`${API_URL}/rest/V1/products/${product.sku}`, options)).data
      let categoryIds = fullProduct.custom_attributes.filter((attr) => attr.attribute_code === 'category_ids').pop().value
      let categories = []
      for (let categoryId of categoryIds) {
        let category = await(axios.get(`${API_URL}/rest/V1/categories/${categoryId}`, options)).data
        if (category.parent_id) {
          let parent = await(axios.get(`${API_URL}/rest/V1/categories/${category.parent_id}`, options)).data
          category.parent = parent.name
        }
        categories.push({
          name: category.name,
          parent: category.parent
        })
      }
      fullProduct.categories = categories
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

      this.emit('data', messages.newMessageWithBody({
        name: fullProduct.name,
        price: fullProduct.price,
        sku: fullProduct.sku,
        categories
      }))
    }

    this.emit('snapshot', snapshot)
  } catch (e) {
    this.emit('error', error)
  } finally {
    this.emit('end')
  }
}
