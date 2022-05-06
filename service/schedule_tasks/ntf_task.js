const contract_utils = require('../../pkg/utils/contract_utils');
const discord_utils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const user_fields_obj = require('../../pkg/models/object/user_fields');
const user_infos_obj = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');

const nft_task = async function(receipts) {
	const allFieldList = await contract_utils.getFieldList();
	const allContractList = [];
	for (const field of allFieldList) {
		if (field[0] == 'nft_contract_id') {
			allContractList.push(field[1]);
		}
	}
	const actions = await contract_utils.filterNftActions(allContractList, receipts);
	const accountIdList = [];
	const contractList = [];
	for (const action of actions) {
		accountIdList.push(action.sender_id);
		accountIdList.push(action.receiver_id);
		contractList.push(action.contract_id);
	}

	const userTokens = await user_fields_obj.findAll({
		where: {
			key: 'nft_contract_id',
			near_wallet_id: accountIdList,
			value: contractList,
		},
	});


	for (const userToken of userTokens) {
		const roles = await contract_utils.getRulesByField('nft_contract_id', userToken.value);
		const guild_ids = [];
		roles.map(item => {
			guild_ids.push(item.guild_id);
		});
		const user_infos = await user_infos_obj.findAll({
			where: {
				guild_id: guild_ids,
				near_wallet_id: userToken.near_wallet_id,
			},
		});
		const newAmount = await contract_utils.getNftCountOf(userToken.value, userToken.near_wallet_id);


		for (const user_info of user_infos) {
			const member = await discord_utils.getMembers(user_info.guild_id, user_info.user_id);
			const guildRoles = await discord_utils.getRules(user_info.guild_id);

			const role = [];
			const delRole = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != 'nft_contract_id' && key_field[1] != userToken.value) {
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

module.exports = nft_task;