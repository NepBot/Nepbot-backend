const UserInfo = require('../models/userInfo');
const {where} = require("sequelize");

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

exports.getAllUser = async (data) =>{
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
