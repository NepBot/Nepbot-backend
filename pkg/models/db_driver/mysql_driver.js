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
  $gte: Op.gte,
  $lte: Op.lte,
  $gt: Op.gt,
  $lt: Op.lt,
};

const mysql = new Sequelize(`${config.mysql_url}`, {
  logging: msg => logger.trace(msg),
  operatorsAliases,
});

try {
  mysql.authenticate().then(() => logger.info('Connection with mysql has been established successfully.'));
}
catch (error) {
  logger.error('Unable to connect to mysql:', error);
}

module.exports = mysql;
