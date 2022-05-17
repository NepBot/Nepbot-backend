const FormData = require('form-data');
let rp = require("request-promise")
const fs = require("fs");

async function createCollection(formData, auth) {
    // let options = {
    //     method: 'POST',
    //     url: `https://api-v2-testnet-master.paras.id/collections`,
    //     headers:{
    //         authorization: auth,
    //     },
    //     body: formData,
    //     timeout: 10000
    // };
    // let result = await rp(options).catch(e => {
    //     fs.writeFileSync("log22222", JSON.stringify(e))
    // });
    // console.log(result)
    // return JSON.parse(result.body)

    // const options = {
    //     *   hostname: 'www.google.com',
    //     *   port: 80,
    //     *   path: '/upload',
    //     *   method: 'POST',
    //     *   headers: {
    //     *     'Content-Type': 'application/json',
    //     *     'Content-Length': Buffer.byteLength(postData)
    //     *   }
    //     * };


    formData.submit({
        hostname: "api-v2-testnet-master.paras.id",
        port: 443,
        path: "collections",
        method: 'POST',
        headers: {
            'authorization': auth,
        }
    },function(err, res) {
        console.log(res)
    });
}

async function test() {
    const formData = new FormData()
    formData.append("collection", "2")
    formData.append("decription", "22")
    formData.append("creator_id", "dev-nepbot.testnet")
    //console.log(formData)
    const res = await createCollection(formData, "ZGV2LW5lcGJvdC50ZXN0bmV0JmUwYzdkYTU5MjMzY2M2ZTAyMmQ0OWEyNjgzNDlkOTJkNzFkODhkODA1YWZmNzk4MzZhY2MyN2MxZDRkNjJlZjMmYzBkODM0ZTdhNjRjNzZlN2YxOThkOTM0MjlmMjYyNzYyZjI0ZTAzZDZlOTI0MDNkNmI2ZmU4ODE4MDY2MWMxN2ZhNDg2OTkwYmFkOWEzN2JiYzBlM2QzMGVkODQ1MDRiYjhmYTIyYmI0MzhlNDg3OGU2M2QzN2I3MzNlMDFlMDI=")
}

test()