const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const oct_task = async function(receipts) {
  const actions = contractUtils.filterOct2Actions(receipts);
  const accountIdList = [];
  for (const action of actions) {
    accountIdList.push(action.signer_id);
  }
  const _userFields = await userFields.getUserFields({
    key: 'appchain_id',
    near_wallet_id: {
      $in: accountIdList,
    },
  });
  

  for (const _userField of _userFields) {
    const octRole = await contractUtils.getOct2Role(_userField.near_wallet_id);
    const rolesByField = await contractUtils.getRulesByField('appchain_id', _userField.value);
    const guild_ids = [];
    rolesByField.forEach(item => {
      guild_ids.push(item.guild_id);
    });

    const _userInfos = await userInfos.getUsers({
      guild_id: guild_ids,
      near_wallet_id: _userField.near_wallet_id,
    });
    for (const _userInfo of _userInfos) {
      const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
      const guildRoles = rolesByField.filter(role => role.guild_id == _userInfo.guild_id);

      const roles = [];
      const delRoles = [];
      for (const { fields, role_id, key_field } of guildRoles) {
        if (key_field[0] != 'appchain_id') {
          continue;
        }
        if (!member._roles.includes(role_id) && octRole == fields.oct_role) {
          roles.push(role_id);
        }

        if (member._roles.includes(role_id) && octRole != fields.oct_role) {
          delRoles.push(role_id);
        }
      }
      for (const role of roles) {
        try {
          await member.roles.add(role).then(logger.info(`${member.user.username} add role_id ${role} in oct_task`));
        }
        catch (e) {
          continue;
        }
      }

      for (const role of delRoles) {
        try {
          await member.roles.remove(role).then(logger.info(`${member.user.username} remove role_id ${role} in oct_task`));
        }
        catch (e) {
          continue;
        }

      }
    }
  }
};

module.exports = oct_task;