const request = require("request");
const config = require("../../config.js").getConfig()
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
    console.log(collectionId, ownerId)
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
