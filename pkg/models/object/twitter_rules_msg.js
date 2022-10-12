const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const TwitterRulesMsg = mysql.define('twitter_rules_msg', {
  user_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  guild_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  channel_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  message_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  twitter_state:{
    type:DataTypes.STRING,
    allowNull: true,
  },
});

exports.get = async (data) => {
  const twitterRulesMsg = await TwitterRulesMsg.findOne({
    where:data,
  });
  return twitterRulesMsg;
};

exports.list = async (data) => {
  const twitterRulesMsg = await TwitterRulesMsg.findAll({
    where:data,
  });
  return twitterRulesMsg;
};

exports.add = async (data) => {
  return await TwitterRulesMsg.findOrCreate({
    where: data,
  });
};

exports.delete = async (data) => {
  return await TwitterRulesMsg.destroy({
    where: data,
  });
};