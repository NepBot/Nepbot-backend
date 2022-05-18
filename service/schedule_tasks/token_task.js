const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const nearUtils = require('../../pkg/utils/near_utils');
const logger = require('../../pkg/utils/logger');
const userInfos = require('../../pkg/models/object/user_infos');
const userFields = require('../../pkg/models/object/user_fields');
const BN = require('bn.js');
const token_task = async function(receipts) {
	const allFieldList = await contractUtils.getFieldList();
	const allTokenList = [];
	for (const field of allFieldList) {
		if (field[0] == 'token_id') {
			allTokenList.push(field[1]);
		}
	}
	const actions = await contractUtils.filterTokenActions(allTokenList, receipts);


	const accountIdList = [];
	const tokenList = [];
	for (const action of actions) {
		accountIdList.push(action.sender_id);
		accountIdList.push(action.receiver_id);
		tokenList.push(action.token_id);
	}

	const userTokens = await userFields.getUserFields({
		key: 'token_id',
		near_wallet_id: accountIdList,
		value: tokenList,
	});

	for (const userToken of userTokens) {
		const newAmount = await nearUtils.getBalanceOf(userToken.value, userToken.near_wallet_id);
		const roles = await nearUtils.getRulesByField('token_id', userToken.value);
		const guild_ids = [];
		roles.map(item => {
			guild_ids.push(item.guild_id);
		});
		const _userInfos = await userInfos.getUsers({
			where: {
				guild_id: guild_ids,
				near_wallet_id: userToken.near_wallet_id,
			},
		});
		for (const _userInfo of _userInfos) {
			const member = await discordUtils.getMembers(_userInfo.guild_id, _userInfo.user_id);
			const guildRoles = await discordUtils.getRules(_userInfo.guild_id);

			const role = [];
			const delRole = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != 'token_id' || key_field[1] != userToken.value) {
					continue;
				}
				if (!member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) != -1) {
					const _role = discordUtils.getRoles(_userInfo.guild_id, role_id);
					_role && role.push(_role);
				}
				if (member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) == -1) {
					const _role = discordUtils.getRoles(_userInfo.guild_id, role_id);
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