const logger = require('../../pkg/utils/logger');
const Resp = require('../../pkg/models/object/response');
const nearUtils = require('../../pkg/utils/near_utils');
const userUtils = require('../../pkg/utils/user_utils');
const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const parasUtils = require('../../pkg/utils/paras_api');
const userInfos = require('../../pkg/models/object/user_infos');
const userFields = require('../../pkg/models/object/user_fields');
const BN = require('bn.js');

const setInfo = async (ctx, next) => {
	try {
		const req = ctx.request.body;
		const args = req.args;
		logger.info(`revice request by access 'api/setInfo': ${JSON.stringify(req)}`);
		// verify user account
		if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
			logger.error('fn verifyAccountOwner failed in api/setInfo');
			ctx.body = new Resp({
				code: 500,
				message: 'fn verifyAccountOwner failed in api/getOwnerSign',
				success: false,
			});
			return;
		}
		// verify user id
		if (!await userUtils.verifyUserId({user_id: args.user_id, guild_id: args.guild_id}, args.sign)) {
			logger.error('fn verifyUserId failed in api/setInfo');
			ctx.body = new Resp({
				code: 500,
				message: 'fn verifyUserId failed in api/getOwnerSign',
				success: false,
			});
			return;
		}

		const rules = await contractUtils.getRules(args.guild_id);
		const roleList = Array.from(new Set(rules.map(({ role_id }) => role_id)));
		const result = await userInfos.getUsers({
			guild_id: args.guild_id,
			near_wallet_id: req.account_id,
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
			near_wallet_id: req.account_id,
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
			else if (rule.key_field[0] == 'x.paras.near') {
				rulesMap.paras.push(rule);
			}
			await userFields.addUserField({
				near_wallet_id: req.account_id,
				key: rule.key_field[0],
				value: rule.key_field[1],
			});
		}
		const role = [];
		const delRole = [];
		for (const rule of rulesMap.token) {
			const tokenAmount = await contractUtils.getBalanceOf(rule.key_field[1], req.account_id);

			if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && role.push(_role);
			}
			if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRole.push(_role);
			}
		}

		for (const rule of rulesMap.oct) {
			const octRole = await contractUtils.getOctAppchainRole(rule.key_field[1], req.account_id);

			if (!member._roles.includes(rule.role_id) && octRole == rule.fields.oct_role) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && role.push(_role);
			}
			if (member._roles.includes(rule.role_id) && !octRole == rule.fields.oct_role) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRole.push(_role);
			}
		}

		for (const rule of rulesMap.balance) {

			const balance = await contractUtils.getNearBalanceOf(req.account_id);

			if (!member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) != -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && role.push(_role);
			}
			if (member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) == -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRole.push(_role);
			}
		}

		for (const rule of rulesMap.nft) {
			const tokenAmount = await contractUtils.getNftCountOf(rule.key_field[1], req.account_id);
			if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
				const _role = discordUtils. getRoles(rule.guild_id, rule.role_id);
				_role && role.push(_role);
			}
			if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRole.push(_role);
			}
		}

		for (const rule of rulesMap.paras) {
			const tokenAmount = await parasUtils.getTokenPerOwnerCount(rule.key_field[1], req.account_id);

			if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && role.push(_role);
			}
			if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && delRole.push(_role);
			}
		}

		if (role.length) {
			member.roles.add(role).then(console.log).catch(console.error);
		}
		if (delRole.length) {
			member.roles.remove(delRole).then(console.log).catch(console.error);
		}
		ctx.body = new Resp({});
	}
	catch (error) {
		logger.error(error);
		ctx.body = new Resp({
			code: 500,
			message: 'backend inner error',
			success: false,
		});
	}
};

module.exports = {
	'POST /api/setInfo': setInfo,
};