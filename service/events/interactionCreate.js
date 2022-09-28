// get the app root path
const appRoot = require('app-root-path');
const commands = `${ appRoot }/service/commands`;
const actions = `${ appRoot }/service/discord_actions/interactionCreate`;
const logger = require('../../pkg/utils/logger');

const execute = async interaction => {
  if (interaction.isButton()) {
    const buttonInfo = interaction.customId.split('.');
    /**
		 * The buttonInfo on above which reference to the customId in discord_actions dir when setting button start with command, it will run the command in the commands dir.
		 * It is important that don't forget to verify the customId in discord_actions same with the file in commands dir.
		 * Like command.verify, it means this action is a command and already write in the commands dir named verify.js
		 */
    if (buttonInfo[0] === 'command') {
      const commandFile = require(`${ commands }/${ buttonInfo[1] }.js`);
      commandFile.execute(interaction);
    }
    /**
		* If there is a action that is not a command, then you can add this action in the discord_actions/interactionCreate.
		* Please don't forget to set the customId start with "action" and use a "." to sepreate the action when set a button.
		* Like action.name, it means this action is not a command and it can't find in the command file, so you should creat this action in discord_actions/interactionCreate.
		*/
    else if (buttonInfo[0] === 'action') {
      const actionFile = require(`${ actions }/${ buttonInfo[1] }.js`);
      actionFile.execute(interaction);
    }
    logger.info(`${interaction.user.tag} in #${interaction.channel.name} triggered an button interaction with ${buttonInfo[0]}.${ buttonInfo[1] }`);
    return;
  }
  else if (interaction.isSelectMenu()) {
    /**
     * same concept with button
     */
    const selectMenuInfo = interaction.customId.split('.');
    if (selectMenuInfo[0] === 'action') {
      const actionFile = require(`${ actions }/${ selectMenuInfo[1] }.js`);
      actionFile.execute(interaction);
    }
    logger.info(`${interaction.user.tag} in #${interaction.channel.name} triggered an select menu interaction with ${selectMenuInfo[0]}.${ selectMenuInfo[1] }`);
    return;
  }
  logger.info(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
};

module.exports = {
  name: 'interactionCreate',
  execute,
};