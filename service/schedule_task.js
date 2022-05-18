const logger = require('../pkg/utils/logger');
const config = require('../pkg/utils/config');
const schedule = require('node-schedule');
// Task
const balanceTask = require('./schedule_tasks/balance_task');
const ntfTask = require('./schedule_tasks/ntf_task');
const octTask = require('./schedule_tasks/oct_task');
const parasTask = require('./schedule_tasks/paras_task');
const tokenTask = require('./schedule_tasks/token_task');
const updeteGuildTask = require('./schedule_tasks/updete_guild_task');
const { providers } = require('near-api-js');

const provider = new providers.JsonRpcProvider(config.nearWallet.nodeUrl);

const resolveChunk = async (chunkHash) => {
	try {
		const chunkData = await provider.chunk(chunkHash);
		const promises = [];
		promises.push(updeteGuildTask(chunkData.receipts));
		promises.push(tokenTask(chunkData.receipts));
		promises.push(balanceTask(chunkData.receipts));
		promises.push(octTask(chunkData.receipts));
		promises.push(ntfTask(chunkData.receipts));
		promises.push(parasTask(chunkData.receipts));
		await Promise.all(promises);
	} catch (e) {
		console.log(e)
	}
	
};

let blockHeight = 0;
let finalBlockHeight = 0;

const resolveNewBlock = async () => {
	logger.debug(`fetched block height: ${blockHeight}`);
	const newestBlock = await provider.block({ finality: 'optimistic' });
	finalBlockHeight = newestBlock.header.height;
	if (blockHeight == 0) {
		blockHeight = finalBlockHeight - 1;
	}
	const promises = [];
	for (;blockHeight <= finalBlockHeight; blockHeight++) {
		let block = {};
		try {
			block = await provider.block({ blockId: blockHeight });
		}
		catch (e) {
			continue;
		}

		for (const chunk of block.chunks) {
			promises.push(resolveChunk(chunk.chunk_hash));
		}
	}
	await Promise.all(promises);
};
module.exports.scheduleTask = function() {
	schedule.scheduleJob('*/1 * * * * *', function() {
		resolveNewBlock();
	});
};