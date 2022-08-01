const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const oct_task = async function(receipts) {
	const actions = contractUtils.filterOctActions(receipts);
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
		const octRole = await contractUtils.getOctAppchainRole(_userField.value, _userField.near_wallet_id);
		const roles = await contractUtils.getRulesByField('appchain_id', _userField.value);
		const guild_ids = [];
		roles.map(item => {
			guild_ids.push(item.guild_id);
		});

		const _userInfos = await userInfos.getUsers({
			guild_id: guild_ids,
			near_wallet_id: _userField.near_wallet_id,
		});
		for (const _userInfo of _userInfos) {
			const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
			const guildRoles = roles.filter(role => role.guild_id == _userInfo.guild_id)

			const roles = [];
			const delRoles = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != 'appchain_id' || key_field[1] != _userField.value) {
					continue;
				}
				if (!member._roles.includes(role_id) && octRole == fields.oct_role) {
					const _role = discordUtils.getRoles(_userInfo.guild_id, role_id);
					_role && roles.push(_role);
				}

				if (member._roles.includes(role_id) && octRole != fields.oct_role) {
					const _role = discordUtils.getRoles(_userInfo.guild_id, role_id);
					_role && delRoles.push(_role);
				}
			}
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
	}
};

module.exports = oct_task;