const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const user_infos = mysql.define('user_infos', {
	user_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	guild_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	near_wallet_id: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	nonce: {
		type: DataTypes.BIGINT,
		allowNull: false,
	},
});

module.exports = user_infos;