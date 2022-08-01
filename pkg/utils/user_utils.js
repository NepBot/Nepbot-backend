const config = require('./config');
const userInfos = require('../models/object/user_infos');
const userFields = require('../models/object/user_fields');
const logger = require('./logger');
const { verifySign } = require('./near_utils');
const contractUtils = require('./contract_utils');
const discordUtils = require('./discord_utils');
const parasUtils = require('./paras_api');

const BN = require('bn.js');

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

exports.setUser = async (args, accountId) => {
	const rules = await contractUtils.getRules(args.guild_id);
	const roleList = Array.from(new Set(rules.map(({ role_id }) => role_id)));
	const result = await userInfos.getUsers({
		guild_id: args.guild_id,
		near_wallet_id: accountId,
	});
	for (const user_info of result) {
		if (user_info.user_id != args.user_id) {
			const member = await discordUtils.getMember(args.guild_id, args.user_id);
			if (member.roles) {
				member.roles.remove(roleList).then(console.log).catch(console.error);
			}
		}
	}

	// update user
	await userInfos.addUser({
		near_wallet_id: accountId,
		user_id: args.user_id,
		guild_id: args.guild_id,
	});

	//
	const member = await discordUtils.getMember(args.guild_id, args.user_id);
	const rulesMap = {
		token: [],
		oct: [],
		balance: [],
		nft: [],
		paras: [],
	};
	for (const rule of rules) {
		if (rule.key_field[0] == 'token_id') {
			rulesMap.token.push(rule);
		}
		else if (rule.key_field[0] == 'appchain_id') {
			rulesMap.oct.push(rule);
		}
		else if (rule.key_field[0] == 'near') {
			rulesMap.balance.push(rule);
		}
		else if (rule.key_field[0] == 'nft_contract_id') {
			rulesMap.nft.push(rule);
		}
		else if (rule.key_field[0] == config.paras.nft_contract) {
			rulesMap.paras.push(rule);
		}
		await userFields.addUserField({
			near_wallet_id: accountId,
			key: rule.key_field[0],
			value: rule.key_field[1],
		});
	}
	const roles = [];
	const delRoles = [];
	for (const rule of rulesMap.token) {
		try {
			let stakedParas = new BN('0');
			if (rule.key_field[1] === config.paras.token_contract) {
				stakedParas = await contractUtils.getStakedParas(accountId);
			}
			const newAmount = await contractUtils.getBalanceOf(rule.key_field[1], accountId);
			const tokenAmount = new BN(newAmount).add(stakedParas);

			if (!member._roles.includes(rule.role_id) && tokenAmount.cmp(new BN(rule.fields.token_amount)) != -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && roles.push(_role);
			}
			if (member._roles.includes(rule.role_id) && tokenAmount.cmp(new BN(rule.fields.token_amount)) == -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRoles.push(_role);
			}
		} catch (e) {
			continue
		}
		
	}

	for (const rule of rulesMap.oct) {
		try {
			const octRole = await contractUtils.getOctAppchainRole(rule.key_field[1], accountId);

			if (!member._roles.includes(rule.role_id) && octRole == rule.fields.oct_role) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && roles.push(_role);
			}
			if (member._roles.includes(rule.role_id) && !octRole == rule.fields.oct_role) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRoles.push(_role);
			}
		} catch (e) {
			continue
		}
	}

	for (const rule of rulesMap.balance) {
		try {
			const balance = await contractUtils.getNearBalanceOf(accountId);
			const stakingBalance = await contractUtils.getStakingBalance(accountId);
			const totalBalance = new BN(balance).add(new BN(stakingBalance));

			if (!member._roles.includes(rule.role_id) && totalBalance.cmp(new BN(rule.fields.balance)) != -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && roles.push(_role);
			}
			if (member._roles.includes(rule.role_id) && totalBalance.cmp(new BN(rule.fields.balance)) == -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRoles.push(_role);
			}
		} catch (e) {
			continue
		}

	}

	for (const rule of rulesMap.nft) {
		try {
			const tokenAmount = await contractUtils.getNftCountOf(rule.key_field[1], accountId);
			if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
				const _role = discordUtils. getRoles(rule.guild_id, rule.role_id);
				_role && roles.push(_role);
			}
			if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRoles.push(_role);
			}
		} catch (e) {
			continue
		}
		
	}

	for (const rule of rulesMap.paras) {
		try {
			const tokenAmount = await parasUtils.getTokenPerOwnerCount(rule.key_field[1], accountId, rule.fields.token_amount);
			if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
				console.log("========================================")
				const _role = await discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && roles.push(_role);
			}
			if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRoles.push(_role);
			}
		} catch (e) {
			console.log(e)
			continue
		}
		
	}

	console.log(member._roles.includes("988179226396086302"))
	console.log(roles)
	console.log(delRoles)

	for (let role of roles) {
		try {
			await member.roles.add(role)
		} catch (e) {
			continue
		}
	}

	for (let role of delRoles) {
		try {
			await member.roles.remove(role)
		} catch (e) {
			continue
		}
		
	}

}