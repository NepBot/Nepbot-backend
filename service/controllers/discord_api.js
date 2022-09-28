const Resp = require('../../pkg/models/object/response');
const discordUtils = require('../../pkg/utils/discord_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const userUtils = require('../../pkg/utils/user_utils');
const logger = require('../../pkg/utils/logger');
const config = require('../../pkg/utils/config');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');


const getRole = async (ctx, next) => {
  const guildId = ctx.params.guildId;
  const roles = await discordUtils.getRoles(guildId);
  ctx.body = new Resp({ data: roles });
};

const getServer = async (ctx, next) => {
  const guildId = ctx.params.guildId;
  const serverList = await discordUtils.getGuild(guildId);
  ctx.body = new Resp({ data: serverList });
};

const getUser = async (ctx, next) => {
  const guildId = ctx.params.guildId;
  const userId = ctx.params.userId;
  const sign = ctx.params.sign;
  if (!await userUtils.verifyUserSign({ user_id: userId, guild_id: guildId }, sign)) {
    logger.error('fn verifyUserId failed in api/setInfo');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyUserId failed in api/getOwnerSign',
      success: false,
    });
    return;
  }
  const member = await discordUtils.getMember(guildId, userId);
  ctx.body = new Resp({ data: member });
};

const getConnectedAccount = async (ctx, next) => {
  const guildId = ctx.params.guildId;
  const userId = ctx.params.userId;
  const userInfo = await userInfos.getUser({
    guild_id: guildId,
    user_id: userId,
  });
  ctx.body = new Resp({ data: userInfo.near_wallet_id });
};

/**
 * 
 * @param {*} ctx.request.body {
    "guild_id":"966966468774350948",
    "channel_id":"966966468774350951",
    "role_id":"1014164987121512448",
    "token_id":"test",
    "total_amount":"100",
    "amount_per_share":"10",
    "end_time":"2022-09-14T13:02:02.972Z"
}
 * @param {*} next 
 */
const sendFTAirdropMsg = async (ctx, next) => {
  const req = ctx.request.body;
  logger.info(`receive request from /api/airdrop/sendftmsg ${JSON.stringify(req)}`);
  try {
    const guild = await discordUtils.getGuild(req.guild_id);
    const channel = await discordUtils.getChannel(req.guild_id, req.channel_id);
    const roleName = await guild.roles.fetch(req.role_id).then(e => e.name.split('@').at(-1));
    const content = new MessageEmbed()
      .addFields(
        { name: 'Receiver_role', value: '@' + roleName },
        { name: 'Token_id', value: req.token_id },
        { name: 'Total_amount', value: req.total_amount },
        { name: 'Amount_per_share', value: req.amount_per_share },
        { name: 'End_time(GMT)', value: req.end_time },
        { name: 'Hash', value: req.hash },
      );
    const claim = new MessageButton()
      .setCustomId('action.claim_ft')
      .setLabel('Claim FT')
      .setStyle('PRIMARY');
    const component = new MessageActionRow()
      .addComponents(claim);
    await channel.send({ content: '\n', ephemeral:true, embeds:[content.setDescription('Claim FT: Used for user to claim the FT')], components: [component] });

    const settingChannel = await guild.channels.fetch().then(e => e.find(r => r.name == 'nepbot-settings'));
    const redeem = new MessageButton()
      .setCustomId('action.redeem_ft')
      .setLabel('Redeem FT')
      .setStyle('PRIMARY');
    const redeemComponent = new MessageActionRow()
      .addComponents(redeem);
    await settingChannel.send({ content: '\n', ephemeral:true, embeds:[content.setDescription('Redeem FT: Used for user to redeem the FT')], components: [redeemComponent] });
    ctx.body = new Resp({});
  }
  catch (e) {
    logger.error(e);
    ctx.body = new Resp({ code: 500, message: 'error sendFTAirdropMsg', success: false });
  }
};

/**
 * 
 * @param {*} ctx.request.body {
    "guild_id":"966966468774350948",
    "channel_id":"966966468774350951",
    "role_id":"1004475262097952848",
    "contract_address":"test",
    "token_id":"test",
    "end_time":"2022-09-18T11:30:57.366Z"
}
 * @param {*} next 
 */
const sendNFTAirdropMsg = async (ctx, next) => {
  const req = ctx.request.body;
  logger.info(`receive request from /api/airdrop/sendnftmsg ${JSON.stringify(req)}`);
  try {
    const guild = await discordUtils.getGuild(req.guild_id);
    const channel = await discordUtils.getChannel(req.guild_id, req.channel_id);
    const roleName = await guild.roles.fetch(req.role_id).then(e => e.name.split('@').at(-1));
    const content = new MessageEmbed()
      .addFields(
        { name: 'Receiver_role', value: '@' + roleName },
        { name: 'Contract_address', value: req.contract_address },
        { name: 'Token_id', value: req.token_id },
        { name: 'End_time(GMT)', value: req.end_time },
        { name: 'Hash', value: req.hash },
      );
    const claim = new MessageButton()
      .setCustomId('action.claim_nft')
      .setLabel('Claim NFT')
      .setStyle('PRIMARY');
    const claimComponent = new MessageActionRow()
      .addComponents(claim);
    await channel.send({ content: '\n', ephemeral:true, embeds:[content.setDescription('Claim NFT: Used for user to claim the NFT')], components: [claimComponent] });

    const settingChannel = await guild.channels.fetch().then(e => e.find(r => r.name == 'nepbot-settings'));
    const redeem = new MessageButton()
      .setCustomId('action.redeem_nft')
      .setLabel('Redeem NFT')
      .setStyle('PRIMARY');
    const redeemComponent = new MessageActionRow()
      .addComponents(redeem);
    await settingChannel.send({ content: '\n', ephemeral:true, embeds:[content.setDescription('Redeem NFT: Used for user to redeem the NFT')], components: [redeemComponent] });
    ctx.body = new Resp({});
  }
  catch (e) {
    logger.error(e);
    ctx.body = new Resp({ code: 500, message: 'error sendNFTAirdropMsg', success: false });
  }
};

module.exports = {
  'GET /api/getRole/:guildId': getRole,
  'GET /api/getServer/:guildId': getServer,
  'GET /api/getUser/:guildId/:userId/:sign': getUser,
  'GET /api/getConnectedAccount/:guildId/:userId': getConnectedAccount,
  'POST /api/airdrop/sendFTMsg': sendFTAirdropMsg,
  'POST /api/airdrop/sendNFTMsg': sendNFTAirdropMsg,
};