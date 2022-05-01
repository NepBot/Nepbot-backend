/*
https://www.sequelize.com.cn/
*/
const logger = require('../../utils/logger');
const config = require('../../utils/config');
const { Sequelize } = require('sequelize');

const mysql = new Sequelize(`${config.mysql_url}`, {
	logging: msg => logger.debug(msg),
});

try {
	(async () => {
		await mysql.authenticate();
		logger.info('Connection with mysql has been established successfully.');
	})();
}
catch (error) {
	logger.error('Unable to connect to mysql:', error);
}

module.exports = mysql;