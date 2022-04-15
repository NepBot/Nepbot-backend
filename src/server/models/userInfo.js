const mysqlPool = require('./mysqlDB');

const { DataTypes } = require('sequelize');

const userInfo = mysqlPool.define('user_info',{
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
        allowNull: false
    },
    create_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    nonce: {
        type: DataTypes.NUMBER,
        allowNull: false
    }
})

module.exports = userInfo;
