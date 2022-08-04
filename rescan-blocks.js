// Create a new client instance
const task = require("./service/schedule_task.js")
const client = require("./service/discord_bot.js")
client.on("ready", () => {
    task.scheduleTask(96699258)
})


