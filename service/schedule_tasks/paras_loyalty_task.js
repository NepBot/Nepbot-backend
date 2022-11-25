const contractUtils = require('../../pkg/utils/contract_utils');
const logger = require('../../pkg/utils/logger');
const userInfos = require('../../pkg/models/object/user_infos');
const parasUtils = require('../../pkg/utils/paras_api');
const discordUtils = require('../../pkg/utils/discord_utils');

exports.refreshRole = async () => {
  // logger.debug(`accountIds: ${_accountIds}`);
  const rules = await contractUtils.getRulesByField('gating_rule', 'Loyalty Level');
  for (const rule of rules) {
    const listUserInfos = await userInfos.getUsers({
      guild_id: rule.guild_id,
    });
    for (const userInfo of listUserInfos) {
      try {
        const userLevel = await parasUtils.getUserInfo(userInfo.near_wallet_id).then(e => e.level.charAt(0).toUpperCase() + e.level.slice(1));
        const member = await discordUtils.getMember(userInfo.guild_id, userInfo.user_id);
        const isSatisfy = await parasUtils.checkUserLevel(userLevel, rule.fields.loyalty_level);
        if (isSatisfy) {
          await member.roles.add(rule.role_id).then(logger.info(`${member.user.username} add role_id ${rule.role_id} in paras_loyalty_task`));
        }
        else if (!isSatisfy) {
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
