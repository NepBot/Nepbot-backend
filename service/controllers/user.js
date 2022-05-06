const logger = require('../../pkg/utils/logger');
const resp = require('../../pkg/models/object/response');
const near_utils = require('../../pkg/utils/near_utils');
const user_utils = require('../../pkg/utils/user_utils');
const contract_utils = require('../../pkg/utils/contract_utils');
const discord_utils = require('../../pkg/utils/discord_utils');
const user_infos = require('../../pkg/models/object/user_infos');
const user_fields = require('../../pkg/models/object/user_fields');
const BN = require('bn.js');

const fn_setInfo = async (ctx, next) => {
	const req = ctx.request.body;
	logger.info(`revice request by access 'api/set-info': ${JSON.stringify(req)}`);
	// verify user account
	if (!await near_utils.verifyAccountOwner(req.account_id, req, req.sign)) {
		resp.code = 500;
		resp.message = 'fn verifyAccountOwner is faild in api/set-info';
		resp.success = false;
		resp.data = req;
		logger.error('fn verifyAccountOwner is faild in api/set-info');
		ctx.body = resp;
		return;
	}
	// verify user id
	if (!await user_utils.verifyUserId(req, req.sign)) {
		resp.code = 500;
		resp.message = 'fn verifyUserId is faild in api/set-info';
		resp.success = false;
		resp.data = req;
		logger.error('fn verifyUserId is faild in api/set-info');
		ctx.body = resp;
		return;
	}

	const rules = await contract_utils.getRules(req.guild_id);
	const roleList = Array.from(new Set(rules.map(({ role_id }) => role_id)));
	const result1 = await user_infos.findAll({
		where:{
			guild_id: req.guild_id,
			near_wallet_id: req.account_id,
		},
	});
	for (const user_info of result1) {
		if (user_info.user_id != req.user_id) {
			const member = await discord_utils.getMember(req.guild_id, req.user_id);
			if (member.roles) {
				member.roles.remove(roleList).then(console.log).catch(console.error);
			}
		}
	}

	// update user
	await user_infos.update({
		user_id: req.user_id,
		guild_id: req.guild_id,
		near_wallet_id: req.account_id,
	});

	//
	const member = await discord_utils.getMember(req.guild_id, req.user_id);
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
		await user_fields.update({
			near_wallet_id: req.account_id,
			key: rules.key_field[0],
			value: rules.key_field[1],
		});
	}
	const role = [];
	const delRole = [];
	for (const rule of rulesMap.token) {
		const tokenAmount = await contract_utils.getBalanceOf(rule.key_field[1], req.account_id);

		if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
			const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
			_role && role.push(_role);
		}
		if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
			const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
			_role && delRole.push(_role);
		}
	}

	for (const rule of rulesMap.oct) {
		const octRole = await contract_utils.getOctAppchainRole(rule.key_field[1], req.account_id);

		if (!member._roles.includes(rule.role_id) && octRole == rule.fields.oct_role) {
			const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
			_role && role.push(_role);
		}
		if (member._roles.includes(rule.role_id) && !octRole == rule.fields.oct_role) {
			const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
			_role && delRole.push(_role);
		}
	}

	for (const rule of rulesMap.balance) {

		const balance = await contract_utils.getNearBalanceOf(req.account_id);

		if (!member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) != -1) {
			const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
			_role && role.push(_role);
		}
		if (member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) == -1) {
			const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
			_role && delRole.push(_role);
		}
	}

	for (const rule of rulesMap.nft) {
		const tokenAmount = await contract_utils.getNftCountOf(rule.key_field[1], req.account_id);
		if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
			const _role = discord_utils. getRoles(rule.guild_id, rule.role_id);
			_role && role.push(_role);
		}
		if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
			const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
			_role && delRole.push(_role);
		}
	}

	for (const rule of rulesMap.paras) {
		const tokenAmount = await contract_utils.getTokenPerOwnerCount(rule.key_field[1], req.account_id);

		if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
			const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
			_role && role.push(_role);
		}
		if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
			const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
			_role && delRole.push(_role);
		}
	}

	if (role.length) {
		member.roles.add(role).then(console.log).catch(console.error);
	}
	if (delRole.length) {
		member.roles.remove(delRole).then(console.log).catch(console.error);
	}
	ctx.body = resp;
};

module.exports = {
	'POST /api/set-info': fn_setInfo,
};