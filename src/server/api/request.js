const axios = require('axios')


const service = axios.create({
    //baseURL: '/buuBigData',
    baseURL: 'https://helper.testnet.near.org/account/', // api base_url
    // baseURL: baseProject, // api base_url
    timeout: 900000 // 
})

service.interceptors.response.use((response)=>{
    return response.data;
},console.error)

exports.axios = service;
