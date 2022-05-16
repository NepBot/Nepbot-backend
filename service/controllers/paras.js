const logger = require('../../pkg/utils/logger');
const config = require('../../pkg/utils/config');
const Resp = require('../../pkg/models/object/response');
const discordUtils = require('../../pkg/utils/discord_utils');
const nearUtils = require('../../pkg/utils/near_utils');

const createParasCollection = async (ctx, next) => {
    console.log(ctx.request.files, ctx.request.body)
    // const req = ctx.request.body;
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

    // const collection = await getCollection(`${args.name}-by-${config.account_id.replace(".", "")}`)
    // if (!collection || collection.results.length > 0) {
    //     return
    // }
    // const formData = new FormData();
    // Object.keys(params).forEach((key) => {
    //     formData.append(key, params[key]);
    // });
    // console.log(values,formData,'---formData----');
    // formData.append('files',values['logo'][0]['originFileObj'])
    // formData.append('files',values['cover'][0]['originFileObj'])
    

    // //paras - collection
    // const res = await createCollection(formData);
}

module.exports = {
	'POST /api/createParasCollection': createParasCollection
};