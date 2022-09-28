const logger = require('./logger');
const mysql = require('../models/db_driver/mysql_driver');

try {
  logger.info('Start to sync all of the models... If the models already exists, it will not sync.');
  mysql.sync({ alter: true }).then(() => logger.info('Sync models to mysql finished.'));
}
catch (error) {
  logger.error('Unable to sync models to the database:', error);
}
