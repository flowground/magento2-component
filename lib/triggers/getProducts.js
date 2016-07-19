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
    let token = await(axios.post(`${API_URL}/index.php/rest/V1/integration/admin/token`, {
      username: 'admin',
      password: 'password123123'
    }, options)).data
    console.log(token
    )
  } catch (e) {
    console.log(e)
  }
}
