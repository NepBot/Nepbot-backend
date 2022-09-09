const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const TwitterUsers = mysql.define('twitter_users', {
  user_id:{
    type:DataTypes.STRING,
    allowNull: true,
  },
  state:{
    type:DataTypes.STRING,
    allowNull: true,
  },
  access_token:{
    type:DataTypes.STRING,
    allowNull: true,
  },
  refresh_token:{
    type:DataTypes.STRING,
    allowNull: true,
  },
  expired_at: {
    type:DataTypes.DATE,
    allowNull: true,
  },
  twitter_id:{
    type:DataTypes.STRING,
    allowNull: true,
  },
  twitter_username:{
    type:DataTypes.STRING,
    allowNull: true,
  },
});

exports.get = async (data) => {
  const twitterRule = await TwitterUsers.findOne({
    where:data,
  });
  return twitterRule;
};

exports.list = async (data) => {
  const twitterRules = await TwitterUsers.findAll({
    where:data,
  });
  return twitterRules;
};

exports.add = async (data) => {
  return await TwitterUsers.findOrCreate({
    where: data,
  });
};

exports.update = async (params, condition) => {
  return await TwitterUsers.update(params, {
    where: condition,
  });
};

exports.delete = async (data) => {
  return await TwitterUsers.destroy({
    where: data,
  });
};