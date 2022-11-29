const contractUtils = require('../../pkg/utils/contract_utils');
const logger = require('../../pkg/utils/logger');
const userInfos = require('../../pkg/models/object/user_infos');
const discordUtils = require('../../pkg/utils/discord_utils');
const userUtils = require('../../pkg/utils/user_utils');

exports.checkLevel = async () => {
  // logger.debug(`accountIds: ${_accountIds}`);
  const rules = await contractUtils.getRulesByField('gating_rule', 'Loyalty Level');
  for (const rule of rules) {
    const listUserInfos = await userInfos.getUsers({
      guild_id: rule.guild_id,
      near_wallet_id:  { $ne: null },
    });
    for (const userInfo of listUserInfos) {
      try {
        const member = await discordUtils.getMember(userInfo.guild_id, userInfo.user_id);
        const isMemberSatisfyRule = await userUtils.isMemberSatisfyRule(userInfo.near_wallet_id, rule);
        const isMemberIncludeRole = await discordUtils.isMemberIncludeRole(rule.guild_id, userInfo.user_id, rule.role_id);
        if (isMemberSatisfyRule && !isMemberIncludeRole) {
          await member.roles.add(rule.role_id).then(logger.info(`${member.user.username} add role_id ${rule.role_id} in paras_loyalty_task`));
        }
        else if (!isMemberSatisfyRule && isMemberIncludeRole) {
          logger.debug(`unsatisfying the ${rule.fields.loyalty_level} rule walletId: ${userInfo.near_wallet_id}`);
          await member.roles.remove(rule.role_id).then(logger.info(`${member.user.username} remove role_id ${rule.role_id} in paras_loyalty_task`));
        }
      }
      catch (e) {
        logger.error(e);
      }
    }
  }
};

exports.checkStaking = async () => {
  // logger.debug(`accountIds: ${_accountIds}`);
  const rules = await contractUtils.getRulesByField('gating_rule', 'Paras Staking');
  for (const rule of rules) {
    const listUserInfos = await userInfos.getUsers({
      guild_id: rule.guild_id,
      near_wallet_id:  { $ne: null },
    });
    for (const userInfo of listUserInfos) {
      try {
        const member = await discordUtils.getMember(userInfo.guild_id, userInfo.user_id);
        const isMemberSatisfyRule = await userUtils.isMemberSatisfyRule(userInfo.near_wallet_id, rule);
        const isMemberIncludeRole = await discordUtils.isMemberIncludeRole(rule.guild_id, userInfo.user_id, rule.role_id);
        if (isMemberSatisfyRule && !isMemberIncludeRole) {
          await member.roles.add(rule.role_id).then(logger.info(`${member.user.username} add role_id ${rule.role_id} in paras_loyalty_task`));
        }
        else if (!isMemberSatisfyRule && isMemberIncludeRole) {
          logger.debug(`unsatisfying the {paras_staking} rule walletId: ${userInfo.near_wallet_id}`);
          await member.roles.remove(rule.role_id).then(logger.info(`${member.user.username} remove role_id ${rule.role_id} in paras_loyalty_task`));
        }
      }
      catch (e) {
        logger.error(e);
      }
    }
  }
};
