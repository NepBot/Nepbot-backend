const Resp = require('../../pkg/models/object/response');
const logger = require('../../pkg/utils/logger');
const twitterClient = require('../../service/twitter_app');
const config = require('../../pkg/utils/config');
const oauthCache = require('../../pkg/models/object/oauth_cache');
const twitterUsers = require('../../pkg/models/object/twitter_users');
const twitterUtils = require('../../pkg/utils/twitter_utils');


const callback = async (ctx, next) => {
  const callbackUrl = config.twitter.callback_url;
  // Extract state and code from query string
  const req = ctx.request.body;
  const args = req.args;
  logger.info(`revice request by access 'api/twitter/callback': ${JSON.stringify(req)}`);
  const state = args.state;
  const code = args.code;
  // Get the saved codeVerifier from session
  const codeVerifier = await oauthCache.get({ state: state })
    .then(e => e.code_verifier)
    .catch(() => ctx.body = new Resp());

  if (!codeVerifier || !state || !code) {
    return ctx.body = new Resp();
  }

  await twitterClient.loginWithOAuth2({ code, codeVerifier, redirectUri: callbackUrl })
    .then(async ({ client: loggedClient, accessToken, refreshToken, expiresIn }) => {
    // {loggedClient} is an authenticated client in behalf of some user
    // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
    // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)
      const { data: userObject } = await loggedClient.v2.me();
      const expiredAt = await twitterUtils.getExpiredTime(expiresIn);
      const params = { access_token: accessToken, refresh_token: refreshToken, expired_at: expiredAt, twitter_id: userObject.id, twitter_username: userObject.username };
      const condition = { state: state };
      await twitterUsers.update(params, condition);
      await oauthCache.delete({ state: state });
      return ctx.body = new Resp();
    })
    .catch(e => logger.error(e));
};

module.exports = {
  'POST /api/twitter/callback': callback,
};