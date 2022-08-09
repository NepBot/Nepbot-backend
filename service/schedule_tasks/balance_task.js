const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const BN = require('bn.js');

const balance_task = async function(receipts) {
  const _userFields = await userFields.getUserFields({
    key: 'near',
  });
  let _accountIds = [];
  _userFields.forEach(item => _accountIds.push(item.near_wallet_id));
  const _actions = await contractUtils.filterTransferActions(_accountIds, receipts);
  _accountIds = [];
  for (const action of _actions) {
    _accountIds.push(action.account_id);
  }
  logger.debug(`accountIds: ${_accountIds}`);
  const rolesByField = await contractUtils.getRulesByField('near', 'balance');
  const guild_ids = [];
  const guildMap = {};
  rolesByField.forEach(item => {
    guild_ids.push(item.guild_id);
    if (!guildMap[item.guild_id]) {
      guildMap[item.guild_id] = [];
    }
    guildMap[item.guild_id].push(item);
  });

  const _userInfos = await userInfos.getUsers({
    guild_id: guild_ids,
    near_wallet_id: _accountIds,
  });
  for (const _userInfo of _userInfos) {
    const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
    const roles = [];
    const delRoles = [];
    for (const rule of guildMap[_userInfo.guild_id]) {
      const balance = await contractUtils.getNearBalanceOf(_userInfo.near_wallet_id);
      const stakingBalance = await contractUtils.getStakingBalance(_userInfo.near_wallet_id);
      const totalBalance = new BN(balance).add(new BN(stakingBalance));
      if (!member._roles.includes(rule.role_id) && totalBalance.cmp(new BN(rule.fields.balance)) != -1) {
        roles.push(rule.role_id);
      }
      if (member._roles.includes(rule.role_id) && totalBalance.cmp(new BN(rule.fields.balance)) == -1) {
        delRoles.push(rule.role_id);
      }
    }
    for (const role of roles) {
      try {
        await member.roles.add(role).then(logger.info(`${member.user.username} add role, the role name is ${role.name} in balance_task`));
      }
      catch (e) {
        continue;
      }
    }

    for (const role of delRoles) {
      try {
        await member.roles.remove(role).then(logger.info(`${member.user.username} add role, the role name is ${role.name} in balance_task`));
      }
      catch (e) {
        continue;
      }
    }
  }
};

module.exports = balance_task;