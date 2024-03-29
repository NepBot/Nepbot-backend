const logger = require('../../pkg/utils/logger');

const execute = async member => {
  logger.info(`New member joined id: ${member.id}, guild: ${member.guild.id} `);
};

module.exports = {
  name: 'guildMemberAdd',
  execute,
};