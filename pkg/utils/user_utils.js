const config = require('./config');
const userInfos = require('../models/object/user_infos');
const logger = require('./logger');
const { verifySign } = require('./near_utils');

exports.verifyUserId = async (args, sign) => {
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
		guild_id: args.guild_id,
		nonce: userInfo.nonce,
		user_id: args.user_id,
	}, sign, keyPair.publicKey.toString().replace('ed25519:', ''));
	if (!ret) {
		return false;
	}
	const nonce = Date.now();
	await userInfo.update({
		user_id: args.user_id,
		guild_id: args.guild_id,
		nonce: nonce,
	});
	return nonce;
};