const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const config = require('../../pkg/utils/config');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');

const astrodao_task = async function(receipts) {
  const actions = await contractUtils.filterAstroDaoMemberActions(receipts);
  logger.info(`get the receipts with astrodao ${ actions }`);
  const organizationList = [];
  const removeMemberList = [];
  for (const action of actions) {
    organizationList.push(action.organization);
    removeMemberList.push(action.remove_member_id);
  }

  const _userFields = await userFields.getUserFields({
    near_wallet_id: removeMemberList,
    key: 'astrodao_id',
    value: organizationList,
  });

  for (const _userField of _userFields) {
    const roles = await contractUtils.getRulesByField('astrodao_id', _userField.value);
    const guild_ids = [];
    roles.map(item => {
      guild_ids.push(item.guild_id);
    });
    const _userInfos = await userInfos.getUsers({
      guild_id: guild_ids,
      near_wallet_id: _userField.near_wallet_id,
    });

    for (const _userInfo of _userInfos) {
      const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
      const guildRoles = await contractUtils.getRules(_userInfo.guild_id);

      const roles = [];
      const delRoles = [];
      for (const { role_id, key_field } of guildRoles) {
        if (key_field[0] != 'astrodao_id' || key_field[1] != _userField.value) {
          continue;
        }
        if (!member._roles.includes(role_id)) {
          const _role = discordUtils.getRoles(_userInfo.guild_id, role_id);
          _role && roles.push(_role);
        }
        if (member._roles.includes(role_id)) {
          const _role = discordUtils.getRoles(_userInfo.guild_id, role_id);
          _role && delRoles.push(_role);
        }
      }
      for (const role of roles) {
        try {
          await member.roles.add(role);
        }
        catch (e) {
          continue;
        }
      }

      for (const role of delRoles) {
        try {
          await member.roles.remove(role);
        }
        catch (e) {
          continue;
        }

      }
    }
  }
};

module.exports = astrodao_task;