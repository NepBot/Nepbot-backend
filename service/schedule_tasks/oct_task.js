const contract_utils = require('../../pkg/utils/contract_utils');
const discord_utils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const user_fields_obj = require('../../pkg/models/object/user_fields');
const user_infos_obj = require('../../pkg/models/object/user_infos');
const oct_task = async function(receipts) {
	const actions = contract_utils.filterOctActions(receipts);
	const accountIdList = [];
	const appchainIdList = [];
	for (const action of actions) {
		appchainIdList.push(action.appchain_id);
		accountIdList.push(action.signer_id);
	}

	const user_fields = await user_fields_obj.findAll({
		where: {
			key: 'appchain_id',
			near_wallet_id: accountIdList,
			value: appchainIdList,
		},
	});

	for (const user_field of user_fields) {
		const octRole = await contract_utils.getOctAppchainRole(user_field.value, user_field.near_wallet_id);
		const roles = await contract_utils.getRulesByField('appchain_id', user_field.value);
		const guild_ids = [];
		roles.map(item => {
			guild_ids.push(item.guild_id);
		});

		const user_infos = await user_infos_obj.findAll({
			where: {
				guild_id: guild_ids,
				near_wallet_id: user_field.near_wallet_id,
			},
		});
		for (const user_info of user_infos) {
			const member = await discord_utils.getMember(user_info.guild_id, user_info.user_id);
			const guildRoles = await discord_utils.getRules(user_info.guild_id);

			const role = [];
			const delRole = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != 'appchain_id' || key_field[1] != user_field.value) {
					continue;
				}
				if (!member._roles.includes(role_id) && octRole == fields.oct_role) {
					const _role = discord_utils.getRoles(user_info.guild_id, role_id);
					_role && role.push(_role);
				}

				if (member._roles.includes(role_id) && octRole != fields.oct_role) {
					const _role = discord_utils.getRoles(user_info.guild_id, role_id);
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