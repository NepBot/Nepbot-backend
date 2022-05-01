const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const user_fields = mysql.define('user_fields', {
	near_wallet_id:{
		type:DataTypes.STRING,
		allowNull:false,
	},
	key:{
		type:DataTypes.STRING,
		allowNull: false,
	},
	value:{
		type:DataTypes.STRING,
		allowNull: false,
	},
});


module.exports = user_fields;