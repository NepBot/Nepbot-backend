const contract_utils = require('../../pkg/utils/contract_utils');
const discord_utils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const user_fields_obj = require('../../pkg/models/object/user_fields');
const user_infos_obj = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');
const update_guild_task = async function(receipts) {
	const actions = await contract_utils.filterRoleActions(receipts);
	let addRoleList = [];
	let delRoleList = [];
	const guildIds = [];
	for (const action of actions) {
		if (action.method_name == 'set_roles') {
			addRoleList = addRoleList.concat(action.args);
		}
		else if (action.method_name == 'del_role') {
			delRoleList = delRoleList.concat(action.args);
		}
		for (const arg of action.args) {
			if (arg.guild_id) {
				guildIds.push(arg.guild_id);
			}
		}
	}
	const user_infos = await user_infos_obj.getUsers({
		guild_id: guildIds,
	});

	for (const user_info of user_infos) {
		const member = await discord_utils.getMembers(user_info.guild_id, user_info.user_id);
		const role = [];
		const delRole = [];
		for (const rule of addRoleList) {
			await user_fields_obj.findOrCreate ({
				where: {
					near_wallet_id: user_info.near_wallet_id,
					key: rule.key_field[0],
					value: rule.key_field[1],
				},
			});

			if (rule.key_field[0] == 'token_id') {
				const tokenAmount = await contract_utils.getBalanceOf(rule.key_field[1], user_info.near_wallet_id);
				if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && role.push(_role);
				}
				if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && delRole.push(_role);
				}
			}
			else if (rule.key_field[0] == 'appchain_id') {
				const octRole = await contract_utils.getOctAppchainRole(rule.key_field[1], user_info.near_wallet_id);

				if (!member._roles.includes(rule.role_id) && octRole == rule.fields.oct_role) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && role.push(_role);
				}
				if (member._roles.includes(rule.role_id) && octRole != rule.fields.oct_role) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && delRole.push(_role);
				}
			}
			else if (rule.key_field[0] == 'near') {
				const balance = await contract_utils.getNearBalanceOf(user_info.near_wallet_id);
				if (!member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) != -1) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && role.push(_role);
				}
				if (member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) == -1) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && delRole.push(_role);
				}
			}
			else if (rule.key_field[0] == 'nft_contract_id') {
				const tokenAmount = await contract_utils.getNftCountOf(rule.key_field[1], user_info.near_wallet_id);
				if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && role.push(_role);
				}
				if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && delRole.push(_role);
				}
			}
			else if (rule.key_field[0] == 'x.paras.near') {
				const tokenAmount = await contract_utils.getTokenPerOwnerCount(rule.key_field[1], user_info.near_wallet_id);
				if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && role.push(_role);
				}
				if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
					const _role = discord_utils.getRoles(rule.guild_id, rule.role_id);
					_role && delRole.push(_role);
				}
			}
		}

		for (const rule of delRoleList) {
			await user_fields_obj.destory({
				where: {
					near_wallet_id: user_info.near_wallet_id,
					key: rule.key_field[0],
					value: rule.key_field[1],
				},
			});
		}

		if (role.length) {
			member.roles.add(role).then(logger.info).catch(console.error);
		}
		if (delRole.length) {
			member.roles.remove(delRole).then(logger.info).catch(console.error);
		}
	}
};

module.exports = update_guild_task;