const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const userUtils = require('../../pkg/utils/user_utils');
const update_guild_task = async (receipts) => {
  // the actions may include more than one transaction, so it should use for to get each one.
  const actions = await contractUtils.filterRoleActions(receipts);
  let ruleFromAction;
  let guildId;
  let usersInDB;
  let historyRules;
  for (const action of actions) {
    logger.debug(`received action in update_guild_task ${JSON.stringify(action)}`);
    /**
     * An action can refer https://explorer.mainnet.near.org/transactions/7NxiCwL8i11cG9TpmqnyqX1iuuM2dJK4mGRAQdPqxRES
     */
    ruleFromAction = action.roles[0];
    logger.debug(`ruleFromAction: ${JSON.stringify(ruleFromAction)}`);
    guildId = ruleFromAction.guild_id;
    usersInDB = await getUserFromDB(guildId);
    // get all rules that related to the role_id -> ruleFromAction.role_id
    if (action.method_name == 'set_roles') {
      for (const user of usersInDB) {
        if (!await discordUtils.isMemberIncludeRole(user.guild_id, user.user_id, ruleFromAction.role_id) && await userUtils.isMemberSatisfyRule(user.near_wallet_id, ruleFromAction)) {
          try {
            logger.debug(`the user is not in role ${ruleFromAction.role_id} & satisfy the rule ${JSON.stringify(ruleFromAction)} in set_roles`);
            const guildMember = await discordUtils.getMember(user.guild_id, user.user_id);
            await guildMember.roles.add(ruleFromAction.role_id).then(logger.info(`${guildMember.user.username} add role_id ${ruleFromAction.role_id} in update_guild_task`)).catch(e => logger.error(e));
            await userFields.addUserField ({
              near_wallet_id: user.near_wallet_id,
              key: ruleFromAction.key_field[0],
              value: ruleFromAction.key_field[1],
            });
            logger.debug(`${user.user_id} add role & addUserFields`);
          }
          catch (e) {
            logger.error(e);
          }

        }
      }
    }

    else if (action.method_name == 'del_roles') {
      historyRules = await contractUtils.getRules(guildId).then(e => e.filter(d => d.role_id == ruleFromAction.role_id));
      logger.debug(`historyRules: ${historyRules}`);
      for (const user of usersInDB) {
        if (await discordUtils.isMemberIncludeRole(user.guild_id, user.user_id, ruleFromAction.role_id) && userUtils.isMemberSatisfyRule(user.near_wallet_id, ruleFromAction)) {
          logger.debug(`the user is in role ${ruleFromAction.role_id} & satisfy the deleted rule ${JSON.stringify(ruleFromAction)} in del_roles`);
          let isDelRole = true;
          for (const rule of historyRules) {
            if (await userUtils.isMemberSatisfyRule(user.near_wallet_id, rule)) {
              logger.debug(`satisfy other rule ${JSON.stringify(ruleFromAction)} in del_roles`);
              isDelRole = false;
            }
          }
          if (isDelRole) {
            try {
              const guildMember = await discordUtils.getMember(user.guild_id, user.user_id);
              await guildMember.roles.remove(ruleFromAction.role_id).then(logger.info(`${guildMember.user.username} remove role_id ${ruleFromAction.role_id} in update_guild_task`)).catch(e => logger.error(e));
              await userFields.deleteUserField({
                near_wallet_id: user.near_wallet_id,
                key: ruleFromAction.key_field[0],
                value: ruleFromAction.key_field[1],
              });
              logger.debug(`${user.user_id} remove role & deleteUserFields are finished`);
            }
            catch (e) {
              logger.error(e);
            }
          }
        }
      }
    }

  }
};

/**
 * get all users from db exclude that the near_wallet_id is not null
 * @param {string} guildId
 * @returns users
 */
const getUserFromDB = async function(guildId) {
  return await userInfos.getUsers({
    guild_id: guildId,
    near_wallet_id: { $ne: null },
  });
};
//const reipte = '[{"method_name":"del_roles","roles":[{"guild_id":"923197936068861953","role_id":"1008008561617535026","key_field":["near","balance"],"fields":{"balance":"30000000000000000000000000"}}]}]';

module.exports = update_guild_task;
//update_guild_task(JSON.parse(reipte));