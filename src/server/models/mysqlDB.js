const {Sequelize} = require('sequelize');
const {MYSQL} = require('../../utils/secret.js').secret;
const Op = Sequelize.Op;
const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $in: Op.in,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col
};
const mySqlPool = new Sequelize(MYSQL.database,MYSQL.user,MYSQL.password,{
    host:MYSQL.host,
    dialect: 'mysql',
    timezone: '+00:00',
    operatorsAliases
})


module.exports = mySqlPool;
