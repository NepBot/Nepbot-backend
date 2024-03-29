const config = require('./config');
const { connect, WalletConnection } = require('near-api-js');
const tweetnacl = require('tweetnacl');
const bs58 = require('bs58');
const Base64 = require('js-base64');
const js_sha256 = require('js-sha256');
const userInfos = require('../models/object/user_infos');
const logger = require('./logger');

const { providers } = require('near-api-js');

const provider = new providers.JsonRpcProvider(config.nearWallet.nodeUrl);

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
			return verifySign(data, signature, publicKey);
		});
	}
	catch (error) {
		logger.error(error);
	}
};

const verifyOperationSign = async (args, account_id) => {
	const user_info = await userInfos.getUser({
		user_id: args.user_id,
		guild_id: args.guild_id,
	});
	return await verifyAccountOwner(config.account_id, user_info.nonce + account_id, args.sign);
};

const getSign = async (args) => {
	const keyStore = config.nearWallet.keyStore;
	const keyPair = await keyStore.getKey(config.nearWallet.networkId, config.account_id);
	const args_string = JSON.stringify(args);
	const data_buffer = Buffer.from(args_string);
	const { signature } = keyPair.sign(data_buffer);
	return bs58.encode(signature);
};

const genParasAuthToken = async () => {
	const accountId = config.nft_contract;
	const near = await connect(config.nearWallet);
	const account = await near.account(accountId);
	const arr = new Array(accountId);
	for (let i = 0; i < accountId.length; i++) {
		arr[i] = accountId.charCodeAt(i);
	}

	const msgBuf = new Uint8Array(arr);
	const signedMsg = await account.connection.signer.signMessage(msgBuf, accountId, config.nearWallet.networkId);
	const pubKey = Buffer.from(signedMsg.publicKey.data).toString('hex');
	const signature = Buffer.from(signedMsg.signature).toString('hex');
	const payload = [accountId, pubKey, signature];

	return Base64.encode(payload.join('&'));
};

module.exports = {
	verifySign,
	verifyAccountOwner,
	verifyOperationSign,
	getSign,
	genParasAuthToken,
	provider
};