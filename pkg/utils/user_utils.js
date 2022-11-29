const logger = require('./logger');
const contractUtils = require('./contract_utils');
const discordUtils = require('./discord_utils');
const parasUtils = require('./paras_api');
const config = require('./config');
const userInfos = require('../models/object/user_infos');
const userFields = require('../models/object/user_fields');
const userDisconnects = require('../models/object/user_disconnects');
const astrodaoUtils = require('./astrodao_utils');
const schedule = require('node-schedule');
const timeUtils = require('./time_utils');
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
// this.verifyUserId({ user_id: '912438768043196456', guild_id: '966966468774350948', contract_address: 'jacktest.sputnikv2.testnet' }, '5CcghkEQAaYHmjZwYTFyKgfgwNNJNAde7CwodnLWJPLQeWULtdN5GkWJ98xPiK1Hb2BKkndiEWn8gJDCrSvZj1tA').then(console.log);

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
    try {
      if (user_info.user_id != args.user_id) {
        await this.deleteAllRole(args.guild_id, args.user_id);

        const EXPIRED_DAY = 1; // days
        const expiredAt = await timeUtils.getExpiredTimeByDay(EXPIRED_DAY);
        await userDisconnects.add({
          guild_id: args.guild_id,
          user_id: args.user_id,
          expired_at: expiredAt,
        });
        await userInfos.updateUser({
          guild_id: args.guild_id,
          user_id: args.user_id,
          near_wallet_id: null,
        });
        const jobName = args.user_id + '-' + args.guild_id;
        const job = schedule.scheduleJob(jobName, expiredAt, function() {
          this.deleteData(args.user_id, args.guild_id);
        });
        logger.info(`create new user disconnect schedule job, name: ${job.name} run at ${expiredAt}`);
      }
    }
    catch (e) {
      logger.error(e);
    }
  }
  // update user
  await userInfos.addUser({
    near_wallet_id: accountId,
    user_id: args.user_id,
    guild_id: args.guild_id,
  }).catch(e => logger.error(e));

  // check the data in user_disconnect, if exists, delete the data in user_disconnects and cancel schedule job.
  if (await userDisconnects.get({ user_id: args.user_id, guild_id: args.guild_id })) {
    await userDisconnects.delete({
      guild_id: args.guild_id,
      user_id: args.user_id,
    });
    const jobName = args.user_id + '-' + args.guild_id;
    const job = schedule.scheduledJobs[jobName];
    job.cancel();
    logger.info(`the user: ${args.user_id} reconnect wallet: ${accountId}, so cancel the job: ${job.name}`);
  }

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
          }
          else {
            isAddRole = isAddRole || false;
          }
          await userFields.addUserField({
            near_wallet_id: accountId,
            key: rule.key_field[0],
            value: rule.key_field[1],
          }).catch(e => logger.error(e));
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
  else if (rule.key_field[0] == 'gating_rule' && rule.key_field[1] == 'Loyalty Level') {
    try {
      const userLevel = await parasUtils.getUserInfo(walletId).then(e => e.level.charAt(0).toUpperCase() + e.level.slice(1));
      if (!await parasUtils.checkUserLevel(userLevel, rule.fields.loyalty_level)) {
        logger.debug(`unsatisfying the ${rule.fields.loyalty_level} rule walletId: ${walletId}`);
        return false;
      }
      return true;
    }
    catch (e) {
      return false;
    }
  }
  else if (rule.key_field[0] == 'gating_rule' && rule.key_field[1] == 'Paras Staking') {
    try {
      const userLockSeed = await parasUtils.getUserLockedSeeds(walletId);
      const duration = Math.floor(userLockSeed.ended_at / (3600 * 24)) - Math.floor(userLockSeed.started_at / (3600 * 24));
      const isGreatDuration = duration >= parseInt(rule.fields.paras_staking_duration);
      const checkBalance = new BN(userLockSeed.balance).cmp(new BN(rule.fields.paras_staking_amount)) != -1 ? true : false;
      if (isGreatDuration) {
        if (checkBalance) {
          logger.debug(`satisfy the {paras_staking} rule walletId: ${walletId}`);
          return true;
        }
        else {
          logger.debug(`unsatisfying the {paras_staking} rule walletId: ${walletId}`);
          return false;
        }
      }
      else {
        return false;
      }
    }
    catch (e) {
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
    if (await astrodaoUtils.isMemberHaveRole(rule.key_field[1], walletId, rule.fields.astrodao_role)) {
      logger.debug(`satisfy the {astrodao_id} rule walletId: ${walletId}`);
      return true;
    }
    else {
      logger.debug(`unsatisfying the {astrodao_id} rule walletId: ${walletId}`);
      return false;
    }
  }
};

// this.isMemberSatisfyRule('dolmat.near', {
//   guild_id: '935095654924042240',
//   role_id: '935096627511820309',
//   fields: { paras_staking_amount: "7000000000000000000", paras_staking_duration: "30" },
//   key_field: [ 'gating_rule', 'Paras Staking' ],
// }).then(console.log).catch(e => console.log(e));

exports.deleteData = async (userId, guildId) => {

  try {
    await userDisconnects.delete({
      user_id: userId,
      guild_id: guildId,
    });
    await userInfos.deleteUser({
      user_id: userId,
      guild_id: guildId,
    });
  }
  catch (e) {
    logger.error(e);
  }
};

exports.deleteAllRole = async (guildId, userId) => {
  // remove all roles for user
  try {
    const rules = await contractUtils.getRules(guildId);
    const roleList = Array.from(new Set(rules.map(({ role_id }) => role_id)));
    const member = await discordUtils.getMember(guildId, userId);
    for (const role of roleList) {
      await member.roles.remove(role).then(logger.info(`${member.user.username} remove role_id ${role}`)).catch(e => logger.error(e));
    }
  }
  catch (e) {
    logger.error(e);
  }
};
