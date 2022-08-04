const client = require("./service/discord_bot.js")
const task = require("./service/schedule_task.js")
const config = require("./pkg/utils/config.js")
client.login(config.bot_token)

task.scheduleTask(96679790)