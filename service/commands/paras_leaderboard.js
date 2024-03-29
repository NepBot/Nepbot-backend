const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../../pkg/utils/logger');
const parasUtils = require('../../pkg/utils/paras_api');
const table = require('text-table');

const data = new SlashCommandBuilder()
  .setName('paras_leaderboard')
  .setDescription('Tracking the leader board on paras OR input a account_id to track your rank')
  .addStringOption(option => option.setName('account_id').setDescription('Input account id in paras.').setRequired(false));

const execute = async interaction => {
  // https://api-v2-mainnet.paras.id/raffle/642a95b00e4aa1138038e24b/leaderboards?__skip=0&__limit=10&raffle_type=silver&account_id=eeedo.near
  const raffleId = await parasUtils.getRaffleId();
  if (raffleId == null || raffleId == undefined) {
    return await interaction.reply({
      content:'The leaderboard will be available on the next raffle registration period. Stay tuned to Paras’ social media channels for more info on the upcoming raffle! :blue_heart:',
      ephemeral: false,
    });
  }
  // const raffleId = "642a95b00e4aa1138038e24b"
  let accountId = '';
  try {
    accountId = interaction.options.get('account_id').value;
    const platinum = await parasUtils.getLeaderBoard(raffleId, 'platinum', accountId);
    const gold = await parasUtils.getLeaderBoard(raffleId, 'gold', accountId);
    const silver = await parasUtils.getLeaderBoard(raffleId, 'silver', accountId);
    if (platinum.rank != undefined) {
      await interaction.reply({
        content:'\n',
        embeds:[addFields(new MessageEmbed().setTitle('Platinum Member').setColor('DARK_GREY'), platinum)],
        ephemeral: true,
      });
    }
    else if (gold.rank != undefined) {
      await interaction.reply({
        content:'\n',
        embeds:[addFields(new MessageEmbed().setTitle('Gold Member').setColor('YELLOW'), gold)],
        ephemeral: true,
      });
    }
    else if (silver.rank != undefined) {
      await interaction.reply({
        content:'\n',
        embeds:[addFields(new MessageEmbed().setTitle('Silver Member').setColor('WHITE'), silver)],
        ephemeral: true,
      });
    }
    else {
      await interaction.reply({
        content:'You haven’t signed up for the raffle yet. You can check the raffle registration mechanism & period here: https://paras.id/loyalty.',
        ephemeral: true,
      });
    }
    return;
  }
  catch (e) {
    logger.debug('paras_leaderboard no accountId');
    logger.error(e);
  }

  const platinum = await parasUtils.getLeaderBoard(raffleId, 'platinum');
  if (platinum == null) {
    return await interaction.reply({
      content:'There is no raffle active this moment',
      ephemeral: true,
    });
  }
  await interaction.reply({
    content:`\`Platinum Members\n${generateTable(platinum)}\n\``,
    ephemeral: true,
  });

  const gold = await parasUtils.getLeaderBoard(raffleId, 'gold');
  await interaction.followUp({
    content:`\`Gold Members\n${generateTable(gold)}\n\``,
    ephemeral: true,
  });

  const silver = await parasUtils.getLeaderBoard(raffleId, 'silver');
  await interaction.followUp({
    content:`\`Silver Members\n${generateTable(silver)}\n\``,
    ephemeral: true,
  });
};

module.exports = {
  data,
  execute,
};

function generateTable(leaderBoard) {
  const tableData = [['TOP 10', 'Username', 'Locked Staking(LS)', 'Duration', 'Duration Point', 'Total Raffle Point']];
  for (let i = 1; i < leaderBoard.length + 1; i++) {
    let accountId = leaderBoard[i - 1].account_id;
    if (accountId.length >= 64) {
      accountId = accountId.substring(0, 8) + '...' + accountId.substring(accountId.length - 7);
    }
    tableData[i] = [i, accountId, leaderBoard[i - 1].locked_amount.toString() + ' ℗', Math.floor(leaderBoard[i - 1].locked_duration / (3600000 * 24)) + ' days', leaderBoard[i - 1].duration_points.toString(), leaderBoard[i - 1].total_points.toString()];
  }
  return table(tableData, { align: [ 'c', 'c', 'c', 'c', 'c', 'c'] });
}

function addFields(messageEmbed, accountInfo) {
  return messageEmbed.addFields(
    { name: 'Rank', value: accountInfo.rank.toString() },
    { name: 'Username', value: accountInfo.data.account_id, inline: true },
    { name: 'Raffle_type', value: accountInfo.data.raffle_type, inline: true },
    { name: 'Locked Staking(LS)', value: accountInfo.data.locked_amount.toString() + ' ℗', inline: true },
    { name: 'Duration', value: Math.floor(accountInfo.data.locked_duration / (3600000 * 24)) + ' days', inline: true },
    { name: 'Duration Point', value: accountInfo.data.duration_points.toString(), inline: true },
    { name: 'Total Raffle Point', value: accountInfo.data.total_points.toString(), inline: true },
  );
}