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
  });

  // add role for new user
  const member = await discordUtils.getMember(args.guild_id, args.user_id);
  for (const rule of rules) {
    logger.debug(`rule in setUser ${JSON.stringify(rule)}`);
    if (!await discordUtils.isMemberIncludeRole(args.guild_id, args.user_id, rule.role_id) && await this.isMemberSatisfyRule(accountId, rule)) {
      try {
        logger.debug(`the user is not in role ${rule.role_id} & it satisfy the rule ${JSON.stringify(rule)}`);
        await member.roles.add(rule.role_id).then(logger.info(`${member.user.username} add role_id ${rule.role_id} in setUser`)).catch(e => logger.error(e));
        await userFields.addUserField({
          near_wallet_id: accountId,
          key: rule.key_field[0],
          value: rule.key_field[1],
        });
        logger.debug(`${args.user_id} add role & addUserFields`);
      }
      catch (e) {
        logger.error(e);
        continue;
      }
    }
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
