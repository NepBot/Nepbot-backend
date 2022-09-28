const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const OauthCache = mysql.define('oauth_cache', {
  state:{
    type:DataTypes.STRING,
    allowNull: false,
  },
  code_verifier:{
    type:DataTypes.STRING,
    allowNull: false,
  },
});

exports.get = async (data) => {
  return await OauthCache.findOne({
    where:data,
  });
};

exports.list = async (data) => {
  return await OauthCache.findAll({
    where:data,
  });
};

exports.add = async (data) => {
  return await OauthCache.findOrCreate({
    where: data,
  });
};

exports.delete = async (data) => {
  return await OauthCache.destroy({
    where: data,
  });
};