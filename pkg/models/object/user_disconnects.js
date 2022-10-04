const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const UserDisconnects = mysql.define('user_disconnects', {
  guild_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expired_at: {
    type:DataTypes.DATE,
    allowNull: false,
  },
});

exports.add = async (data) => {
  return await UserDisconnects.findOrCreate({
    where: data,
  });
};

exports.get = async (data) => {
  return await UserDisconnects.findOne({
    where: data,
  });
};

exports.list = async () => {
  return await UserDisconnects.findAll();
};

exports.delete = async (data) => {
  return await UserDisconnects.destroy({
    where: data,
  });
};