const config = require('./config');
const { connect } = require('near-api-js');
const tweetnacl = require('tweetnacl');
const bs58 = require('bs58');
const userInfos = require('../models/object/user_infos');
const logger = require('./logger');

// sign means signature
const verifySign = (data, signature, public_key) => {
	try {
		const bf_data = new Uint8Array(Buffer.from(JSON.stringify(data)));
		const bf_sign = new Uint8Array(bs58.decode(signature));
		const bf_pk = new Uint8Array(bs58.decode(public_key));
		const valid = tweetnacl.sign.detached.verify(bf_data, bf_sign, bf_pk);
		return valid;
	}
	catch (error) {
		logger.error(error);
	}
};

const verifyAccountOwner = async (account_id, data, signature) => {
	try {
		const near = await connect(config.nearWallet);
		const account = await near.account(account_id);
		const accessKeys = await account.getAccessKeys();
		return accessKeys.some(it => {
			const publicKey = it.public_key.replace('ed25519:', '');
			logger.info(publicKey);
			return verifySign(data, signature, publicKey);
		});
	}
	catch (error) {
		logger.error(error);
	}
};

const verifyOperationSign = async (args) => {
	const user_info = await userInfos.getUser({
		user_id: args.user_id,
		guild_id: args.guild_id,
	});
	return await this.verifyAccountOwner(config.account_id, user_info.nonce, args.sign);
};

const getSign = async (args) => {
	const keyStore = config.nearWallet.keyStore;
	const keyPair = await keyStore.getKey(config.nearWallet.networkId, config.account_id);
	const args_string = JSON.stringify(args);
	const data_buffer = Buffer.from(args_string);
	const { signature } = keyPair.sign(data_buffer);
	return bs58.encode(signature);
};

module.exports = {
	verifySign,
	verifyAccountOwner,
	verifyOperationSign,
	getSign,
};