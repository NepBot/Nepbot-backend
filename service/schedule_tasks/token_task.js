const contract_utils = require('../../pkg/utils/contract_utils');
const discord_utils = require('../../pkg/utils/discord_utils');
const near_utils = require('../../pkg/utils/near_utils');
const logger = require('../../pkg/utils/logger');
const user_infos_obj = require('../../pkg/models/object/user_infos');
const user_fields_obj = require('../../pkg/models/object/user_fields');
const BN = require('bn.js');
const token_task = async function(receipts) {
	const allFieldList = await contract_utils.getFieldList();
	const allTokenList = [];
	for (const field of allFieldList) {
		if (field[0] == 'token_id') {
			allTokenList.push(field[1]);
		}
	}
	const actions = await contract_utils.filterTokenActions(allTokenList, receipts);


	const accountIdList = [];
	const tokenList = [];
	for (const action of actions) {
		accountIdList.push(action.sender_id);
		accountIdList.push(action.receiver_id);
		tokenList.push(action.token_id);
	}

	const userTokens = await user_fields_obj.findAll({
		where: {
			key: 'token_id',
			near_wallet_id: accountIdList,
			value: tokenList,
		},
	});

	for (const userToken of userTokens) {
		const newAmount = await near_utils.getBalanceOf(userToken.value, userToken.near_wallet_id);
		const roles = await near_utils.getRulesByField('token_id', userToken.value);
		const guild_ids = [];
		roles.map(item => {
			guild_ids.push(item.guild_id);
		});
		const user_infos = await user_infos_obj.getUsers({
			where: {
				guild_id: guild_ids,
				near_wallet_id: userToken.near_wallet_id,
			},
		});
		for (const user_info of user_infos) {
			const member = await discord_utils.getMembers(user_info.guild_id, user_info.user_id);
			const guildRoles = await discord_utils.getRules(user_info.guild_id);

			const role = [];
			const delRole = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != 'token_id' || key_field[1] != userToken.value) {
					continue;
				}
				if (!member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) != -1) {
					const _role = discord_utils.getRoles(user_info.guild_id, role_id);
					_role && role.push(_role);
				}
				if (member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) == -1) {
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

module.exports = token_task;