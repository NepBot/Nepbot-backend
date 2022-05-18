const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');

const balance_task = async function(receipts) {
	const _userFields = await userFields.getUserFields({
		key: 'near',
	});
	let _accountIds = [];
	_userFields.forEach(item => _accountIds.push(item.near_wallet_id));
	const _actions = await contractUtils.filterTransferActions(_accountIds, receipts);
	_accountIds = [];
	for (const action of _actions) {
		_accountIds.push(action.account_id);
	}
	logger.debug(`accountIds: ${_accountIds}`);

	const roles = await contractUtils.getRulesByField('near', 'balance');
	const guild_ids = [];
	const guildMap = {};
	roles.map(item => {
		guild_ids.push(item.guild_id);
		if (!guildMap[item.guild_id]) {
			guildMap[item.guild_id] = [];
		}
		guildMap[item.guild_id].push(item);
	});

	const _userInfos = await userInfos.getUsers({
		guild_id: guild_ids,
		near_wallet_id: _accountIds,
	});

	for (const _userInfo of _userInfos) {
		const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
		const role = [];
		const delRole = [];
		for (const rule of guildMap[_userInfos.guild_id]) {
			const balance = await contractUtils.getNearBalanceOf(_userInfo.near_wallet_id);
			if (!member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) != -1) {
				const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
				_role && role.push(_role);
			}
			if (member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) == -1) {
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
	}
};

module.exports = balance_task;