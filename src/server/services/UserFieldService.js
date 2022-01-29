const UserField = require('../models/userField');

exports.addUserField = async (data)=>{
    const user = await this.queryUserField({
        near_wallet_id: data.near_wallet_id,
        key: data.key,
        value: data.value,
    });
    if (user.msg){
        return await this.updateUserField(data);
    }else{
        const user = await UserField.create(data);
        return user.toJSON();
    }
}

exports.queryUserField = async (data) =>{
    let result = await UserField.findAll({
        where:data
    });
    if(result){
        result = JSON.parse(JSON.stringify(result));
        if(result.length>0){
            return {msg:true,code:1}
        }
    }

    return {msg:false,code:0}
};
exports.getUserField = async (data) =>{
    const users = await UserField.findOne({
        where:data
    });
    return JSON.parse(JSON.stringify(users));
};
exports.getUserFieldList = async (data) =>{
    const users = await UserField.findAll({
        where:data
    });
    return JSON.parse(JSON.stringify(users));
};
exports.updateUserField = async (data)=> {
    if(!data.near_wallet_id) return {msg:'Missing parameters near_wallet_id',code:0}
    const params = {
        amount: data?.amount,
    };
    return  await UserField.update(params, {
        where: {
            near_wallet_id:data?.near_wallet_id,
            key:data?.key,
            value: data?.value
        },
    });
};

exports.deleteUserField = async (data)=> {
    return  await UserField.destroy({
        where: {
            near_wallet_id:data?.near_wallet_id,
            key:data?.key,
            value: data?.value
        },
    });
};
