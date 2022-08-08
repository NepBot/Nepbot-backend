// Create a new client instance
const task = require("../service/schedule_task.js")
const client = require("../service/discord_bot.js")
client.on("ready", () => {
    try {
        task.scheduleTask(71303647)
    } catch (e) {
        console.log(e)
    }
    
})


