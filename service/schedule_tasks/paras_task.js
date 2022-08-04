const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const parasUtils = require('../../pkg/utils/paras_api');
const config = require('../../pkg/utils/config');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');

const delayTask = async function(accountIdList, collectionList) {
	const userTokens = await userFields.getUserFields({
		key: config.paras.nft_contract,
		near_wallet_id: accountIdList,
		value: collectionList,
	});
	console.log(userTokens)
	for (const userToken of userTokens) {
		const rolesByField = await contractUtils.getRulesByField(config.paras.nft_contract, userToken.value);
		const guild_ids = [];
		rolesByField.forEach(item => {
			guild_ids.push(item.guild_id);
		});
		const _userInfos = await userInfos.getUsers({
			guild_id: guild_ids,
			near_wallet_id: userToken.near_wallet_id,
		});
		
		
		for (const _userInfo of _userInfos) {
			const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
			const guildRoles = rolesByField.filter(role => role.guild_id == _userInfo.guild_id);

			const roles = [];
			const delRoles = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != config.paras.nft_contract || key_field[1] != userToken.value) {
					continue;
				}
				let newAmount = await parasUtils.getTokenPerOwnerCount(userToken.value, userToken.near_wallet_id, fields.token_amount);
				if (!member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) != -1) {
					roles.push(role_id);
				}
				if (member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) == -1) {
					delRoles.push(role_id);
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
}

const paras_task = async function(receipts, txMap) {
	const actions = await contractUtils.filterParasActions(receipts, txMap);
	const accountIdList = [];
	const collectionList = [];
	console.log(actions)
	for (const action of actions) {
		accountIdList.push(action.sender_id);
		accountIdList.push(action.receiver_id);
		const fractions = action.token_id.split(':');
		const tokenSeries = await parasUtils.getTokenSeries(fractions[0]);
		if (tokenSeries.metadata.collection_id) {
			collectionList.push(tokenSeries.metadata.collection_id);
		}
	}

	await delayTask(accountIdList, collectionList)
};

module.exports = paras_task;