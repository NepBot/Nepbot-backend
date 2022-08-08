const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');

const astrodao_task = async function(receipts) {
  const allFieldList = await userFields.getUserFields({
    key: 'astrodao_id',
  });
  const allDaoList = [];
  for (const field of allFieldList) {
    allDaoList.push(field.value);
  }
  const actions = await contractUtils.filterAstroDaoMemberActions(allDaoList, receipts);
  for (const action of actions) {
    const mapAstrodaoDiscord = await assembleMap(action);
    /**
     * mapAstrodaoDiscord =
     *{
     *  dao_id: 'jacktest.sputnikv2.testnet',
     *  member_id: 'jacktest2.testnet',
     *  role: 'community',
     *  action: 'remove' or 'add',
     *  contract_infos: [
     *    {
     *      guild_id: '966966468774350948',
     *      roles: [
     *        {"role_id":"1003208013684940833","role":"community"},
     *        {"role_id":"1003208013684940833","role":"council"},
     *        {"role_id":"1004439142899396638","role":"community"}]
     *    }
     *  ]
     *}
     */
    for (const _conInfos of mapAstrodaoDiscord.contract_infos) {
      // check the user whether verified
      const userInfo = await getMemberInDatabase(_conInfos.guild_id, mapAstrodaoDiscord.member_id);
      if (userInfo == null) {
        logger.debug(`the ${ mapAstrodaoDiscord.member_id } haven't join this guild ${ _conInfos.guild_id }`);
        continue;
      }
      // get member in discord guild
      const memberInGuild = await discordUtils.getMemberInGuild(_conInfos.guild_id, userInfo.user_id);
      // check the user whether in other group on Astrodao
      for (const role of _conInfos.roles) {
        try {
          // if the action is remove
          if (mapAstrodaoDiscord.action == 'remove' && memberInGuild.roles.cache.some(r => r.id === role.role_id)) {
            await memberInGuild.roles.remove(role.role_id).catch(e => logger.error(e));
          }
          // if the action is add
          else if (mapAstrodaoDiscord.action == 'add' && !memberInGuild.roles.cache.some(r => r.id === role.role_id)) {
            await memberInGuild.roles.add(role.role_id).catch(e => logger.error(e));
          }
        }
        catch (e) {
          continue;
        }
      }
    }
  }
};

async function assembleMap(action) {
  // action = {dao_id: "xxxxxxxxx.sputnikv2.testnet", kind: {RemoveMemberFromRole: { member_id: 'member_id', role: 'council' }}}
  const result = {};
  result.dao_id = action.dao_id;
  if ('RemoveMemberFromRole' in action.kind) {
    result.member_id = action.kind.RemoveMemberFromRole.member_id;
    result.action = 'remove';
    result.role = action.kind.RemoveMemberFromRole.role;
  }
  else if ('AddMemberToRole' in action.kind) {
    result.member_id = action.kind.AddMemberToRole.member_id;
    result.action = 'add';
    result.role = action.kind.AddMemberToRole.role;
  }
  result.contract_infos = [];
  const rules = await contractUtils.getRulesByField('astrodao_id', action.dao_id);
  for (const rule of rules) {
    const data = { guild_id:rule.guild_id, roles:[ { role_id: rule.role_id, role: rule.fields.astrodao_role } ] };
    const index = result.contract_infos.findIndex(guild => guild.guild_id == rule.guild_id);
    if (index > -1) {
      result.contract_infos[index].roles.push({ role_id: rule.role_id, role: rule.fields.astrodao_role });
      continue;
    }
    result.contract_infos.push(data);
  }
  logger.debug(JSON.stringify(result));
  return result;
}

async function getMemberInDatabase(guildId, nearWalletId) {
  const userInfo = userInfos.getUser({
    guild_id: guildId,
    near_wallet_id: nearWalletId,
  });
  return userInfo;
}
module.exports = astrodao_task;