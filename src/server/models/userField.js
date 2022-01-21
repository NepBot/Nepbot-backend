const mySqlDB = require('./mysqlDB');
const { DataTypes } = require('sequelize');

module.exports = mySqlDB.define('user_field',{
    near_wallet_id:{
        type:DataTypes.STRING,
        allowNull:false
    },
    key:{
        type:DataTypes.STRING,
        allowNull: false,
    },
    value:{
        type:DataTypes.STRING,
        allowNull: false,
    }
})
