const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const config = require('../../pkg/utils/config');
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
  const daoList = [];
  const memberRoleMap = {};
  for (const action of actions) {
    daoList.push(action.dao_id);
    if (action.kind.AddMemberForRole) {
      const memberId = action.kind.AddMemberForRole.member_id;
      memberRoleMap[memberId].addList.push(action.kind.AddMemberForRole.role);
    }
    else if (action.kind.RemoveMemberForRole) {
      const memberId = action.kind.RemoveMemberForRole.member_id;
      memberRoleMap[memberId].removeList.push(action.kind.RemoveMemberForRole.role);
    }
  }

  const _userFields = await userFields.getUserFields({
    key: 'astrodao_id',
    value: daoList,
  });

  for (const _userField of _userFields) {
    const roles = await contractUtils.getRulesByField('astrodao_id', _userField.value);
    const guild_ids = [];
    roles.map(item => {
      guild_ids.push(item.guild_id);
    });
    const _userInfos = await userInfos.getUsers({
      guild_id: guild_ids,
    });

    for (const _userInfo of _userInfos) {
      const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
      const guildRoles = roles.filter(role => role.guild_id == _userInfo.guild_id);

      const addRoles = [];
      const delRoles = [];
      for (const { fields, role_id, key_field } of guildRoles) {
        if (key_field[0] != 'astrodao_id' || key_field[1] != _userField.value) {
          continue;
        }
        if (!member.roles.includes(_userInfo.user_id) && memberRoleMap[_userInfo.near_wallet_id].addList.findIndex(role => role == fields.astrodao_role) > -1) {
          const _role = discordUtils.getRoles(_userInfo.guild_id, role_id);
          _role && addRoles.push(_role);
        }
        if (member.roles.includes(_userInfo.user_id) && memberRoleMap[_userInfo.near_wallet_id].removeList.findIndex(role => role == fields.astrodao_role) > -1) {
          const _role = discordUtils.getRoles(_userInfo.guild_id, role_id);
          _role && delRoles.push(_role);
        }
      }
      for (const addRole of addRoles) {
        try {
          await member.roles.add(addRole);
        }
        catch (e) {
          continue;
        }
      }

      for (const delRole of delRoles) {
        try {
          await member.roles.remove(delRole);
        }
        catch (e) {
          continue;
        }

      }
    }
  }
};

module.exports = astrodao_task;