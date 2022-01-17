const UserInfo = require('../models/userInfo');
const {where} = require("sequelize");

exports.addUser = async (data)=>{
    const user = await this.queryUser({
        guild_id:data.guild_id,
        user_id:data.user_id
    });
    console.log("queryUser>>>>>",user)
    if (user.msg){
        return await this.updateUser(data);
    }else{
        const ins = await UserInfo.create(data);
        return ins.toJSON();
    }
}

exports.queryUser = async (data) =>{
    let result = await UserInfo.findAll({
        where:data
    });
    if(result){
        result = JSON.parse(JSON.stringify(result));
        console.log("result>>>",result)
        if(result.length>0){
            return {msg:true,code:1}
        }
    }

    return {msg:false,code:0}
};
exports.getAllUser = async (data) =>{
    return await UserInfo.findAll({
        where:data
    });
};
exports.updateUser = async (data)=> {
    console.log("data>>>>>>>>",data)
    if(!data.user_id) return {msg:'Missing parameters user_id',code:0}
    const params = {
        near_wallet_id: data?.account_id,
        user_id:data?.user_id,
        guild_id:data?.guild_id
    };
    return  await UserInfo.update(params, {
        where: {
            user_id:data?.user_id,
            guild_id:data?.guild_id
        },
    });
};
