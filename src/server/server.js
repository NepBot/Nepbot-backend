const express = require('express');
const {Routes} = require("discord-api-types/v9");
const userService = require('./services/userService');
const app = express();
const port = 5000;
const {config} = require('../utils/config');
const {secret} = require('../utils/secret');
const {rest} = require('../commands/index')
const cookieParser = require('cookie-parser');
const {client} = require("../Bot");
const {GuildMember, Role} = require("discord.js");
const {getRoles, getMembers, getMembersTokenList} = require("./api/guild");
const {getRules, getTokenList, contract, getOctAppchainRole} = require("./api/contract");
const {addRule, deleteRule, updateRule, queryRule} = require("./services/RuleService");
const {addUserField} = require("./services/UserFieldService")
const commands  = require('../commands/commands')
const {connect} = require('near-api-js');
const {nearWallet} = config;
const tweetnacl = require("tweetnacl");
const bs58 = require('bs58');
const {setTokenAmountRoles, setOctRoles} = require('../utils/setRoles')
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}))
const allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');//，。
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');//
    res.setHeader('Content-type', 'application/json; charset=utf-8'); //
    next()
}
// noinspection JSCheckFunctionSignatures
app.use(allowCrossDomain);
/**  */


function verifySignature(data, signature, public_key) {
    let bf_data = new Uint8Array(Buffer.from(JSON.stringify(data)))
    let bf_sign = new Uint8Array(bs58.decode(signature))
    let bf_pk = new Uint8Array(bs58.decode(public_key))
    let valid = tweetnacl.sign.detached.verify(bf_data, bf_sign, bf_pk);
    return valid;
}

async function verifyAccountOwner(account_id, data, signature) {
    const near = await connect(nearWallet)
    const account = await near.account(account_id)
    const accessKeys = await account.getAccessKeys()
    return accessKeys.some(it => {
        const publicKey = it.public_key.replace('ed25519:', '');
        return verifySignature(data, signature, publicKey)
    });
};



app.post('/api/set-info', async (req, res) => {
    
    const payload = Object.assign(req.body);
    const params = Object.assign(req.body.args);
    
    
    try{
        if (!verifyAccountOwner(payload.account_id, params, payload.sign)) {
            return
        }

        const rules = await getRules(params.guild_id);
        console.log("-----------------", rules)
        let roleList = Array.from(new Set(rules.map(({role_id}) => role_id)));
        let doc = await userService.getAllUser({
            guild_id:params.guild_id,
            near_wallet_id:params.account_id
        })
        for (user of doc) {
            if (user.user_id != params.user_id) {
                let member = await getMembers(params.guild_id, user.user_id)
                if (member.roles) {
                    member.roles.remove(roleList).then(console.log).catch(console.error)
                }
            }
        }
        await userService.addUser({
            user_id: params.user_id,
            guild_id: params.guild_id,
            near_wallet_id: params.account_id,
            oauth_time: new Date()
        });
        const account = await contract();
        const member = await getMembers(params.guild_id, params.user_id);

        let rulesMap = {
            token: [],
            oct: []
        }
        for (rule of rules) {
            if (rule.key_field[0] == 'token_id') {
                rulesMap.token.push(rule)
            } else if (rule.key_field[0] == 'appchain_id') {
                rulesMap.oct.push(rule)
            }
            await addUserField({
                near_wallet_id: params.account_id,
                key: rule.key_field[0],
                value: rule.key_field[1]
            });
        }


        for (const rule of rulesMap.token) {
            const tokenAmount = await account.viewFunction(rule.key_field[1], "ft_balance_of", {account_id: params.account_id})
            setTokenAmountRoles(member, rule, tokenAmount)
        }

        for (const rule of rulesMap.oct) {
            let octRole = await getOctAppchainRole(rule.key_field[1], params.account_id)
            setOctRoles(member, rule, octRole)
        }


        res.json({
            success: true,
        })
    }catch (e) {
        console.error(e)
    }

})
// /**  */
// app.get('/api/getMemberList/:guildId', async (req, res) => {
//     const rs = await rest.get(`${Routes.guildMembers(req.params.guildId)}?limit=5&after=1`, {
//         auth: true,
//     })
//     res.json(rs)
// })

app.get('/api/getRole/:guildId', async (req, res) => {
    //console.log(client.guilds.cache.get(req.params.guildId).roles.cache)
    const roles = client.guilds.cache.get(req.params.guildId).roles.cache;
    res.json(roles);
})

app.get('/api/getServer/:guildId', (req, res) => {
    const serverList = client.guilds.cache.get(req.params.guildId);
    res.json(serverList);
})

app.post('/api/sign/:guildId', async (req, res) => {
    const payload = Object.assign(req.body);
    const params = Object.assign(req.body.args);
    if (!verifyAccountOwner(payload.account_id, params, payload.sign)) {
        return
    }
    const {getSign} = require('../auth/sign_api');
    let sign = ''
    if (params.hasOwnProperty('signType')) {
        sign = await getSign(params.role_ids);
    }
    else {
        sign = await getSign(params)
    }

    res.json(sign)

})


// app.post('/api/role/add', async (req, res) => {
//     const data = req.body;
//     const rule = await addRule(data);

//     res.json(rule);
// })
// app.get('/api/role/list/:guildId', async (req, res) => {
//     const data = req.query;
//     //console.log(data)
//     const rule = await queryRule({guild_id: req.params.guildId, ...data});

//     res.json(rule)
// })
// app.put('/api/role/edit', async (req, res) => {
//     const data = req.body;
//     const rule = await updateRule(data);

//     res.json(rule)
// })
// app.delete('/api/role/del', async (req, res) => {
//     const data = req.body;
//     //console.log(data)
//     const rule = await deleteRule(data.id);

//     res.json(rule)
// })
app.get('/oauth',async (req,res,next)=>{
    // const command = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, req.query.guild_id), {body: commands});
    // res.json(res)
    res.setHeader('Content-type','text/html');
    const options = {
        root: path.join('public'),
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    }
    const service = axios.create({
        baseURL:`https://discord.com/api/v9/applications/${config.APPLICATION_ID}/guilds`
    })
    service.interceptors.response.use((response)=>{
        return response.data;
    },err=>{
        return err
    })
    service.put(`/${req.query.guild_id}/commands`,{
        data:commands,
        headers:{
            'authorize':`Bot ${secret.TOKEN}`
        }
    }).then(resp=>{
        //console.log(resp)
        res.sendFile('/index.html',options)
    }).catch((err)=>{
        //console.log(err)
        res.sendFile('/fail.html',options)
    })
})

/** sync models */
require('./models/sync')
const path = require("path");
const axios = require("axios");
/** init app */
app.listen(port, () => {
    console.log(`Example app listening at http://127.0.0.1:${port}/api`)
})
