// Create a new client instance
const task = require("./service/schedule_task.js")
const config = require("./pkg/utils/config.js")

const { Client, Intents } = require('discord.js');
const intents = [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS];
const client = new Client({ intents: intents });

client.login(config.bot_token)

task.scheduleTask(96679790)