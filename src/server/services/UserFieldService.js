const UserField = require('../models/userField');

exports.addUserField = async (data)=>{
    const user = await this.getUserField({
        near_wallet_id: data.near_wallet_id,
        key: data.key,
        value: data.value,
    });
    if (user){
        return await this.updateUserField(data);
    }else{
        const user = await UserField.create(data);
        return user.toJSON();
    }
}

exports.getUserField = async (data) =>{
    const user = await UserField.findOne({
        where:data
    });
    return user;
};

exports.getUserFieldList = async (data) =>{
    const users = await UserField.findAll({
        where:data
    });
    return users
};

exports.updateUserField = async (data)=> {
    if(!data.near_wallet_id) return {msg:'Missing parameters near_wallet_id',code:0}
    const params = {
        near_wallet_id:data?.near_wallet_id,
        key:data?.key,
        value: data?.value
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
