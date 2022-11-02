const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');

const nft_task = async function(receipts, txMap) {
  const allFieldList = await userFields.getUserFields({
    key: 'nft_contract_id',
  });
  const allContractList = [];
  for (const field of allFieldList) {
    allContractList.push(field.value);
  }
  const actions = await contractUtils.filterNftActions(allContractList, receipts, txMap);
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
    const rolesByField = await contractUtils.getRulesByField('nft_contract_id', userToken.value);
    const guild_ids = [];
    rolesByField.forEach(item => {
      guild_ids.push(item.guild_id);
    });
    const _userInfos = await userInfos.getUsers({
      guild_id: guild_ids,
      near_wallet_id: userToken.near_wallet_id,
    });
    const newAmount = await contractUtils.getNftCountOf(userToken.value, userToken.near_wallet_id);


    for (const _userInfo of _userInfos) {
      const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
      const guildRoles = rolesByField.filter(role => role.guild_id == _userInfo.guild_id);

      const roles = [];
      const delRoles = [];
      for (const { fields, role_id, key_field } of guildRoles) {
        if (key_field[0] != 'nft_contract_id' && key_field[1] != userToken.value) {
          continue;
        }
        if (!member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) != -1) {
          roles.push(role_id);
        }
        if (member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) == -1) {
          delRoles.push(role_id);
        }
      }

      for (const role of roles) {
        try {
          await member.roles.add(role).then(logger.info(`${member.user.username} add role_id ${role} in nft_task`));
        }
        catch (e) {
          console.log(e)
          continue;
        }
      }

      for (const role of delRoles) {
        try {
          await member.roles.remove(role).then(logger.info(`${member.user.username} remove role_id ${role} in nft_task`));
        }
        catch (e) {
          console.log(e)
          continue;
        }

      }
    }
  }
};

module.exports = nft_task;