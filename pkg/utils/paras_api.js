const request = require("request")
const config = require('../../pkg/utils/config');
let rp = require("request-promise")
const fs = require("fs");

exports.getCollection = async (collectionId) => {
    const result = await request({
        method:"get",
        url:`https://api-v2-${config.networkId}-master.paras.id/collections?collection_id=${collectionId}`,
    })
    if (result.data.status == 1) {
        return result.data.data
    }
    return false
}

exports.createCollection = async (formData, auth) => {
    let options = {
        method: 'POST',
        url: `https://api-v2-${config.nearWallet.networkId}-master.paras.id/collections`,
        headers:{
            'authorization': auth,
        },
        formData: formData,
        timeout: 10000
    };
    let result = await rp(options).catch(e => {
        fs.writeFileSync("log22222", JSON.stringify(e))
    });
    console.log(result)
    return JSON.parse(result.body)
}

