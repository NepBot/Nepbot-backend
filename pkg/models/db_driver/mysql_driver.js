/*
https://www.sequelize.com.cn/
*/
const logger = require('../../utils/logger');
const config = require('../../utils/config');
const { Sequelize, Op } = require('sequelize');

const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $in: Op.in,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col,
  $nin: Op.notIn,
};

const mysql = new Sequelize(`${config.mysql_url}`, {
  logging: msg => logger.debug(msg),
  operatorsAliases,
});

try {
  (async () => {
    await mysql.authenticate();
    logger.info('Connection with mysql has been established successfully.');
  })();
}
catch (error) {
  logger.error('Unable to connect to mysql:', error);
}

module.exports = mysql;