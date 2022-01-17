const mySqlDB = require('./mysqlDB');
const { DataTypes } = require('sequelize');

module.exports = mySqlDB.define('user_guild_token',{
    user_id:{
        type:DataTypes.STRING,
        allowNull: false,
        unique: 'user_guild_token',
    },
    guild_id:{
        type:DataTypes.STRING,
        allowNull: false,
        unique: 'user_guild_token',
    },
    token_id:{
        type:DataTypes.STRING,
        allowNull: false,
        unique: 'user_guild_token',
    },
    amount:{
        type:DataTypes.STRING,
        allowNull: false,
    }
},{
        freezeTableName: true
})
