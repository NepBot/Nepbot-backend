const { DataTypes } = require('sequelize');
const mysql = require('../db_driver/mysql_driver');

const UserFields = mysql.define('user_fields', {
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

exports.addUserField = async (data) => {
  const user = await this.getUserField({
    near_wallet_id: data.near_wallet_id,
    key: data.key,
    value: data.value,
  });
  if (user) {
    return await this.updateUserField(data);
  }
  else {
    const user = await UserFields.create(data);
    return user.toJSON();
  }
};

exports.getUserField = async (data) => {
  const user = await UserFields.findOne({
    where:data,
  });
  return user;
};

exports.getUserFields = async (data) => {
  const users = await UserFields.findAll({
    where:data,
  });
  return users;
};

exports.updateUserField = async (data) => {
  if (!data.near_wallet_id) return { msg:'Missing parameters near_wallet_id', code:0 };
  const params = {
    near_wallet_id:data?.near_wallet_id,
    key:data?.key,
    value: data?.value,
  };
  return await UserFields.update(params, {
    where: {
      near_wallet_id:data?.near_wallet_id,
      key:data?.key,
      value: data?.value,
    },
  });
};

exports.deleteUserField = async (data) => {
  return await UserFields.destroy({
    where: {
      near_wallet_id:data?.near_wallet_id,
      key:data?.key,
      value: data?.value,
    },
  });
};