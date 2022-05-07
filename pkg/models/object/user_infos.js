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

exports.addUser = async (data)=>{
	const user = await this.getUser({
		guild_id:data.guild_id,
		user_id:data.user_id
	});
	if (user){
		return await this.updateUser(data);
	}else{
		const userInfo = await UserInfo.create(data);
		return userInfo.toJSON();
	}
}

exports.getUser = async (data) =>{
	const user = await UserInfo.findOne({
		where:data
	});
	return user;
};

exports.getUsers = async (data) =>{
	return await UserInfo.findAll({
		where:data
	});
};
exports.updateUser = async (data)=> {
	if(!data.user_id) return {msg:'Missing parameters user_id',code:0}
	const params = {
		near_wallet_id: data?.near_wallet_id,
		user_id:data?.user_id,
		guild_id:data?.guild_id,
		nonce: data?.nonce
	};
	return  await UserInfo.update(params, {
		where: {
			user_id:data?.user_id,
			guild_id:data?.guild_id
		},
	});
};