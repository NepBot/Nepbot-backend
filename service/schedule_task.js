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
const oct2Task = require('./schedule_tasks/oct_2_task')
const parasTask = require('./schedule_tasks/paras_task');
const tokenTask = require('./schedule_tasks/token_task');
const updateGuildTask = require('./schedule_tasks/update_guild_task');
const astrodaoTask = require('./schedule_tasks/astrodao_task');
const { provider } = require('../pkg/utils/near_utils');
const twitterTask = require('./schedule_tasks/twitter_task');
const { startStream } = require('../pkg/utils/block_stream');
const parasLoyaltyTask = require('./schedule_tasks/paras_loyalty_task');
const redis = require("../pkg/utils/redis")


let showLog = false

async function resolveShard(shard) {
  try {
    let promises = []
    for (let receiptItem of shard.receipt_execution_outcomes) {
      const receipt = receiptItem.receipt
      let txs = await redis.getTxs(receipt.receipt.Action.signer_id)
      if (!txs || txs.length == 0) {
          if (receipt.receipt.Action.signer_id != "system") {
              console.log("empty txs for this signer", receipt.receipt.Action.signer_id, receipt.receipt_id)
          }
          txs = []
      }
      let tx
      let outcome
      for (let t of txs) {
          const index = t.outcome.execution_outcome.outcome.receipt_ids.findIndex(receiptId => receiptId == receipt.receipt_id)
          if (index > -1) {
              tx = t
              outcome = receiptItem.execution_outcome
              t.outcome.execution_outcome.outcome.receipt_ids = t.outcome.execution_outcome.outcome.receipt_ids.filter(receiptId => receiptId != receipt.receipt_id).concat(outcome.outcome.receipt_ids)
              if (t.outcome.execution_outcome.outcome.receipt_ids.length <= 0) {
                  redis.delTx(receipt.receipt.Action.signer_id, tx)
              } else {
                  redis.setTx(receipt.receipt.Action.signer_id, tx)
              }
              break
          }
      }
    }

    promises.push(updateGuildTask(shard.chunk.receipts));
    promises.push(tokenTask(shard.chunk.receipts));
    promises.push(balanceTask(shard.chunk.receipts));
    promises.push(octTask(shard.chunk.receipts));
    promises.push(oct2Task(shard.chunk.receipts));
    promises.push(ntfTask(shard.chunk.receipts, shard.receipt_execution_outcomes));
    promises.push(parasTask(shard.chunk.receipts, shard.receipt_execution_outcomes));
    promises.push(astrodaoTask(shard.chunk.receipts));
    await Promise.all(promises);
  } catch (e) {
      console.log(e)
  }
}

function resolveTxs(transactions, blockHeight) {
  for (const tx of transactions) {
      tx.blockHeight = blockHeight
      const signerId = tx.transaction.signer_id;
      redis.setTx(signerId, tx)
  }
}

const resolveNewBlock = async (fromBlockHeight) => {
  const lakeConfig = {
    ...config.near_lake_config,
    startBlockHeight: fromBlockHeight,
    endBlockHeight: 0
  }

  await startStream(lakeConfig, handleStreamerMessage);
};

async function handleStreamerMessage(streamerMessage) {
  if (showLog) {
    console.log(`fetched block height: ${streamerMessage.block.header.height}`);
  }

  const promises = [];
  for (const shard of streamerMessage.shards) {
      if (shard.chunk && shard.receipt_execution_outcomes) {
          resolveTxs(shard.chunk.transactions, streamerMessage.block.header.height)
          promises.push(resolveShard(shard, streamerMessage.block));
      }

  }
  await Promise.allSettled(promises);
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
    schedule.scheduleJob('*/5 * * * * *', function() {
      parasLoyaltyTask.checkLevel();
      parasLoyaltyTask.checkStaking();
    });
    let unresolvedBlockHeight = await redis.init()
    const newestBlock = await provider.block({ finality: 'optimistic' });
    if (unresolvedBlockHeight != 0) {
      unresolvedBlockHeight = Math.min(newestBlock.header.height, unresolvedBlockHeight)
    } else {
      unresolvedBlockHeight = newestBlock.header.height
    }
    resolveNewBlock(unresolvedBlockHeight);
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
        userUtils.deleteData(ud.user_id, ud.guild_id);
      });
      logger.info(`create new user disconnect schedule job, name: ${job.name} run at ${ud.expired_at}`);
    }
  }
};