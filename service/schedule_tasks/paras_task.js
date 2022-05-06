const contract_utils = require('../pkg/utils/contract_utils');
const discord_utils = require('../pkg/utils/discord_utils');
const logger = require('../pkg/utils/logger');
const user_fields_obj = require('../pkg/models/object/user_fields');
const user_infos_obj = require('../pkg/models/object/user_infos');
const BN = require('bn.js');

const paras_task = async function(receipts) {
	const actions = await contract_utils.filterParasActions(receipts);
	const accountIdList = [];
	const collectionList = [];
	for (const action of actions) {
		accountIdList.push(action.sender_id);
		accountIdList.push(action.receiver_id);
		const fractions = action.token_id.split(':');
		const tokenSeries = await contract_utils.getTokenSeries(fractions[0]);
		if (tokenSeries.metadata.collection_id) {
			collectionList.push(tokenSeries.metadata.collection_id);
		}
	}

	const userTokens = await user_fields_obj.findAll({
		where: {
			key: 'x.paras.near',
			near_wallet_id: accountIdList,
			value: collectionList,
		},
	});

	for (const userToken of userTokens) {
		const roles = await contract_utils.getRulesByField('x.paras.near', userToken.value);
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
		let newAmount = 0;
		if (!userToken.value || userToken.value == '') {
			newAmount = await contract_utils.getNftCountOf(userToken.value, userToken.near_wallet_id);
		}
		else {
			newAmount = await contract_utils.getTokenPerOwnerCount(userToken.value, userToken.near_wallet_id);
		}


		for (const user_info of user_infos) {
			const member = await discord_utils.getMembers(user_info.guild_id, user_info.user_id);
			const guildRoles = await discord_utils.getRules(user_info.guild_id);

			const role = [];
			const delRole = [];
			for (const { fields, role_id, key_field } of guildRoles) {
				if (key_field[0] != 'x.paras.near' || key_field[1] != userToken.value) {
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

module.exports = paras_task;