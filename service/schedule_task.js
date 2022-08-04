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
const astrodaoTask = require('./schedule_tasks/astrodao_task');
const { provider } = require('../pkg/utils/near_utils');


const txMap = [];
const signerPerBlock = [];

const resolveChunk = async (chunkHash) => {
  try {
    const chunkData = await provider.chunk(chunkHash);
    const promises = [];

    promises.push(resolveTxs(chunkData.transactions));

    promises.push(updeteGuildTask(chunkData.receipts, txMap));
    promises.push(tokenTask(chunkData.receipts, txMap));
    promises.push(balanceTask(chunkData.receipts, txMap));
    promises.push(octTask(chunkData.receipts, txMap));
    promises.push(ntfTask(chunkData.receipts, txMap));
    promises.push(parasTask(chunkData.receipts, txMap));
    promises.push(astrodaoTask(chunkData.receipts, txMap));
    await Promise.all(promises);
  }
  catch (e) {
  }

};

async function resolveTxs(transactions) {
  if (signerPerBlock.length >= 20) {
    signerPerBlock.splice(0, txPerBlock.length - 20);
  }
  for (const signerId in txMap) {
    const index = signerPerBlock.findIndex(ids => {
      return ids.findIndex(id => id == signerId) > -1;
    });
    if (index == -1) {
      delete txMap[signerId];
    }
  }
  const blockSigners = [];
  for (const tx of transactions) {
    const signerId = tx.signer_id;
    blockSigners.push(signerId);
    if (!txMap[signerId]) {
      txMap[signerId] = [];
    }
    txMap[signerId].push(tx);

  }
  signerPerBlock.push(blockSigners);
}


let blockHeight = 0;
let finalBlockHeight = 0;

const resolveNewBlock = async (showLog = false) => {
  if (showLog) {
    console.log(`fetched block height: ${blockHeight}`);
  }
  const newestBlock = await provider.block({ finality: 'optimistic' });
  finalBlockHeight = newestBlock.header.height;
  if (blockHeight == 0) {
    blockHeight = finalBlockHeight - 1;
  }
  const promises = [];
  for (;blockHeight <= finalBlockHeight; blockHeight++) {
    if (showLog) {
      console.log(`fetched block height: ${blockHeight}`);
    }
    let block = {};
    try {
      block = await provider.block({ blockId: blockHeight });
    }
    catch (e) {
      console.log(e);
      continue;
    }

    for (const chunk of block.chunks) {
      promises.push(resolveChunk(chunk.chunk_hash));
    }
  }
  await Promise.all(promises);
};
module.exports.scheduleTask = function(fromBlockHeight = 0) {
  if (fromBlockHeight > 0) {
    blockHeight = fromBlockHeight;
    resolveNewBlock(true);
  }
  else {
    schedule.scheduleJob('*/1 * * * * *', function() {
      resolveNewBlock();
    });
  }
};