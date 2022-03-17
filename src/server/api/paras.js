const request = require("request");
const {config} = require("../../utils/config.js")
exports.getTokenSeries = async (tokenSeriesId) => {
    let res = await new Promise((resolve, reject) => {
        request(`${config.PARAS_API}/token?token_series_id=${tokenSeriesId}&contract_id=x.paras.near&__limit=1`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(body)
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
                resolve(body.data.results.length)
            }
            reject(error)
        })
    })
}
