const logger = require('./logger');
const contractUtils = require('./contract_utils');
const discordUtils = require('./discord_utils');
const parasUtils = require('./paras_api');
const config = require('./config');
const userInfos = require('../models/object/user_infos');
const userFields = require('../models/object/user_fields');
const astrodaoUtils = require('./astrodao_utils');
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
  if (!accountId) {
    return;
  }
  const rules = await contractUtils.getRules(args.guild_id);
  const roleList = Array.from(new Set(rules.map(({ role_id }) => role_id)));
  const result = await userInfos.getUsers({
    guild_id: args.guild_id,
    near_wallet_id: accountId,
  });
  // when user reverify another wallet, it will check the wallet id wether binding to other user, and then remove the role from the origin user
  for (const user_info of result) {
    if (user_info.user_id != args.user_id) {
      const member = await discordUtils.getMember(args.guild_id, args.user_id);
      if (member.roles) {
        for (const role of roleList) {
          try {
            await member.roles.remove(role).then(logger.info(`${member.user.username} remove role_id ${role} in setUser`)).catch(e => logger.error(e));
          }
          catch (e) {
            logger.error(e);
            continue;
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
  }).catch(e => logger.error(e));

  // add role for new user
  const member = await discordUtils.getMember(args.guild_id, args.user_id);
  for (const roleId of roleList) {

    let isAddRole = false;
    let notDelRole = false;

    // If the user don't in role
    if (!await discordUtils.isMemberIncludeRole(args.guild_id, args.user_id, roleId)) {
      // Second layer of the loop
      for (const rule of rules.filter(m => m.role_id == roleId)) {
        try {
          if (await this.isMemberSatisfyRule(accountId, rule)) {
            isAddRole = isAddRole || true;
            await userFields.addUserField({
              near_wallet_id: accountId,
              key: rule.key_field[0],
              value: rule.key_field[1],
            }).catch(e => logger.error(e));
          }
          else {
            isAddRole = isAddRole || false;
          }
        }
        catch (e) {
          isAddRole = isAddRole || false;
          logger.error(e);
          continue;
        }
      }

      if (isAddRole) {
        await member.roles.add(roleId).then(logger.info(`${member.user.username} add role_id ${roleId} in setUser`)).catch(e => logger.error(e));
      }

    }
    // If the user is in role
    else if (await discordUtils.isMemberIncludeRole(args.guild_id, args.user_id, roleId)) {
      // Second layer of the loop
      for (const rule of rules.filter(m => m.role_id == roleId)) {
        try {
          if (await this.isMemberSatisfyRule(accountId, rule)) {
            notDelRole = notDelRole || true;
            await userFields.deleteUserField({
              near_wallet_id: accountId,
              key: rule.key_field[0],
              value: rule.key_field[1],
            }).catch(e => logger.error(e));
          }
          else {
            notDelRole = notDelRole || false;
          }
        }
        catch (e) {
          logger.error(e);
          notDelRole = notDelRole || false;
          continue;
        }
      }

      if (!notDelRole) {
        await member.roles.remove(roleId).then(logger.info(`${member.user.username} remove role_id ${roleId} in setUser`)).catch(e => logger.error(e));
      }

    } // else finished in here
  }
};


/**
 *
 * @param {json} walletId near_wallet_id
 * @param {json} rule
 * @returns boolean
 */
exports.isMemberSatisfyRule = async (walletId, rule) => {
  if (rule.key_field[0] == 'token_id') {

    let stakedParas = new BN('0');
    if (rule.key_field[1] === config.paras.token_contract) {
      stakedParas = await contractUtils.getStakedParas(walletId);
    }
    const newAmount = await contractUtils.getBalanceOf(rule.key_field[1], walletId);
    const tokenAmount = new BN(newAmount).add(stakedParas);

    if (new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
      logger.debug(`satisfy the {token_id} rule walletId: ${walletId}`);
      return true;
    }
    else if (new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
      logger.debug(`unsatisfying the {token_id} rule walletId: ${walletId}`);
      return false;
    }

  }
  else if (rule.key_field[0] == 'appchain_id') {
    const octRole = await contractUtils.getOctAppchainRole(rule.key_field[1], walletId);
    if (octRole == rule.fields.oct_role) {
      logger.debug(`satisfy the {appchain_id} rule walletId: ${walletId}`);
      return true;
    }
    if (octRole != rule.fields.oct_role) {
      logger.debug(`unsatisfying the {appchain_id} rule walletId: ${walletId}`);
      return false;
    }
  }
  else if (rule.key_field[0] == 'near') {

    const balance = await contractUtils.getNearBalanceOf(walletId);
    const stakingBalance = await contractUtils.getStakingBalance(walletId);
    const totalBalance = new BN(balance).add(new BN(stakingBalance));

    if (new BN(totalBalance).cmp(new BN(rule.fields.balance)) != -1) {
      logger.debug(`satisfy the {near} rule walletId: ${walletId}`);
      return true;
    }
    if (new BN(totalBalance).cmp(new BN(rule.fields.balance)) == -1) {
      logger.debug(`unsatisfying the {near} rule walletId: ${walletId}`);
      return false;
    }
  }
  else if (rule.key_field[0] == 'nft_contract_id') {
    const tokenAmount = await contractUtils.getNftCountOf(rule.key_field[1], walletId);
    if (new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
      logger.debug(`satisfy the {nft_contract_id} rule walletId: ${walletId}`);
      return true;
    }
    if (new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
      logger.debug(`unsatisfying the {nft_contract_id} rule walletId: ${walletId}`);
      return false;
    }
  }
  else if (rule.key_field[0] == config.paras.nft_contract) {
    const tokenAmount = await parasUtils.getTokenPerOwnerCount(rule.key_field[1], walletId);
    if (new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1) {
      logger.debug(`satisfy the ${config.paras.nft_contract} rule walletId: ${walletId}`);
      return true;
    }
    if (new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1) {
      logger.debug(`unsatisfying the ${config.paras.nft_contract} rule walletId: ${walletId}`);
      return false;
    }
  }
  else if (rule.key_field[0] == 'astrodao_id') {
    if (astrodaoUtils.isMemberHaveRole(rule.key_field[1], walletId, rule.fields.astrodao_role)) {
      logger.debug(`satisfy the {astrodao_id} rule walletId: ${walletId}`);
      return true;
    }
    if (astrodaoUtils.isMemberHaveRole(rule.key_field[1], walletId, rule.fields.astrodao_role)) {
      logger.debug(`unsatisfying the {astrodao_id} rule walletId: ${walletId}`);
      return false;
    }
  }
};
