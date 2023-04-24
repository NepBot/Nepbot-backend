const Resp = require('../../pkg/models/object/response');
const logger = require('../../pkg/utils/logger');
const twitterClient = require('../../service/twitter_app');
const config = require('../../pkg/utils/config');
const oauthCache = require('../../pkg/models/object/oauth_cache');
const twitterUsers = require('../../pkg/models/object/twitter_users');
const twitterUtils = require('../../pkg/utils/twitter_utils');
const timeUtils = require('../../pkg/utils/time_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const twitterRulesMsg = require('../../pkg/models/object/twitter_rules_msg');


const callback = async (ctx, next) => {
  const callbackUrl = config.twitter.callback_url;
  // Extract state and code from query string
  const req = ctx.request.body;
  logger.info(`receive request by access 'api/twitter/callback': ${JSON.stringify(req)}`);
  const state = req.state;
  const code = req.code;
  // Get the saved codeVerifier from session
  // const codeVerifier = await oauthCache.get({ state: state })
  //   .then(e => e.code_verifier)
  //   .catch(() => ctx.body = new Resp({ code: 500 }));
  // if (!codeVerifier || !state || !code) {
  //   await oauthCache.delete({ state: state });
  //   return ctx.body = new Resp({ code: 500 });
  // }

  // await twitterClient.loginWithOAuth2({ code, codeVerifier, redirectUri: callbackUrl })
  //   .then(async ({ client: loggedClient, accessToken, refreshToken, expiresIn }) => {
    // {loggedClient} is an authenticated client in behalf of some user
    // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
    // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)
      // const { data: userObject } = await loggedClient.v2.me();
      // const expiredAt = await timeUtils.getExpiredTimeBySecond(expiresIn);
      // const params = { access_token: accessToken, refresh_token: refreshToken, expired_at: expiredAt, twitter_id: userObject.id, twitter_username: userObject.username };
      // const condition = { state: state };
      // await twitterUsers.update(params, condition);
      // await oauthCache.delete({ state: state });
      // const ruleMsg = await twitterRulesMsg.get({ twitter_state: state });
      // const dcMsg = await discordUtils.getMessage(ruleMsg.guild_id, ruleMsg.channel_id, ruleMsg.message_id);
      const result = [{
        name:'Already in role',
        value: `✅ You are already in this role ${roleName}.`
      }]       //await twitterUtils.verifyRuleFromDB(loggedClient, ruleMsg, dcMsg);
      await twitterRulesMsg.delete({ twitter_state: state });
      return ctx.body = new Resp({ data: result });
    // })
    // .catch(() => ctx.body = new Resp({ code: 500 }));
};

module.exports = {
  'POST /api/twitter/callback': callback,
};

// const callback = async (ctx, next) => {
//   const callbackUrl = config.twitter.callback_url;
//   // Extract state and code from query string
//   const { state, code } = ctx.query;
//   logger.info(`receive request by access 'api/twitter/callback': ${JSON.stringify(ctx.query)}`);
//   // const state = req.state;
//   // const code = req.code;
//   console.log(state, code);
//   // Get the saved codeVerifier from session
//   const codeVerifier = await oauthCache.get({ state: state })
//     .then(e => e.code_verifier)
//     .catch(() => ctx.statue = 500);
//   if (!codeVerifier || !state || !code) {
//     return ctx.statue = 500;
//   }

//   await twitterClient.loginWithOAuth2({ code, codeVerifier, redirectUri: callbackUrl })
//     .then(async ({ client: loggedClient, accessToken, refreshToken, expiresIn }) => {
//     // {loggedClient} is an authenticated client in behalf of some user
//     // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
//     // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)
//       const { data: userObject } = await loggedClient.v2.me();
//       const expiredAt = await timeUtils.getExpiredTimeBySecond(expiresIn);
//       const params = { access_token: accessToken, refresh_token: refreshToken, expired_at: expiredAt, twitter_id: userObject.id, twitter_username: userObject.username };
//       const condition = { state: state };
//       await twitterUsers.update(params, condition);
//       await oauthCache.delete({ state: state });
//       return ctx.statue = 200;
//     })
//     .catch(() => ctx.statue = 500);
// };

// module.exports = {
//   'GET /api/twitter/callback': callback,
// };