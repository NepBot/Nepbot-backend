const logger = require('../pkg/utils/logger');
const config = require('../pkg/utils/config');
const schedule = require('node-schedule');
// Task
const balance_task = require('./schedule_tasks/balance_task');
const ntf_task = require('./schedule_tasks/ntf_task');
const oct_task = require('./schedule_tasks/oct_task');
const paras_task = require('./schedule_tasks/paras_task');
const token_task = require('./schedule_tasks/token_task');
const updete_guild_task = require('./schedule_tasks/updete_guild_task');
const { providers } = require('near-api-js');

const provider = new providers.JsonRpcProvider(config.nearWallet.nodeUrl);

const resolveChunk = async (chunkHash) => {
	try {
		const chunkData = await provider.chunk(chunkHash);
		const promises = [];
		promises.push(updete_guild_task(chunkData.receipts));
		promises.push(token_task(chunkData.receipts));
		promises.push(balance_task(chunkData.receipts));
		promises.push(oct_task(chunkData.receipts));
		promises.push(ntf_task(chunkData.receipts));
		promises.push(paras_task(chunkData.receipts));
		await Promise.all(promises);
	} catch (e) {
		
	}
	
};

let block_height = 0;
let final_block_height = 0;

const resolveNewBlock = async () => {
	logger.debug(`fetched block height: ${block_height}`);
	const newestBlock = await provider.block({ finality: 'optimistic' });
	final_block_height = newestBlock.header.height;
	if (block_height == 0) {
		block_height = final_block_height - 1;
	}
	const promises = [];
	for (;block_height <= final_block_height; block_height++) {
		let block = {};
		try {
			block = await provider.block({ blockId: block_height });
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