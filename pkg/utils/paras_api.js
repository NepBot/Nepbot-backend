const request = require("request")

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

exports.createCollection = async (formData) => {
    const result = await request({
        method: 'POST',
        url: `https://api-v2-${config.networkId}-master.paras.id/collections`,
        formData
    });
    console.log(result)
    if (result.data.status == 1) {
        return result.data.data
    }
    return result.data
}