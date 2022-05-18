/*
reference:
https://blog.csdn.net/EmptyPointer/article/details/108509428
https://www.jianshu.com/p/9604d08db899

log level sorting: all < trace < debug < info < warn < error < fatal < mark < off

logger.trace('this is trace');
logger.debug('this is debug');
logger.info('this is info');
logger.warn('this is warn');
logger.error('this is error');
logger.fatal('this is fatal');
*/

// get the app root path
const appRoot = require('app-root-path');
// load config
const config = require('./config');

const log4js = require('log4js');
log4js.configure({
	appenders: {
		out: { type: 'console' },
		app: {
			type: 'dateFile',
			filename: `${ appRoot }/logs/log`,
			pattern: 'yyyy-MM-dd.log',
			alwaysIncludePattern: true,
			encoding: 'utf-8',
			numBackups:10,
		},
	},
	categories: {
		default: { appenders: ['out', 'app'], level: config.runtime_env },
		file: { appenders: ['app'], level: config.runtime_env },
		console: { appenders: ['out'], level: config.runtime_env },
	},
	replaceConsole: true,
});

const logger = log4js.getLogger(config.logger_mode);

module.exports = logger;