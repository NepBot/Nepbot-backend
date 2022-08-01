const logger = require('../../pkg/utils/logger');

const execute = async member => {
  logger.debug(`New member joind id: ${ member.id}, guild: ${ member.guild.id} `);
};

module.exports = {
  name: 'guildMemberAdd',
  execute,
};