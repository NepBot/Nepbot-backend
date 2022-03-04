require('./src/server/server');
require('./src/server/services/postgreService')
const {timedTask} = require('./src/timedTask/index')
const {client} =  require('./src/Bot');
//const {config} = require("./src/utils/config");
const {secret} = require("./src/utils/secret")
const {TOKEN} = secret;
client.login(TOKEN).then(async () => {
    console.log('Success login ');
    await timedTask()
    setInterval(async ()=>{
        console.log('start')
        await timedTask()
    },1000)
});
