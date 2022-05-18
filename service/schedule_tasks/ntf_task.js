const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');

const nft_task = async function(receipts) {
	const allFieldList = await contractUtils.getFieldList();
	const allContractList = [];
	for (const field of allFieldList) {
		if (field[0] == 'nft_contract_id') {
			allContractList.push(field[1]);
		}
	}
	const actions = await contractUtils.filterNftActions(allContractList, receipts);
	const accountIdList = [];
	const contractList = [];
	for (const action of actions) {
		accountIdList.push(action.sender_id);
		accountIdList.push(action.receiver_id);
		contractList.push(action.contract_id);
	}

	const userTokens = await userFields.getUserFields({
		key: 'nft_contract_id',
		near_wallet_id: accountIdList,
		value: contractList,
	});


	for (const userToken of userTokens) {
		const roles = await contractUtils.getRulesByField('nft_contract_id', userToken.value);
		const guild_ids = [];
		roles.map(item => {
			guild_ids.push(item.guild_id);
		});
		const _userInfos = await userInfos.getUsers({
			guild_id: guild_ids,
			near_wallet_id: userToken.near_wallet_id,
		});
		const newAmount = await contractUtils.getNftCountOf(userToken.value, userToken.near_wallet_id);


		for (const _userInfo of _userInfos) {
			const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
			const guildRoles = await discordUtils.getRules(_userInfo.guild_id);

			const role = [];
			const delRole = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != 'nft_contract_id' && key_field[1] != userToken.value) {
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

module.exports = nft_task;