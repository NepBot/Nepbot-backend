const RuleInfo = require('../models/Rule');
const {getGuild, getRoles} = require('../api/guild')
/**
 * @desc  sql
 * @param {Object} data {guild_id,role_id,token_id,amount}
 * */
exports.addRule = async (data)=>{
    if(!(data.guild_id && data.role_id && data.token_id && data.amount)) return {msg:`guild_id,role_id,token_id,amount is must pass parameters`,code:0};

    //   id  id 
    const guild = getGuild(data.guild_id)
    if(!guild.id === data.guild_id) return {msg:`guild_id parameter error`,code:0};

    //  id
    const role = getRoles(data.guild_id,data.role_id);
    if(!role.id === data.role_id) return {msg:`guild_id parameter error`,code:0};

    const dbRule = await RuleInfo.findOne({
        where:{token_id:data.token_id,role_id:data.role_id}
    });
    console.log(dbRule)
    // token 
    if(dbRule && dbRule.token_id === data.token_id){
        console.log(this.updateRule)
        console.log(data)
        return await this.updateRule({id: dbRule.id, ...data});
    }
    const rule = await RuleInfo.create(data);
    return rule.toJSON();
}

/**
 * @desc  sql
 * @param {Object} data {guild_id,role_id,token_id,amount}
 * */
exports.queryRule = async (data={})=>{
    return await RuleInfo.findAll({
        where:data
    })
}

/**
 * @desc  sql
 * @param {number} rule_id
 * */
exports.deleteRule = async (rule_id)=>{
    const rule = await this.queryRule({id:rule_id});
    if(rule){
        return await RuleInfo.destroy({
            where: {
                id: rule_id
            }
        });
    }
}

/**
 * @desc  sql
 * @param {Object} data {guild_id,role_id,token_id,amount,id}
 * */
exports.updateRule = async (data)=>{
    if(!data.id) return {msg:'id is must pass param',code:0};

    return await RuleInfo.update(data, {
        where: {
            id: data.id
        }
    })
}

/**
 * @desc token sql
 *
 * */
exports.getTokenList = async (guild_id = '')=>{
    return await RuleInfo.findAll({
        // attributes: ['token_id', 'id', 'guild_id','amount'],
        where: guild_id ? {
            guild_id: guild_id
        }:{}
    })
}
