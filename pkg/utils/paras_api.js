const request = require("request")
const config = require('../../pkg/utils/config');
let rp = require("request-promise")
const fs = require("fs");
const logger = require("./logger");

exports.getCollection = async (collectionId) => {
    const result = await request({
        method:"get",
        url:`${config.paras_api}/collections?collection_id=${collectionId}`,
    })
    if (result.data.status == 1) {
        return result.data.data
    }
    return false
}

exports.createCollection = async (formData, auth) => {
    let options = {
        method: 'POST',
        url: `${config.paras_api}/collections`,
        headers: formData.getHeaders({
            'authorization': auth,
        }),
        body: formData,
    };
    let result = await rp(options).catch(e => {
        console.log(e)
    });
    console.log(result)
    return JSON.parse(result)
}

exports.getTokenSeries = async (tokenSeriesId) => {
    let res = await new Promise((resolve, reject) => {
        request(`${config.PARAS_API}/token?token_series_id=${tokenSeriesId}&contract_id=x.paras.near&__limit=1`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(JSON.parse(body))
            }
            reject(error)
        })
    })
    if (res.data.results) {
        return res.data.results[0]
    }
}

exports.getTokenPerOwnerCount = async (collectionId, ownerId) => {
    return await new Promise((resolve, reject) => {
        request(`${config.PARAS_API}/token?collection_id=${collectionId}&owner_id=${ownerId}`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                const res = JSON.parse(body)
                resolve(res.data.results.length)
            }
            reject(error)
        })
    })
}

