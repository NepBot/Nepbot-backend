const logger = require('./pkg/utils/logger');
const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./pkg/utils/config');

const commands = [];
const commandFiles = fs.readdirSync('./service/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(config.bot_token);

rest.put(Routes.applicationCommands(config.bot_appid), { body: commands })
	.then(() => logger.info('Successfully registered application commands.'))
	.catch(console.error);

module.exports = rest;