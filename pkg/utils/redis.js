'use strict';
let txHashMap = {}
let txReceiptMap = {}
const key = "txs"
let Redis = require('ioredis');
let client = new Redis({
  enableAutoPipelining: true
});
client.on('error', function(e) {
  console.error("error:" + e);
});
client.on('connect', function(e) {
  console.log("# redis connected.");
});
client.on('close', function(e) {
  console.log("close:" + e);
});

async function init() {
  let txs = (await client.scan(0, "MATCH", key + "*"))[1]
  let minBlockHeight = 0
  for (let tx of txs) {
    try {
        tx = JSON.parse(tx)
    }catch (e){
      continue
    }
    setTx(tx, true)
    if (minBlockHeight == 0) {
      minBlockHeight = tx.blockHeight
    }
    if (minBlockHeight > tx.blockHeight) {
      minBlockHeight = tx.blockHeight
    }
  }
  return minBlockHeight
}

function getTxByReceipt(receiptId) {
  let txHash = txReceiptMap[receiptId]
  delete txReceiptMap[receiptId]
  return txHashMap[txHash]
}

function delReceipt(receiptId) {
  delete txReceiptMap[receiptId]
}

function delTx(tx) {
  delete txHashMap[tx]
  client.del(`${key}:${tx.transaction.hash}`)
}

function setTx(tx, init = false) {
  let found = txHashMap[tx.transaction.hash] ? true : false
  txHashMap[tx.transaction.hash] = tx
  for (let receiptId of tx.outcome.execution_outcome.outcome.receipt_ids) {
    txReceiptMap[receiptId] = tx.transaction.hash
  }
  if (!init && !found) {
    client.set(`${key}:${tx.transaction.hash}`, JSON.stringify(tx))
    client.expire(`${key}:${tx.transaction.hash}`, 60 * 60 * 24)
  }
}

module.exports = {
  init,
  setTx,
  getTxByReceipt,
  delReceipt,
  delTx
}
