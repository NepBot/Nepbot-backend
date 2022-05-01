const logger = require('../pkg/utils/logger');

module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		logger.info(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
	},
};