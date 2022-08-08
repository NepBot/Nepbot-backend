
exports.execute = async function(args) {
    // Create a new client instance
    const task = require("../service/schedule_task.js")
    const client = require("../service/discord_bot.js")
    client.on("ready", () => {
        try {
            task.scheduleTask(args.height)
        } catch (e) {
            console.log(e)
        }
        
    })
}

exports.params = {
    args: [{
        alias: 's',
        name: 'height',
        type: 'number',
        describe: 'block height'
    }],
    description: 'rescan blocks',
}

