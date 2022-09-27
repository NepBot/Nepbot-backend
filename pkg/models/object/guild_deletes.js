const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const GuildDeletes = mysql.define('guild_deletes', {
  guild_id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  expired_at: {
    type:DataTypes.DATE,
    allowNull: false,
  },
});

exports.add = async (data) => {
  return await GuildDeletes.findOrCreate({
    where: data,
  });
};

exports.get = async (data) => {
  return await GuildDeletes.findOne({
    where: data,
  });
};

exports.list = async () => {
  return await GuildDeletes.findAll();
};

exports.delete = async (data) => {
  return await GuildDeletes.destroy({
    where: data,
  });
};