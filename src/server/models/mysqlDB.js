const {Sequelize} = require('sequelize');
const {MYSQL} = require('../../utils/secret.js').secret;
const mySqlPool = new Sequelize(MYSQL.database,MYSQL.user,MYSQL.password,{
    host:MYSQL.host,
    dialect: 'mysql',
    timezone: '+00:00'
})


module.exports = mySqlPool;
