const config = require('../pkg/utils/config');
const { TwitterApi } = require('twitter-api-v2');

// Instantiate with desired auth type (here's Bearer v2 auth)
const twitterClient = new TwitterApi({ clientId: config.client_id, clientSecret: config.client_secret });

module.exports = twitterClient;
