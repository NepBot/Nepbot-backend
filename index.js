// Load config info
const config = require('./pkg/utils/config');

// Load logger
const logger = require('./pkg/utils/logger');

// Checking connection of mysql whether success or not.
require('./pkg/models/db_driver/mysql_driver');

// Sync models to mysql
require('./pkg/utils/sync_models');

// Run backend app
const app = require('./service/app');
app.listen(config.port, () => {
  logger.info(`app listening at http://127.0.0.1:${config.port}/api`);
});

// Run discord bot
require('./service/discord_bot');

// Run twitter app
require('./service/twitter_app');

// Run schedule task
const task = require('./service/schedule_task');
task.scheduleTask();
task.guildDeleteTask();
task.userDisconnectTask();
// schedule need to be run here