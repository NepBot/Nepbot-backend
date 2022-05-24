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
        logger.error(e)
    });
    console.log(result)
    return JSON.parse(result)
}

