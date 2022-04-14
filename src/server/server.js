const express = require('express');
const userService = require('./services/userService');
const app = express();
const config = require('../utils/config').getConfig();
const secret = require('../utils/secret').getSecret();
const cookieParser = require('cookie-parser');
//const {client} = require("../Bot");
const {GuildMember, Role} = require("discord.js");
const {getRoles, getMembers, getGuild} = require("./api/guild");
const {getRules, contract, getOctAppchainRole, getBalanceOf, getNearBalanceOf, getNftCountOf} = require("./api/contract");
const {addUserField} = require("./services/UserFieldService")
const { getTokenPerOwnerCount } = require('./api/paras');
const commands  = require('../bot/events/commands')
const {connect} = require('near-api-js');
const {nearWallet, port} = config;
const tweetnacl = require("tweetnacl");
const bs58 = require('bs58');
const BN = require('bn.js')
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
            oct: [],
            balance: [],
            nft: [],
            paras: []
        }
        for (rule of rules) {
            if (rule.key_field[0] == 'token_id') {
                rulesMap.token.push(rule)
            } else if (rule.key_field[0] == 'appchain_id') {
                rulesMap.oct.push(rule)
            } else if (rule.key_field[0] == 'near') {
                rulesMap.balance.push(rule)
            } else if (rule.key_field[0] == 'nft_contract_id') {
                rulesMap.nft.push(rule)
            } else if (rule.key_field[0] == 'x.paras.near') {
                rulesMap.paras.push(rule)
            }
            await addUserField({
                near_wallet_id: params.account_id,
                key: rule.key_field[0],
                value: rule.key_field[1]
            });
        }

        let role = [];
        let delRole = [];
        for (const rule of rulesMap.token) {
            const tokenAmount = await getBalanceOf(rule.key_field[1], params.account_id)
            
            if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1 ) {
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && role.push(_role)
            }
            if(member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1){
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && delRole.push(_role)
            }
        }

        for (const rule of rulesMap.oct) {
            let octRole = await getOctAppchainRole(rule.key_field[1], params.account_id)

            if (!member._roles.includes(rule.role_id) && octRole == rule.fields.oct_role) {
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && role.push(_role)
            }
            if(member._roles.includes(rule.role_id) && !octRole == rule.fields.oct_role){
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && delRole.push(_role)
            }
        }

        for (const rule of rulesMap.balance) {
            
            const balance = await getNearBalanceOf(params.account_id)
            
            if (!member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) != -1 ) {
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && role.push(_role)
            }
            if(member._roles.includes(rule.role_id) && new BN(balance).cmp(new BN(rule.fields.balance)) == -1){
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && delRole.push(_role)
            }
        }

        for (const rule of rulesMap.nft) {
            let tokenAmount = await getNftCountOf(rule.key_field[1], params.account_id)
            if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1 ) {
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && role.push(_role)
            }
            if(member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1){
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && delRole.push(_role)
            }
        }

        for (const rule of rulesMap.paras) {
            const tokenAmount = await getTokenPerOwnerCount(rule.key_field[1], params.account_id)

            if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) != -1 ) {
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && role.push(_role)
            }
            if(member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.token_amount)) == -1){
                const _role = getRoles(rule.guild_id, rule.role_id);
                _role && delRole.push(_role)
            }
        }


        if(role.length){
            member.roles.add(role).then(console.log).catch(console.error)
        }
        if(delRole.length){
            member.roles.remove(delRole).then(console.log).catch(console.error)
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
    const roles = getRoles(req.params.guildId)
    res.json(roles);
})

app.get('/api/getServer/:guildId', (req, res) => {
    const serverList = getGuild(req.params.guildId);
    res.json(serverList);
})

app.get('/api/getUser/:guildId/:userId', async (req, res) => {
    const member = await getMembers(req.params.guildId, req.params.userId)
    res.json(member)
})

app.post('/api/sign', async (req, res) => {
    const payload = Object.assign(req.body);
    const params = Object.assign(req.body.args);
    if (!verifyAccountOwner(payload.account_id, params, payload.sign)) {
        return
    }
    for (args of params) {
        const users = await userService.getAllUser({
            near_wallet_id: payload.account_id,
            guild_id: args.guild_id
        });
        if (users.length == 0){
            res.json('no user found')
            return
        }
        const { ownerId } = getGuild(args.guild_id);
        if (ownerId != users[0].user_id) {
            res.json('no authorization')
            return
        }
    }

    const {getSign} = require('../auth/sign_api');
    let sign = await getSign(params)
    
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
