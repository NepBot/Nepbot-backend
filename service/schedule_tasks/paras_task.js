const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const parasUtils = require('../../pkg/utils/paras_api');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');

const paras_task = async function(receipts) {
	const actions = await contractUtils.filterParasActions(receipts);
	const accountIdList = [];
	const collectionList = [];
	for (const action of actions) {
		accountIdList.push(action.sender_id);
		accountIdList.push(action.receiver_id);
		const fractions = action.token_id.split(':');
		const tokenSeries = await parasUtils.getTokenSeries(fractions[0]);
		if (tokenSeries.metadata.collection_id) {
			collectionList.push(tokenSeries.metadata.collection_id);
		}
	}

	const userTokens = await userFields.getUserFields({
		key: 'x.paras.near',
		near_wallet_id: accountIdList,
		value: collectionList,
	});

	for (const userToken of userTokens) {
		const roles = await contractUtils.getRulesByField('x.paras.near', userToken.value);
		const guild_ids = [];
		roles.map(item => {
			guild_ids.push(item.guild_id);
		});
		const _userInfos = await userInfos.getUsers({
			guild_id: guild_ids,
			near_wallet_id: userToken.near_wallet_id,
		});
		let newAmount = 0;
		if (!userToken.value || userToken.value == '') {
			newAmount = await contractUtils.getNftCountOf(userToken.value, userToken.near_wallet_id);
		}
		else {
			newAmount = await parasUtils.getTokenPerOwnerCount(userToken.value, userToken.near_wallet_id);
		}


		for (const _userInfo of _userInfos) {
			const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
			const guildRoles = await discordUtils.getRules(_userInfo.guild_id);

			const role = [];
			const delRole = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != 'x.paras.near' || key_field[1] != userToken.value) {
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
				member.roles.add(role).then(console.log).catch(console.error);
			}
			if (delRole.length) {
				member.roles.remove(delRole).then(console.log).catch(console.error);
			}
		}


	}
};

module.exports = paras_task;