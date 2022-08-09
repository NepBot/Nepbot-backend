exports.execute = async function() {
  const logger = require('../pkg/utils/logger');
  const fs = require('node:fs');
  const { REST } = require('@discordjs/rest');
  const { Routes } = require('discord-api-types/v9');
  const config = require('../pkg/utils/config');

  const commandsDir = `${ appRoot }/service/commands`;
  const commands = [];
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`${commandsDir}/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '9' }).setToken(config.bot_token);

  rest.put(Routes.applicationCommands(config.bot_appid), { body: commands })
    .then(() => logger.info('Successfully registered application commands.'))
    .catch(console.error);
};

exports.params = {
  args: [],
  description: 'update nepbot channels',
};