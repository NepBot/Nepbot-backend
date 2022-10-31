const logger = require('../../pkg/utils/logger');
const { Collection } = require('discord.js');
const commands_dir = `${ appRoot }/service/commands`;
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
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
  },
};