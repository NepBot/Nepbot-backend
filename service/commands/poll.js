const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../../pkg/utils/logger');

const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a poll')
  .addStringOption(option =>
    option.setName('question')
      .setDescription('The question of this poll')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('options')
      .setDescription(' Using \'+\' to be the separator')
      .setRequired(false));

const execute = async interaction => {
  const question = interaction.options.get('question').value;
  let options = undefined;
  try {
    options = interaction.options.get('options').value;
  }
  catch (e) {
    logger.debug('poll.options is null');
  }

  if (options === undefined) {
    const embed = new MessageEmbed().setTitle('📊 ' + question).setColor('#00D1CD');
    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    message.react('👍');
    message.react('👎');
  }
  else {
    const embed = new MessageEmbed().setTitle('📊 ' + question).setColor('#00D1CD');
    const alphabet = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱',
      '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿'];
    options = options.split('+');
    if (options.length > alphabet.length) {
      return await interaction('Please don\'t input more than 26 options.').then(sent => {
        setTimeout(() => {
          sent.delete();
        }, 2000);
      });
    }
    let description = '';
    for (let i = 0; i < options.length; i++) {
      description += `${alphabet[i]} ${options[i]} \n`;
    }
    embed.setDescription(description);
    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    for (let i = 0; i < options.length; i++) {
      message.react(alphabet[i]);
    }
  }

};

module.exports = {
  data,
  execute,
};
