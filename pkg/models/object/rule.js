const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const rules = mysql.define('rules', {
  role_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  guild_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  token_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  amount:{
    type:DataTypes.STRING,
    allowNull: false,
  },
});


module.exports = rules;