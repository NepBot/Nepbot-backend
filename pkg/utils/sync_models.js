require('../models/object/rule');
require('../models/object/user_infos');
require('../models/object/user_fields');
const logger = require('./logger');
const mysql = require('../models/db_driver/mysql_driver');

try {
  (async () => {
    logger.info('Start to sync all of the models... If the models already exists, it will not sync.');
    await mysql.sync({ alter: true });
    logger.info('Sync models to mysql finished.');
  })();
}
catch (error) {
  logger.error('Unable to sync models to the database:', error);
}

module.exports = mysql;
