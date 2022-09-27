const logger = require('../../pkg/utils/logger');
const userInfos = require('../../pkg/models/object/user_infos');

const execute = async member => {
  await userInfos.deleteUser({ user_id: member.id, guild_id: member.guild.id }).then(logger.info(`member remove in database&guild id: ${member.id}, guild: ${member.guild.id}`));
};

module.exports = {
  name: 'guildMemberRemove',
  execute,
};