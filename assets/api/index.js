const axios = require('axios')
// 封装axios
const api = {
  async get (url, data) {
    try {
      const res = await axios.get(url, {
        params: data
      })
      return new Promise(resolve => {
        resolve(res.data)
      })
    } catch (err) {
      console.log(err)
    }
  },
  async post (url, data) {
    try {
      const res = await axios.post(url, data)
      return new Promise(resolve => {
        resolve(res.data)
      })
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = api