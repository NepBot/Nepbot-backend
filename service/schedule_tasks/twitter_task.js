const twitterUsers = require('../../pkg/models/object/twitter_users');
const twitterClient = require('../../service/twitter_app');
const twitterUtils = require('../../pkg/utils/twitter_utils');
const logger = require('../../pkg/utils/logger');
exports.refreshToken = async () => {
  const currentlyTime = new Date().toISOString();
  const listTwitterUsers = await twitterUsers.list({
    expired_at: { $lte: currentlyTime },
  });
  for (const twitterUser of listTwitterUsers) {
    try {
      const { client: refreshedClient, accessToken, refreshToken: newRefreshToken } = await twitterClient.refreshOAuth2Token(twitterUser.refresh_token);
      const params = { access_token: accessToken, refresh_token: newRefreshToken, expired_at: await twitterUtils.getExpiredTime(7200) };
      const condition = { guild_id: twitterUser.guild_id, user_id: twitterUser.user_id };
      await twitterUsers.update(params, condition);
      logger.debug(`${twitterUser} refresh token in twitter_task`);
    }
    catch (e) {
      logger.error(e);
      await twitterUsers.delete({ user_id: twitterUser.user_id, guild_id: twitterUser.guild_id }).then(logger.info(`delete twitter user in refresh_token_task ${JSON.stringify(twitterUser)}`));
    }
  }
};

// this.refreshToken();