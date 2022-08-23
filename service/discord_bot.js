// get the app root path
const appRoot = require('app-root-path');
const config = require('../pkg/utils/config');
const commands_dir = `${ appRoot }/service/commands`;
const events_dir = `${ appRoot }/service/events`;
// require logger
const logger = require('../pkg/utils/logger');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const fs = require('node:fs');
// Require the necessary discord.js classes
const { Client, Intents, Collection } = require('discord.js');
const intents = [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS];
// Create a new client instance
const client = new Client({ intents: intents });

// commands
client.commands = new Collection();
const commandFiles = fs.readdirSync(commands_dir).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const command = require(`${commands_dir}/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(config.bot_token);

rest.put(Routes.applicationCommands(config.bot_appid), { body: commands })
  .then(() => logger.debug('Successfully registered application commands.'))
  .catch(logger.error);

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  }
  catch (error) {
    logger.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

// events
const eventFiles = fs.readdirSync(events_dir).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`${events_dir}/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  }
  else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}
client.login(config.bot_token);
// Login to Discord with your client's token
module.exports = client;