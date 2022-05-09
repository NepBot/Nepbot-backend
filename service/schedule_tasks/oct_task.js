const contract_utils = require('../../pkg/utils/contract_utils');
const discord_utils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const oct_task = async function(receipts) {
	const actions = contract_utils.filterOctActions(receipts);
	const accountIdList = [];
	const appchainIdList = [];
	for (const action of actions) {
		appchainIdList.push(action.appchain_id);
		accountIdList.push(action.signer_id);
	}

	const _userFields = await userFields.getUserFields({
		key: 'appchain_id',
		near_wallet_id: {
			$in: accountIdList,
		},
		value: appchainIdList,
	});

	for (const _userField of _userFields) {
		const octRole = await contract_utils.getOctAppchainRole(_userField.value, _userField.near_wallet_id);
		const roles = await contract_utils.getRulesByField('appchain_id', _userField.value);
		const guild_ids = [];
		roles.map(item => {
			guild_ids.push(item.guild_id);
		});

		const _userInfos = await userInfos.getUsers({
			guild_id: guild_ids,
			near_wallet_id: _userField.near_wallet_id,
		});
		for (const _userInfo of _userInfos) {
			const member = await discord_utils.getMember(_userInfo.guild_id, _userInfo.user_id);
			const guildRoles = await discord_utils.getRules(_userInfo.guild_id);

			const role = [];
			const delRole = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != 'appchain_id' || key_field[1] != _userField.value) {
					continue;
				}
				if (!member._roles.includes(role_id) && octRole == fields.oct_role) {
					const _role = discord_utils.getRoles(_userInfo.guild_id, role_id);
					_role && role.push(_role);
				}

				if (member._roles.includes(role_id) && octRole != fields.oct_role) {
					const _role = discord_utils.getRoles(_userInfo.guild_id, role_id);
					_role && delRole.push(_role);
				}
			}
			if (role.length) {
				member.roles.add(role).then(logger.info).catch(console.error);
			}
			if (delRole.length) {
				member.roles.remove(delRole).then(logger.info).catch(console.error);
			}
		}
	}
};

module.exports = oct_task;