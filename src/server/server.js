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
const {getRules, getTokenList, contract} = require("./api/contract");
const {addRule, deleteRule, updateRule, queryRule} = require("./services/RuleService");
const commands  = require('../commands/commands')
const {CLIENT_ID} = config;
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
app.post('/api/set-info', async (req, res) => {
    // console.log(req.body)
    const params = Object.assign(req.body);
    //console.log(params)
    //console.log(encodeURIComponent(params.account_id))
    try{
        const rules = await getRules(params.guild_id);
        let roleList = Array.from(new Set(rules.map(({role_id}) => role_id)));
        let doc = await userService.getAllUser({
            guild_id:params.guild_id,
            near_wallet_id:params.account_id
        })
        for (user in doc) {
            if (user.user_id != params.user_id) {
                let member = await getMembers(params.guild_id, user.user_id)
                member.roles.remove(roleList).then(console.log).catch(console.error)
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
        let resData = [];

        
        let tokenList = Array.from(new Set(rules.map(({token_id}) => token_id)));
        for (const tokenId of tokenList) {
            //，，
            const tokenAmount = await account.viewFunction(tokenId, "ft_balance_of", {account_id: params.account_id})
            const userToken = await addUserToken({
                near_wallet_id: params.account_id,
                token_id: tokenId,
                amount: tokenAmount, //   near.wallet  
            });
            const _rules = rules.filter(item => {
                if (item.token_id === tokenId) {
                    return item;
                }
            })
            console.log("userTokenList>>>", userToken)
            if (userToken) {
                console.log("rules>>>", _rules);
                let role = []
                for (const {amount, role_id} of _rules) {
                    if ((!member._roles.includes(role_id)) && +userToken.amount >= +amount) {
                        const _role = getRoles(params.guild_id, role_id);
                       _role &&  role.push(_role);
                    }
                }
                member.roles.add(role).then((resp) => {
                    resData.push({
                        msg: "success",
                        success: true,
                    })
                    console.group()
                    console.log(JSON.stringify(member))
                    console.log(JSON.stringify(role))
                    console.groupEnd()
                }).catch((err) => {
                    resData.push('1');
                    console.group()
                    console.log(JSON.stringify(member))
                    console.log(JSON.stringify(role))
                    console.groupEnd()
                    console.error(err)
                })
            }
        }


        if (resData.includes('1')) {
            res.json({
                msg: 'operation failed',
                success: false,
            })
        } else {
            res.json({
                msg: resData,
                success: true,
            })
        }
    }catch (e) {
        console.error(e)
    }

})
/**  */
app.get('/api/getMemberList/:guildId', async (req, res) => {
    const rs = await rest.get(`${Routes.guildMembers(req.params.guildId)}?limit=5&after=1`, {
        auth: true,
    })
    res.json(rs)
})

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
    console.log('')
    const data = req.body[0];
    const {getSign} = require('../auth/sign_api');
    const sign = await getSign(req.body);

    res.json(sign)

})


app.post('/api/role/add', async (req, res) => {
    const data = req.body;
    const rule = await addRule(data);

    res.json(rule);
})
app.get('/api/role/list/:guildId', async (req, res) => {
    const data = req.query;
    //console.log(data)
    const rule = await queryRule({guild_id: req.params.guildId, ...data});

    res.json(rule)
})
app.put('/api/role/edit', async (req, res) => {
    const data = req.body;
    const rule = await updateRule(data);

    res.json(rule)
})
app.delete('/api/role/del', async (req, res) => {
    const data = req.body;
    //console.log(data)
    const rule = await deleteRule(data.id);

    res.json(rule)
})
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
const {addUserToken, getUserToken} = require("./services/UserTokenService");
const path = require("path");
const axios = require("axios");
/** init app */
app.listen(port, () => {
    console.log(`Example app listening at http://127.0.0.1:${port}/api`)
})
