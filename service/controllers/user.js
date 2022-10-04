const logger = require('../../pkg/utils/logger');
const Resp = require('../../pkg/models/object/response');
const nearUtils = require('../../pkg/utils/near_utils');
const userUtils = require('../../pkg/utils/user_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const contractUtils = require('../../pkg/utils/contract_utils');
const timeUtils = require('../../pkg/utils/time_utils');
const userDisconnects = require('../../pkg/models/object/user_disconnects');
const schedule = require('node-schedule');
const { MessageEmbed } = require('discord.js');

const embed = new MessageEmbed()
  .setColor('#0099ff')
  .setTitle('Verify success')
  .setDescription('');


const setInfo = async (ctx, next) => {
  const req = ctx.request.body;
  const args = req.args;
  logger.info(`revice request by access 'api/setInfo': ${JSON.stringify(req)}`);
  // verify user account
  if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
    logger.error('fn verifyAccountOwner failed in api/setInfo');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyAccountOwner failed in api/getOwnerSign',
      success: false,
    });
    return;
  }
  // verify user id
  if (!await userUtils.verifyUserId({ user_id: args.user_id, guild_id: args.guild_id }, args.sign)) {
    logger.error('fn verifyUserId failed in api/setInfo');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyUserId failed in api/getOwnerSign',
      success: false,
    });
    return;
  }

  await userUtils.setUser(args, req.account_id);

  // const interaction = discordUtils.getInteraction(args.user_id, args.guild_id);
  // if (interaction) {
  //   await interaction.editReply({ content: '\n', ephemeral:true, embeds:[embed], components: [] });
  // }

  ctx.body = new Resp({});
};

const disconnectAccount = async (ctx, next) => {
  const EXPIRED_DAY = 1; // days
  const args = ctx.request.body;
  logger.info(`revice request by access 'api/disconnectAccount': ${JSON.stringify(args)}`);
  // verify user account
  // verify user id
  if (!await userUtils.verifyUserSign({ user_id: args.user_id, guild_id: args.guild_id }, args.sign)) {
    logger.error('fn verifyUserId failed in api/disconnectAccount');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyUserId failed in api/disconnectAccount',
      success: false,
    });
    return;
  }

  /**
   * when user disconnect, the data in database will save @EXPIRED_DAY days, the following code will create a schedule job to delete data after that days
   */
  try {
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
      userUtils.deleteDataAndRole(args.user_id, args.guild_id);
    });
    logger.info(`create new user disconnect schedule job, name: ${job.name} run at ${expiredAt}`);
  }
  catch (e) {
    logger.error(e);
  }
  ctx.body = new Resp({});
};

module.exports = {
  'POST /api/setInfo': setInfo,
  'POST /api/disconnectAccount': disconnectAccount,
};