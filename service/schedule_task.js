const logger = require('../pkg/utils/logger');
const config = require('../pkg/utils/config');
const schedule = require('node-schedule');
const guildDelete = require('../service/events/guildDelete');
const guildDeletes = require('../pkg/models/object/guild_deletes');
const userDisconnects = require('../pkg/models/object/user_disconnects');
const userUtils = require('../pkg/utils/user_utils');
// Task
const balanceTask = require('./schedule_tasks/balance_task');
const ntfTask = require('./schedule_tasks/nft_task');
const octTask = require('./schedule_tasks/oct_task');
const parasTask = require('./schedule_tasks/paras_task');
const tokenTask = require('./schedule_tasks/token_task');
const updateGuildTask = require('./schedule_tasks/update_guild_task');
const astrodaoTask = require('./schedule_tasks/astrodao_task');
const { provider } = require('../pkg/utils/near_utils');
const twitterTask = require('./schedule_tasks/twitter_task');

const { startStream, types } = require('near-lake-framework');


const txMap = [];
const signerPerBlock = [];
let showLog = false

const resolveChunk = async (chunkHash) => {
  try {
    const chunkData = await provider.chunk(chunkHash);
    const promises = [];

    promises.push(resolveTxs(chunkData.transactions));

    promises.push(updateGuildTask(chunkData.receipts, txMap));
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
    signerPerBlock.splice(0, signerPerBlock.length - 20);
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

const resolveNewBlock = async (fromBlockHeight) => {
  const lakeConfig = {
    s3BucketName: "near-lake-data-testnet",
    s3RegionName: "eu-central-1",
    startBlockHeight: fromBlockHeight,
  }

  await startStream(lakeConfig, handleStreamerMessage);
};

async function handleStreamerMessage(streamerMessage) {
  console.log(`
    Block #${streamerMessage.block.header.height}
    Shards: ${streamerMessage.shards.length}
  `);
}

module.exports.scheduleTask = async function(fromBlockHeight = 0) {
  if (fromBlockHeight > 0) {
    showLog = true
    resolveNewBlock(fromBlockHeight);
  }
  else {
    schedule.scheduleJob('*/1 * * * * *', function() {
      twitterTask.refreshToken();
    });
    const newestBlock = await provider.block({ finality: 'optimistic' });
    resolveNewBlock(newestBlock.header.height);
  }
};

/**
 * when start the nepbot, this function will get data from guild_deletes, and then create schedule jobs for each guild in database.
 */
exports.guildDeleteTask = async function() {
  const listGDs = await guildDeletes.list();
  if (listGDs) {
    for (const gd of listGDs) {
      const job = schedule.scheduleJob(gd.guild_id, gd.expired_at, function() {
        guildDelete.deleteData(gd.guild_id);
      });
      logger.info(`create new guild deletes schedule job, name: ${job.name} run at ${gd.expired_at}`);
    }
  }
};

/**
 * when start the nepbot, this function will get data from user_disconnect, and then create schedule jobs for each user in database.
 */
exports.userDisconnectTask = async function() {
  const listUDs = await userDisconnects.list();
  if (listUDs) {
    for (const ud of listUDs) {
      const jobName = ud.user_id + '-' + ud.guild_id;
      const job = schedule.scheduleJob(jobName, ud.expired_at, function() {
        userUtils.deleteDataAndRole(ud.user_id, ud.guild_id);
      });
      logger.info(`create new user disconnect schedule job, name: ${job.name} run at ${ud.expired_at}`);
    }
  }
};