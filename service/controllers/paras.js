const logger = require('../../pkg/utils/logger');
const config = require('../../pkg/utils/config');
const Resp = require('../../pkg/models/object/response');
const discordUtils = require('../../pkg/utils/discord_utils');
const nearUtils = require('../../pkg/utils/near_utils');
const httpProxy = require("http-proxy")

const multiparty = require("multiparty");
const fs = require("fs");
const { createCollection } = require('../../pkg/utils/paras_api');
var FormData = require('form-data');


const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    //xfwd: true
    // other options, see https://www.npmjs.com/package/http-proxy
})

proxy.on('proxyReq', (proxyReq, req, res, options) => {
    //proxyReq.setHeader('Authorization', await nearUtils.genParasAuthToken())
    //console.log(proxyReq)
    console.log("===================")
})

proxy.on('proxyRes', (proxyRes, req, res) => {
    //proxyRes.removeHeader('Authorization')
    console.log("-----------------------------------")
})


const createParasCollection = async (ctx, next) => {
    // console.log("=========================================")
    const auth = await nearUtils.genParasAuthToken()
    // ctx.redirect(`https://api-v2-${config.nearWallet.networkId}-master.paras.id/collections`)
    // return
    proxy.web(ctx.req, ctx.res, {
        target: `https://api-v2-${config.nearWallet.networkId}-master.paras.id/collections`,
        headers: { 'Authorization': auth }
    }, (e) => {
        console.log(e)
    })
    //console.log(ctx.res)
    
    // let form = new multiparty.Form();
    // const {req, files} = await new Promise((resolve, reject) => {
    //     form.parse(ctx.req, function (err, fields, files) {
    //         resolve({req: JSON.parse(fields.args[0]), files: null})
    //     })
    // })
    
    // const args = req.args;
    // if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
    //     logger.error('fn verifyAccountOwner failed in api/setInfo');
    //     ctx.body = new Resp({
    //         code: 500,
    //         message: 'fn verifyAccountOwner failed in api/getOwnerSign',
    //         success: false,
    //     });
    //     return;
    // }

    // if (!await nearUtils.verifyOperationSign(args, req.account_id)) {
	// 	logger.error('fn verifyOperationSign failed in api/get-sign');
	// 	ctx.body = new Resp({
	// 		code: 500,
	// 		message: 'fn verifyOperationSign failed in api/get-sign',
	// 		success: false,
	// 	});
	// 	return;
	// }

    // const formData = new FormData();
    // Object.keys(args.args).forEach((key) => {
    //     formData.append(key, args.args[key]);
    // });
    // // for (let file of files) {
    // //     const fileObj = fs.readFileSync(file.path)
    // //     formData.append('files',fileObj)
    // // }
    
    // const res = await createCollection(formData, await nearUtils.genParasAuthToken())
    ctx.body = new Resp({ 
		data: {}//ctx.req
	});
}

module.exports = {
	'POST /api/createParasCollection': createParasCollection
};