const UserToken = require('../models/userToken');

exports.addUserToken = async (data)=>{
    const user = await this.queryUserToken({
        near_wallet_id:data.near_wallet_id,
        token_id:data.token_id,
    });
    console.log("queryUser>>>>>",user)
    if (user.msg){
        return await this.updateUserToken(data);
    }else{
        const user = await UserToken.create(data);
        return user.toJSON();
    }
}

exports.queryUserToken = async (data) =>{
    let result = await UserToken.findAll({
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
exports.getUserToken = async (data) =>{
    const users = await UserToken.findOne({
        where:data
    });
    return JSON.parse(JSON.stringify(users));
};
exports.getUserTokenList = async (data) =>{
    const users = await UserToken.findAll({
        where:data
    });
    return JSON.parse(JSON.stringify(users));
};
exports.updateUserToken = async (data)=> {
    console.log("data>>>>>>>>",data)
    if(!data.near_wallet_id) return {msg:'Missing parameters near_wallet_id',code:0}
    const params = {
        amount: data?.amount,
    };
    return  await UserToken.update(params, {
        where: {
            near_wallet_id:data?.near_wallet_id,
            token_id:data?.token_id
        },
    });
};

exports.deleteUserToken = async (data)=> {
    const user = await this.getUserToken(data);
    if(user.amount === 0){
        return  await UserToken.destroy({
            where: {
                near_wallet_id:data?.near_wallet_id,
                token_id:data?.token_id
            },
        });
    }else{
        return JSON.parse(JSON.stringify(user));
    }

};
