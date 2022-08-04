const logger = require('../../pkg/utils/logger');
const contractUtils = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const parasUtils = require('../../pkg/utils/paras_api');
const config = require('../../pkg/utils/config');
const userInfos = require('../../pkg/models/object/user_infos');
const userFields = require('../../pkg/models/object/user_fields');
const astrodaoUtils = require('../../pkg/utils/astrodao_utils');
const BN = require('bn.js');
const { verifySign } = require('./near_utils');


exports.verifyUserId = async (args, sign) => {
  if (!(await this.verifyUserSign(args, sign))) {
    return false;
  }
  const nonce = Date.now();
  await userInfos.updateUser({
    user_id: args.user_id,
    guild_id: args.guild_id,
    nonce: nonce,
  });
  return nonce;
};

exports.verifyUserSign = async (args, sign) => {
  const userInfo = await userInfos.getUser({ user_id: args.user_id, guild_id: args.guild_id });
  logger.debug(Date.now(), userInfo.nonce);
  if (Date.now() - userInfo.nonce > 300 * 1000) { // 5min limit
    logger.error('the user nonce is great than 5 mintes');
    return false;
  }
  const keyStore = config.nearWallet.keyStore;
  const accountId = config.account_id;
  const keyPair = await keyStore.getKey(config.nearWallet.networkId, accountId);
  const ret = verifySign({
    nonce: userInfo.nonce,
    ...args,
  }, sign, keyPair.publicKey.toString().replace('ed25519:', ''));
  return ret;
};

exports.setUser = async (args, accountId) => {
  const rules = await contractUtils.getRules(args.guild_id);
  const roleList = Array.from(new Set(rules.map(({ role_id }) => role_id)));
  const result = await userInfos.getUsers({
    guild_id: args.guild_id,
    near_wallet_id: accountId,
  });
  for (const user_info of result) {
    if (user_info.user_id != args.user_id) {
      const member = await discordUtils.getMember(args.guild_id, args.user_id);
      if (member.roles) {
        for (let role of roleList) {
          try {
            member.roles.remove(role)
          } catch (e) {
            continue
          }
        }
      }
    }
  }

  // update user
  await userInfos.addUser({
    near_wallet_id: accountId,
    user_id: args.user_id,
    guild_id: args.guild_id,
  });

  //
  const member = await discordUtils.getMember(args.guild_id, args.user_id);
  const rulesMap = {
    token: [],
    oct: [],
    balance: [],
    nft: [],
    paras: [],
    astrodao: [],
  };
  for (const rule of rules) {
    if (rule.key_field[0] == 'token_id') {
      rulesMap.token.push(rule);
    }
    else if (rule.key_field[0] == 'appchain_id') {
      rulesMap.oct.push(rule);
    }
    else if (rule.key_field[0] == 'near') {
      rulesMap.balance.push(rule);
    }
    else if (rule.key_field[0] == 'nft_contract_id') {
      rulesMap.nft.push(rule);
    }
    else if (rule.key_field[0] == config.paras.nft_contract) {
      rulesMap.paras.push(rule);
    }
    else if (rule.key_field[0] == 'astrodao_id') {
      rulesMap.astrodao.push(rule);
    }
    await userFields.addUserField({
      near_wallet_id: accountId,
      key: rule.key_field[0],
      value: rule.key_field[1],
    });
  }
  const roles = [];
  const delRoles = [];
  for (const rule of rulesMap.token) {
    try {
      let stakedParas = new BN('0');
      if (rule.key_field[1] === config.paras.token_contract) {
        stakedParas = await contractUtils.getStakedParas(accountId);
      }
      const newAmount = await contractUtils.getBalanceOf(rule.key_field[1], accountId);
      const tokenAmount = new BN(newAmount).add(stakedParas);

      if (!member._roles.includes(rule.role_id) && tokenAmount.cmp(new BN(rule.fields.token_amount)) != -1) {
        roles.push(rule.role_id);
      }
      if (member._roles.includes(rule.role_id) && tokenAmount.cmp(new BN(rule.fields.token_amount)) == -1) {
        delRoles.push(rule.role_id);
      }
    }
    catch (e) {
      console.log(e)
      continue;
    }

  }

  for (const rule of rulesMap.oct) {
    try {
      const octRole = await contractUtils.getOctAppchainRole(rule.key_field[1], accountId, rule.fields.astrodao_role);

      if (!member._roles.includes(rule.role_id) && octRole == rule.fields.oct_role) {
        roles.push(rule.role_id);
      }
      if (member._roles.includes(rule.role_id) && !octRole == rule.fields.oct_role) {
        delRoles.push(rule.role_id);
      }
    }
    catch (e) {
      console.log(e)
      continue;
    }
  }

  for (const rule of rulesMap.balance) {
    try {
      const balance = await contractUtils.getNearBalanceOf(accountId);
      const stakingBalance = await contractUtils.getStakingBalance(accountId);
      const totalBalance = new BN(balance).add(new BN(stakingBalance));

      if (!member._roles.includes(rule.role_id) && totalBalance.cmp(new BN(rule.fields.balance)) != -1) {
        roles.push(rule.role_id);
      }
      if (member._roles.includes(rule.role_id) && totalBalance.cmp(new BN(rule.fields.balance)) == -1) {
        delRoles.push(rule.role_id);
      }
    }
    catch (e) {
      console.log(e)
      continue;
    }

  }

  for (const rule of rulesMap.nft) {
    try {
      const tokenAmount = await contractUtils.getNftCountOf(rule.key_field[1], accountId);
      if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
        roles.push(rule.role_id);
      }
      if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
        delRoles.push(rule.role_id);
      }
    }
    catch (e) {
      console.log(e)
      continue;
    }

  }

  // for (const rule of rulesMap.paras) {
  //   try {
  //     const tokenAmount = await parasUtils.getTokenPerOwnerCount(rule.key_field[1], accountId, rule.fields.token_amount);
  //     if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
  //       roles.push(rule.role_id);
  //     }
  //     if (member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
  //       delRoles.push(rule.role_id);
  //     }
  //   }
  //   catch (e) {
  //     console.log(e)
  //     continue;
  //   }

  // }

  for (const rule of rulesMap.astrodao) {
    try {
      const _result = await astrodaoUtils.isMemberHaveRole(rule.key_field[1], accountId);

      if (!member._roles.includes(rule.role_id) && _result) {
        roles.push(rule.role_id);
      }
      if (member._roles.includes(rule.role_id) && _result) {
        delRoles.push(rule.role_id);
      }
    }
    catch (e) {
      console.log(e)
		  continue;
    }
  }

  for (const role of roles) {
    try {
      await member.roles.add(role);
    }
    catch (e) {
      console.log(e)
      continue;
    }
  }

  for (const role of delRoles) {
    try {
      await member.roles.remove(role);
    }
    catch (e) {
      console.log(e)
      continue;
    }

  }

};
