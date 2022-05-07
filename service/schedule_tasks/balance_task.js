const contract_utils = require('../../pkg/utils/contract_utils');
const discord_utils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const user_fields_obj = require('../../pkg/models/object/user_fields');
const user_infos_obj = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');

const balance_task = async function(receipts) {
	const userFields = await user_fields_obj.getUserFields({
		key: 'near',
	});
	let accountIds = [];
	userFields.forEach(item => accountIds.push(item.near_wallet_id));
	const actions = await contract_utils.filterTransferActions(accountIds, receipts);
	accountIds = [];
	for (const action of actions) {
		accountIds.push(action.account_id);
	}
	logger.debug(`accountIds: ${accountIds}`);

	const roles = await contract_utils.getRulesByField('near', 'balance');
	const guild_ids = [];
	const guildMap = {};
	roles.map(item => {
		guild_ids.push(item.guild_id);
		if (!guildMap[item.guild_id]) {
			guildMap[item.guild_id] = [];
		}
		guildMap[item.guild_id].push(item);
	});

	const user_infos = await user_infos_obj.getUsers({
		guild_id: guild_ids,
		near_wallet_id: accountIds,
	});

	for (const user_info of user_infos) {
		const member = await discord_utils.getMembers(user_info.guild_id, user_info.user_id);
		const role = [];
		const delRole = [];
		for (const rule of guildMap[user_infos.guild_id]) {
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

		if (role.length) {
			member.roles.add(role).then(console.log).catch(console.error);
		}
		if (delRole.length) {
			member.roles.remove(delRole).then(console.log).catch(console.error);
		}
	}
};

module.exports = balance_task;