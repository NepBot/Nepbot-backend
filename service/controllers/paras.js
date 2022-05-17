const logger = require('../../pkg/utils/logger');
const config = require('../../pkg/utils/config');
const Resp = require('../../pkg/models/object/response');
const discordUtils = require('../../pkg/utils/discord_utils');
const nearUtils = require('../../pkg/utils/near_utils');

const multiparty = require("multiparty");
const fs = require("fs");
const { createCollection } = require('../../pkg/utils/paras_api');
const FormData = require('form-data');



const createParasCollection = async (ctx, next) => {
    
    let form = new multiparty.Form();
    const {req, files} = await new Promise((resolve, reject) => {
        form.parse(ctx.req, function (err, fields, files) {
            resolve({req: JSON.parse(fields.args[0]), files: null})
        })
    })
    
    const args = req.args;
    if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
        logger.error('fn verifyAccountOwner failed in api/setInfo');
        ctx.body = new Resp({
            code: 500,
            message: 'fn verifyAccountOwner failed in api/getOwnerSign',
            success: false,
        });
        return;
    }

    if (!await nearUtils.verifyOperationSign(args, req.account_id)) {
		logger.error('fn verifyOperationSign failed in api/get-sign');
		ctx.body = new Resp({
			code: 500,
			message: 'fn verifyOperationSign failed in api/get-sign',
			success: false,
		});
		return;
	}

    const formData = new FormData();
    Object.keys(args.args).forEach((key) => {
        formData.append(key, args.args[key]);
    });
    // for (let file of files) {
    //     const fileObj = fs.readFileSync(file.path)
    //     formData.append('files',fileObj)
    // }
    
    const res = await createCollection(formData, await nearUtils.genParasAuthToken())
    ctx.body = new Resp({ 
		data: res
	});
}

module.exports = {
	'POST /api/createParasCollection': createParasCollection
};