const config = require('./config');
const { connect } = require('near-api-js');
const tweetnacl = require('tweetnacl');
const bs58 = require('bs58');
const near_wallet = config.near_wallet;
const user_infos = require('../models/object/user_infos');

// sign means signature
const verify_sign = (data, signature, public_key) => {
	const bf_data = new Uint8Array(Buffer.from(JSON.stringify(data)));
	const bf_sign = new Uint8Array(bs58.decode(signature));
	const bf_pk = new Uint8Array(bs58.decode(public_key));
	const valid = tweetnacl.sign.detached.verify(bf_data, bf_sign, bf_pk);
	return valid;
};

const verifyAccountOwner = async (account_id, data, signature) => {
	const near = await connect(near_wallet);
	const account = await near.account(account_id);
	const accessKeys = await account.getAccessKeys();
	return accessKeys.some(it => {
		const publicKey = it.public_key.replace('ed25519:', '');
		return verify_sign(data, signature, publicKey);
	});
};

const verifyOperationSign = async (args) => {
	const user_info = await user_infos.findOne({
		where: {
			user_id: args.user_id,
			guild_id: args.guild_id,
		},
	});
	return await this.verifyAccountOwner(config.ACCOUNT_ID, user_info.nonce, args.sign);
};

const getSign = async (args) => {
	const keyStore = config.near_wallet.keyStore;
	const keyPair = await keyStore.getKey(config.near_wallet.network_id, config.account_id);

	const args_string = JSON.stringify(args);
	const data_buffer = Buffer.from(args_string);
	const { signature } = keyPair.sign(data_buffer);
	return bs58.encode(signature);
};

module.exports = {
	verify_sign,
	verifyAccountOwner,
	verifyOperationSign,
	getSign,
};