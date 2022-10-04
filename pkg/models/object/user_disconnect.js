const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const UserDisconnect = mysql.define('user_disconnect', {
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
  return await UserDisconnect.findOrCreate({
    where: data,
  });
};

exports.get = async (data) => {
  return await UserDisconnect.findOne({
    where: data,
  });
};

exports.list = async () => {
  return await UserDisconnect.findAll();
};

exports.delete = async (data) => {
  return await UserDisconnect.destroy({
    where: data,
  });
};