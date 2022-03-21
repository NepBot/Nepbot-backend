require('./src/server/server');
require('./src/server/services/blockService')
const {timedTask} = require('./src/timedTask/index')
const {client} =  require('./src/Bot');
//const {config} = require("./src/utils/config");
const {secret} = require("./src/utils/secret")
const {TOKEN} = secret;

async function sleep(ms) {
    return new Promise(resolve=>setTimeout(resolve, ms))
}

client.login(TOKEN).then(async () => {
    console.log('Success login ');
    while (true) {
        try {
            await timedTask()
            await sleep(1000)
        } catch (e) {
            continue
        }
        
    }
    
});
