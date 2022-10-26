const logger = require('../../pkg/utils/logger');
const userInfos = require('../../pkg/models/object/user_infos');
const twitterUsers = require('../../pkg/models/object/twitter_users');

const execute = async member => {
  try {
    const userInfo = await userInfos.getUser({
      guild_id: { $ne: member.guild.id },
      user_id: member.id,
    });
    if (!userInfo) {
      await twitterUsers.delete({ user_id: member.id });
    }
    await userInfos.deleteUser({ user_id: member.id, guild_id: member.guild.id }).then(logger.info(`member remove in database&guild id: ${member.id}, guild: ${member.guild.id}`));
  }
  catch (e) {
    logger.error(e);
  }
};

module.exports = {
  name: 'guildMemberRemove',
  execute,
};