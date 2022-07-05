// get the app root path
const appRoot = require('app-root-path');
const actions_dir = `${ appRoot }/service/discord_actions/guildCreate`;
// require logger
const logger = require('../../pkg/utils/logger');

const fs = require('node:fs');
// actions
const actionFiles = fs.readdirSync(actions_dir).filter(file => file.endsWith('.js'));

const execute = async guild => {

	for (const file of actionFiles) {
		const action = require(`${actions_dir}/${file}`);
		logger.info(`execute the actions in ${actions_dir}/${file}`);
		await action.execute(guild);
	}
};

module.exports = {
	name: 'guildCreate',
	execute,
};

