const fs = require('fs');
const logger = require('../pkg/utils/logger');
// get the app root path
const appRoot = require('app-root-path');
const controller_dir = `${appRoot}/service/controllers`;

const Koa = require('koa');

const router = require('koa-router')();

const bodyParser = require('koa-bodyparser');

// resolve the cross region problem
const cors = require('koa2-cors');

const app = new Koa();

app.use(cors());

// log request URL:
app.use(async (ctx, next) => {
	logger.info(`Process ${ctx.request.method} ${ctx.request.url}...`);
	await next();
});

// parse request body:
app.use(bodyParser());

// add controllers:F
addControllers(controller_dir);
app.use(router.routes());

// export app used in index.js
module.exports = app;

// mapping each different API in folder of controllers
function addMapping(mapping) {
	for (const url in mapping) {
		if (url.startsWith('GET ')) {
			const path = url.substring(4);
			router.get(path, mapping[url]);
			logger.info(`register URL mapping: GET ${path}`);
		}
		else if (url.startsWith('POST ')) {
			const path = url.substring(5);
			router.post(path, mapping[url]);
			logger.info(`register URL mapping: POST ${path}`);
		}
		else if (url.startsWith('PUT ')) {
			const path = url.substring(4);
			router.put(path, mapping[url]);
			logger.info(`register URL mapping: PUT ${path}`);
		}
		else if (url.startsWith('DELETE ')) {
			const path = url.substring(7);
			router.del(path, mapping[url]);
			logger.info(`register URL mapping: DELETE ${path}`);
		}
		else {
			logger.info(`invalid URL: ${url}`);
		}
	}
}
// read file to registe new api by using mapping function.
function addControllers(dir) {
	fs.readdirSync(`${dir}`).filter((f) => {
		return f.endsWith('.js');
	}).forEach((f) => {
		logger.info(`process controller: ${f}...`);
		const mapping = require(`${dir}/${f}`);
		addMapping(mapping);
	});
}