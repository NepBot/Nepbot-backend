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
      let level = false;
      for (const { fields, role_id, key_field } of guildRoles) {
        if (key_field[0] != config.paras.nft_contract || key_field[1] != userToken.value) {
          continue;
        }
        if (key_field[2] != undefined) {
          const userLevel = await parasUtils.getUserInfo(userToken.near_wallet_id).then(e => e.level);
          level = await parasUtils.checkUserLevel(userLevel, key_field[2]);
        }
        const newAmount = await parasUtils.getTokenPerOwnerCount(userToken.value, userToken.near_wallet_id, fields.token_amount);
        if (!member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) != -1 && level) {
          roles.push(role_id);
        }
        if (member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) == -1 && !level) {
          delRoles.push(role_id);
        }
      }
      for (const role of roles) {
        try {
          await member.roles.add(role).then(logger.info(`${member.user.username} add role_id ${role} in delayTask`));
        }
        catch (e) {
          continue;
        }
      }

      for (const role of delRoles) {
        try {
          await member.roles.remove(role).then(logger.info(`${member.user.username} remove role_id ${role} in delayTask`));
        }
        catch (e) {
          continue;
        }

      }

    }
  }
};

const paras_task = async function(receipts, txMap) {
  const actions = await contractUtils.filterParasActions(receipts, txMap);
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

  await delayTask(accountIdList, collectionList);

  // setTimeout(() => delayTask(accountIdList, collectionList), 1000 * 60)
};

module.exports = paras_task;