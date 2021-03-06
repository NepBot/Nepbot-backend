const config = require('./config');
const userInfos = require('../models/object/user_infos');
const logger = require('./logger');
const { verifySign } = require('./near_utils');

exports.verifyUserId = async (args, sign) => {
	if (!(await this.verifyUserSign(args, sign))) {
		return false
	}
	const nonce = Date.now();
	await userInfos.updateUser({
		user_id: args.user_id,
		guild_id: args.guild_id,
		nonce: nonce,
	});
	return nonce;
};

exports.verifyUserSign = async (args, sign) => {
	const userInfo = await userInfos.getUser({ user_id: args.user_id, guild_id: args.guild_id });
	logger.debug(Date.now(), userInfo.nonce);
	if (Date.now() - userInfo.nonce > 300 * 1000) { // 5min limit
		logger.error('the user nonce is great than 5 mintes');
		return false;
	}
	const keyStore = config.nearWallet.keyStore;
	const accountId = config.account_id;
	const keyPair = await keyStore.getKey(config.nearWallet.networkId, accountId);
	const ret = verifySign({
		nonce: userInfo.nonce,
		...args,
	}, sign, keyPair.publicKey.toString().replace('ed25519:', ''));
	return ret
}