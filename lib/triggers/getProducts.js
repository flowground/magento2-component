'use strict'
const axios = require('axios')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const API_URL = 'http://elasticio-magento.herokuapp.com'

async(action)()

function action (msg, cfg) {
  try {
    const options = {
      headers: {
        'Content-Type': 'application/json'
      }
    }
    let token = await(axios.get(`${API_URL}/api/rest/products`, {
      auth: {
      username: 'wirecard',
      password: '1q2w3e'
    }}, options)).data
    console.log(token)
  } catch (e) {
    console.log(e)
  }
}
