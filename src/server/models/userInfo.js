const mysqlPool = require('./mysqlDB');

const { DataTypes } = require('sequelize');

const userInfo = mysqlPool.define('user_infos',{
    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    guild_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    near_wallet_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    create_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
})

module.exports = userInfo;
