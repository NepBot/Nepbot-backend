const Resp = require('../../pkg/models/object/response');
const discordUtils = require('../../pkg/utils/discord_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const userUtils = require('../../pkg/utils/user_utils');
const snapshotUtils = require('../../pkg/utils/snapshot_utils');
const contractUtils = require('../../pkg/utils/contract_utils');
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
    const metadata = await contractUtils.getMetadata(req.token_contract)
    const content = new MessageEmbed()
      .setDescription('**Claim Token Airdrop**\nClick the button below to claim this airdrop')
      .addFields(
        { name: 'Qualified Role', value: '@' + roleName },
        { name: 'Token Contract', value: req.token_contract },
        { name: 'Total Reward Pool', value: `${req.total_amount} ${metadata.symbol}` },
        { name: 'Claimable Reward Per User', value: req.amount_per_share },
        { name: 'Expires at', value: req.end_time + ' (GMT)'},
        { name: 'Airdrop ID', value: req.hash },
      );
    const claim = new MessageButton()
      .setCustomId('action.claim_ft')
      .setLabel('Claim')
      .setStyle('PRIMARY');
    const component = new MessageActionRow()
      .addComponents(claim);
    await channel.send({ content: '\n', ephemeral:true, embeds:[content], components: [component] });

    const settingChannel = await guild.channels.fetch().then(e => e.find(r => r.name == 'nepbot-settings'));
    const redeem = new MessageButton()
      .setCustomId('action.redeem_ft')
      .setLabel('Redeem FT')
      .setStyle('PRIMARY');
    const redeemComponent = new MessageActionRow()
      .addComponents(redeem);
    await settingChannel.send({ content: '\n', ephemeral:true, embeds:[content.setDescription('**NEP141 Airdrop**\nClick the button below to redeem the Airdrop')], components: [redeemComponent] });
    ctx.body = new Resp({});
  }
  catch (e) {
    console.log(e)
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
        { name: 'Qualified Role', value: '@' + roleName },
        { name: 'Contract Address', value: req.contract_address },
        { name: 'Token_id', value: req.token_id },
        { name: 'Expires at', value: req.end_time + ' (GMT)' },
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

const sendSnapshotMsg = async (ctx, next) => {
  const req = ctx.request.body;
  logger.info(`receive request from /api/snapshot/sendmsg ${JSON.stringify(req)}`);
  try {
    const channel = await discordUtils.getChannel(req.guild_id, req.channel_id);
    const snapshotInfo = await snapshotUtils.getSnapshot(req.hash);
    const content = new MessageEmbed()
      .addFields(
        { name: 'Hash', value: snapshotInfo.hash },
        { name: 'Contract Address', value: snapshotInfo.contract_address },
        { name: 'Block Height', value: snapshotInfo.block_height.toString() },
      );
    await channel.send({ content: '\n', ephemeral:false, embeds:[content.setDescription('Create snapshot success')] });

    ctx.body = new Resp({});
  }
  catch (e) {
    logger.error(e);
    ctx.body = new Resp({ code: 500, message: 'error send snapshot msg', success: false });
  }
};

module.exports = {
  'GET /api/getRole/:guildId': getRole,
  'GET /api/getServer/:guildId': getServer,
  'GET /api/getUser/:guildId/:userId/:sign': getUser,
  'GET /api/getConnectedAccount/:guildId/:userId': getConnectedAccount,
  'POST /api/airdrop/sendFTMsg': sendFTAirdropMsg,
  'POST /api/airdrop/sendNFTMsg': sendNFTAirdropMsg,
  'POST /api/snapshot/sendMsg': sendSnapshotMsg,
};