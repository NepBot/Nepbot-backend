const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const TwitterRules = mysql.define('twitter_rules', {
  user_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  guild_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  role_id:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  type:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  tweet_id:{
    type:DataTypes.STRING,
    allowNull: true,
  },
});

exports.get = async (data) => {
  const twitterRule = await TwitterRules.findOne({
    where:data,
  });
  return twitterRule;
};

exports.list = async (data) => {
  const twitterRules = await TwitterRules.findAll({
    where:data,
  });
  return twitterRules;
};

exports.add = async (data) => {
  return await TwitterRules.findOrCreate({
    where: data,
  });
};

exports.delete = async (data) => {
  return await TwitterRules.destroy({
    where: data,
  });
};