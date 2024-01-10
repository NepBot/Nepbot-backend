'use strict';
let txMap = {}
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
    } catch (e) {
        continue
    }
    
    const signerId = tx.transaction.signer_id
    if (!txMap[signerId]) {
      txMap[signerId] = []
    }
    txMap[signerId].push(tx)
    if (minBlockHeight == 0) {
      minBlockHeight = tx.blockHeight
    }
    if (minBlockHeight > tx.blockHeight) {
      minBlockHeight = tx.blockHeight
    }
  }
  return minBlockHeight
}

function getTxs(signerId) {
  return txMap[signerId]
}

function delTx(signerId, tx) {
  const index = txMap[signerId].findIndex(t => t.transaction.hash == tx.transaction.hash)
  if (index > -1) {
    delete txMap[signerId][index]
    txMap[signerId].splice(index, 1)
  }
  client.del(`${key}:${signerId}${tx.transaction.hash}`)
}

function setTx(signerId, tx) {
  if (!txMap[signerId]) {
    txMap[signerId] = []
  }
  
  const index = txMap[signerId].findIndex(t => t.transaction.hash == tx.transaction.hash)
  if (index > -1) {
    txMap[signerId][index] = tx
  } else {
    txMap[signerId].push(tx)
    client.set(`${key}:${signerId}${tx.transaction.hash}`, JSON.stringify(tx))
  }
  client.expire(signerId, 60 * 60 * 24)
}

module.exports = {
  init,
  setTx,
  getTxs,
  delTx
}
