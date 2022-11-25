const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../../pkg/utils/logger');
const parasUtils = require('../../pkg/utils/paras_api');
const timeUtils = require('../../pkg/utils/time_utils');

const data = new SlashCommandBuilder()
  .setName('paras_staking')
  .setDescription('Tracking your staking status on paras')
  .addStringOption(option => option.setName('account_id').setDescription('Input account id in paras.').setRequired(true));

const execute = async interaction => {

  const content = new MessageEmbed()
    .setTitle('Paras Staking')
    .setColor('BLURPLE');

  const accountId = interaction.options.get('account_id').value;
  try {
    const lockedInfo = await parasUtils.getUserLockedSeeds(accountId);
    content.addFields(
      { name: 'Amount', value: parasUtils.prettyBalance(lockedInfo.balance) + ' ℗' },
      { name: 'Duration', value: Math.floor(lockedInfo.ended_at / (3600 * 24)) - Math.floor(lockedInfo.started_at / (3600 * 24)) + ' days' },
      { name: 'Start From', value: await timeUtils.getUTCTime(lockedInfo.started_at * 1000) },
      { name: 'End At', value: await timeUtils.getUTCTime(lockedInfo.ended_at * 1000) },
      { name: 'Count Down', value: Math.floor((lockedInfo.ended_at * 1000 - new Date().getTime()) / (3600000 * 24)) + ' days' },
    );
    return await interaction.reply({
      content:'\n',
      embeds:[content],
      ephemeral: true,
    });
  }
  catch (e) {
    logger.error(e);
  }
};

module.exports = {
  data,
  execute,
};