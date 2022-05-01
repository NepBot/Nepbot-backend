/*
reference:
https://blog.csdn.net/EmptyPointer/article/details/108509428
https://www.jianshu.com/p/9604d08db899

log4js日志级别，分别为：<权值从小到大>

all < trace < debug < info < warn < error < fatal < mark < off

logger.trace('this is trace');
logger.debug('this is debug');
logger.info('this is info');
logger.warn('this is warn');
logger.error('this is error');
logger.fatal('this is fatal');
*/

// get the app root path
const appRoot = require('app-root-path');
// load .env file into process
require('dotenv').config({ path: `${appRoot}/.env` });

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
		default: { appenders: ['out', 'app'], level: process.env.RUNTIME_ENV },
	},
	replaceConsole: true,
});

const logger = log4js.getLogger('default');

module.exports = logger;