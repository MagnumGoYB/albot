import axios from 'axios'
import camelCase from 'lodash/camelCase'

const request = axios.create({
  headers: {
    'Cache-Control': 'no-cache'
  },
  transformResponse: [
    (data) => {
      function reviver(this: any, k: string, v: any) {
        if (!/^[0-9]*$/.test(k)) {
          if (camelCase(k) === k) return v
          this[camelCase(k)] = v
        } else {
          return v
        }
      }
      return JSON.parse(data, reviver)
    }
  ]
})

export default request
