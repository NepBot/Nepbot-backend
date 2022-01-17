const mySqlDB = require('./mysqlDB');
const { DataTypes } = require('sequelize');

module.exports = mySqlDB.define('user_token',{
    user_id:{
        type:DataTypes.STRING,
        allowNull: false,
    },
    token_id:{
        type:DataTypes.STRING,
        allowNull: false,
    },
    amount:{
        type:DataTypes.STRING,
        allowNull: false,
    }
})
