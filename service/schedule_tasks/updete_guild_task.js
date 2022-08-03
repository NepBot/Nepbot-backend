const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const parasUtils = require('../../pkg/utils/paras_api');
const config = require('../../pkg/utils/config');
const logger = require('../../pkg/utils/logger');
const userFields = require('../../pkg/models/object/user_fields');
const userInfos = require('../../pkg/models/object/user_infos');
const astrodaoUtils = require('../../pkg/utils/astrodao_utils')
const BN = require('bn.js');
const update_guild_task = async function(receipts) {
  const actions = await contractUtils.filterRoleActions(receipts);
  let addRoleList = [];
  let delRoleList = [];
  const guildIds = [];

  for (const action of actions) {
    if (action.method_name == 'set_roles') {
      addRoleList = addRoleList.concat(action.roles);
    }
    else if (action.method_name == 'del_roles') {
      delRoleList = delRoleList.concat(action.roles);
    }
    for (const role of action.roles) {
      if (role.guild_id) {
        guildIds.push(role.guild_id);
      }
    }
  }

  const _userInfos = await userInfos.getUsers({
    guild_id: guildIds,
  });
  for (const _userInfo of _userInfos) {
    const member = await discordUtils.getMember(_userInfo.guild_id, _userInfo.user_id);
    const roles = [];
    const delRoles = [];
    for (const rule of addRoleList) {
      if (!_userInfo.near_wallet_id) {
        continue;
      }
      await userFields.addUserField ({
        near_wallet_id: _userInfo.near_wallet_id,
        key: rule.key_field[0],
        value: rule.key_field[1],
      });

      if (rule.key_field[0] == 'token_id') {
        const tokenAmount = await contractUtils.getBalanceOf(rule.key_field[1], _userInfo.near_wallet_id);
        if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && roles.push(_role);
        }
        if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && delRoles.push(_role);
        }
      }
      else if (rule.key_field[0] == 'appchain_id') {
        const octRole = await contractUtils.getOctAppchainRole(rule.key_field[1], _userInfo.near_wallet_id);
        if (!member._roles.includes(rule.role_id) && octRole == rule.fields.oct_role) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && roles.push(_role);
        }
        if (member._roles.includes(rule.role_id) && octRole != rule.fields.oct_role) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && delRoles.push(_role);
        }
      }
      else if (rule.key_field[0] == 'near') {
        const balance = await contractUtils.getNearBalanceOf(_userInfo.near_wallet_id);
        if (!member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) != -1) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && roles.push(_role);
        }
        if (member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) == -1) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && delRoles.push(_role);
        }
      }
      else if (rule.key_field[0] == 'nft_contract_id') {
        const tokenAmount = await contractUtils.getNftCountOf(rule.key_field[1], _userInfo.near_wallet_id);
        if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && roles.push(_role);
        }
        if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && delRoles.push(_role);
        }
      }
      else if (rule.key_field[0] == config.paras.nft_contract) {
        const tokenAmount = await parasUtils.getTokenPerOwnerCount(rule.key_field[1], _userInfo.near_wallet_id);
        if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && roles.push(_role);
        }
        if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && delRoles.push(_role);
        }
      }
      else if (rule.key_field[0] == 'astrodao_id') {
        if (!member._roles.includes(rule.role_id) && astrodaoUtils.isMemberHaveRole(rule.key_field[1], _userInfo.near_wallet_id, rule.fields.astrodao_role)) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && roles.push(_role);
        }
        if (member._roles.includes(rule.role_id) && !astrodaoUtils.isMemberHaveRole(rule.key_field[1], _userInfo.near_wallet_id, rule.fields.astrodao_role)) {
          const _role = discordUtils.getRoles(rule.guild_id, rule.role_id);
          _role && delRoles.push(_role);
        }
      }
    }

    for (const rule of delRoleList) {
      await userFields.deleteUserField({
        near_wallet_id: _userInfo.near_wallet_id,
        key: rule.key_field[0],
        value: rule.key_field[1],
      });
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
};

module.exports = update_guild_task;