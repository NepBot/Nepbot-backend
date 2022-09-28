const logger = require('../../pkg/utils/logger');
const Resp = require('../../pkg/models/object/response');
const nearUtils = require('../../pkg/utils/near_utils');
const userUtils = require('../../pkg/utils/user_utils');
const discordUtils = require('../../pkg/utils/discord_utils');

/* POST method income structure:
	{
		args: {xxx}      //maybe another signature here, used for link verification or operate verification
		account_id: String   //near account
        sign: String    //account id verification, args signature signed by this account
	}
*/

// api/getOwnerSign
const getOwnerSign = async (ctx, next) => {
  const req = ctx.request.body;
  const args = req.args;
  logger.info(`revice request by access 'api/getOwnerSign': ${JSON.stringify(req)}`);
  // verify user account
  if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
    logger.error('fn verifyAccountOwner failed in api/get-sign');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyAccountOwner failed in api/get-sign',
      success: false,
    });
    return;
  }

  if (!await nearUtils.verifyOperationSign(args, req.account_id)) {
    logger.error('fn verifyOperationSign failed in api/get-sign');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyOperationSign failed in api/get-sign',
      success: false,
    });
    return;
  }

  const guild = await discordUtils.getGuild(args.guild_id);
  if (args.user_id != guild.ownerId) {
    logger.error('user_id != guild.ownerId');
    ctx.body = new Resp({
      code: 500,
      message: 'user_id != guild.ownerId',
      success: false,
    });
    return;
  }

  const timestamp = Date.now() + '000000';
  const sign = await nearUtils.getSign(req.account_id + timestamp);
  ctx.body = new Resp({ 
    data: {
      timestamp: timestamp,
      sign: sign,
    },
  });
};
// api/operate-sign
const getOperationSign = async (ctx, next) => {
  const req = ctx.request.body;
  const args = req.args;
  if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
    logger.error('fn verifyAccountOwner failed in api/getOperationSign');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyAccountOwner failed in api/getOperationSign',
      success: false,
    });
    return;
  }
  const nonce = await userUtils.verifyUserId({ user_id: args.user_id, guild_id: args.guild_id }, args.sign);
  if (!nonce) {
    if (args.operationSign && await nearUtils.verifyOperationSign({
      user_id: args.user_id,
      guild_id: args.guild_id,
      sign: args.operationSign,
    }, req.account_id)) {
      ctx.body = new Resp({ data: args.operationSign });
      return;
    }
    ctx.body = new Resp({
      code: 500,
      message: 'nonce expired',
      success: false,
    });
    return;
  }
  const sign = await nearUtils.getSign(nonce + req.account_id);
  ctx.body = new Resp({ data: sign });
};

const getMintSign = async (ctx, next) => {
  const req = ctx.request.body;
  const args = req.args;
  if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
    logger.error('fn verifyAccountOwner failed in api/getMintSign');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyAccountOwner failed in api/getMintSign',
      success: false,
    });
    return;
  }

  const nonce = await userUtils.verifyUserId({ user_id: args.user_id, guild_id: args.guild_id, collection_id: args.collection_id }, args.sign);
  if (!nonce) {
    ctx.body = new Resp({
      code: 500,
      message: 'nonce expired',
      success: false,
    });
    return;
  }

  const timestamp = Date.now() + '000000';
  const sign = await nearUtils.getSign(req.account_id + timestamp + args.collection_id);
  ctx.body = new Resp({ data: {
    sign,
    timestamp,
  },
  });
};

const getSnapshotSign = async (ctx, next) => {
  const req = ctx.request.body;
  const args = req.args;
  if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
    logger.error('fn verifyAccountOwner failed in api/getSnapshotSign');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyAccountOwner failed in api/getSnapshotSign',
      success: false,
    });
    return;
  }

  const nonce = await userUtils.verifyUserId({ user_id: args.user_id, guild_id: args.guild_id, contract_address: args.contract_address }, args.sign);
  if (!nonce) {
    ctx.body = new Resp({
      code: 500,
      message: 'nonce expired',
      success: false,
    });
    return;
  }

  const timestamp = Date.now() + '000000';
  const sign = await nearUtils.getSign(req.account_id + timestamp + args.contract_address);
  ctx.body = new Resp({ data: {
    sign,
    timestamp,
  },
  });
};

const getVoteSign = async (ctx, next) => {
  const req = ctx.request.body;
  const args = req.args;
  if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
    logger.error('fn verifyAccountOwner failed in api/getVoteSign');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyAccountOwner failed in api/getVoteSign',
      success: false,
    });
    return;
  }

  const nonce = await userUtils.verifyUserId({ user_id: args.user_id, guild_id: args.guild_id, contract_address: args.contract_address, proposal_id: args.proposal_id, action: args.action }, args.sign);
  if (!nonce) {
    ctx.body = new Resp({
      code: 500,
      message: 'nonce expired',
      success: false,
    });
    return;
  }

  const timestamp = Date.now() + '000000';
  const sign = await nearUtils.getSign(req.account_id + timestamp + args.contract_address + args.proposal_id + args.action);
  ctx.body = new Resp({ data: {
    sign,
    timestamp,
  },
  });
};

const getAirdropFTSign = async (ctx, next) => {
  const req = ctx.request.body;
  const args = req.args;
  if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
    logger.error('fn verifyAccountOwner failed in api/getAirdropFTSign');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyAccountOwner failed in api/getAirdropFTSign',
      success: false,
    });
    return;
  }

  let nonce;
  if (args.hash) {
    nonce = await userUtils.verifyUserId(
      { user_id: args.user_id, guild_id: args.guild_id, hash: args.hash },
      args.sign,
    );
  }
  else {
    nonce = await userUtils.verifyUserId(
      { user_id: args.user_id, guild_id: args.guild_id, channel_id: args.channel_id, role_id: args.role_id, token_id: args.token_id, total_amount: args.total_amount, amount_per_share: args.amount_per_share, end_time: args.end_time },
      args.sign,
    );
  }

  if (!nonce) {
    ctx.body = new Resp({
      code: 500,
      message: 'nonce expired',
      success: false,
    });
    return;
  }

  const timestamp = Date.now() + '000000';
  let sign;
  if (args.hash) {
    sign = await nearUtils.getSign(args.hash + args.user_id + timestamp);
  }
  else {
    sign = await nearUtils.getSign(req.account_id + timestamp + args.role_id + args.token_id + args.total_amount + args.amount_per_share + args.end_time);
  }
  ctx.body = new Resp({ data: {
    sign,
    timestamp,
  },
  });
};

const getAirdropNFTSign = async (ctx, next) => {
  const req = ctx.request.body;
  const args = req.args;
  if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
    logger.error('fn verifyAccountOwner failed in api/getAirdropNFTSign');
    ctx.body = new Resp({
      code: 500,
      message: 'fn verifyAccountOwner failed in api/getAirdropNFTSign',
      success: false,
    });
    return;
  }
  let nonce;
  if (args.hash) {
    nonce = await userUtils.verifyUserId(
      { user_id: args.user_id, guild_id: args.guild_id, hash: args.hash },
      args.sign,
    );
  }
  else {
    nonce = await userUtils.verifyUserId(
      { user_id: args.user_id, guild_id: args.guild_id, channel_id: args.channel_id, contract_address: args.contract_address, role_id: args.role_id, token_id: args.token_id, end_time: args.end_time },
      args.sign,
    );
  }

  if (!nonce) {
    ctx.body = new Resp({
      code: 500,
      message: 'nonce expired',
      success: false,
    });
    return;
  }

  const timestamp = Date.now() + '000000';
  let sign;
  if (args.hash) {
    sign = await nearUtils.getSign(args.hash + args.user_id + timestamp);
  }
  else {
    sign = await nearUtils.getSign(req.account_id + timestamp + args.contract_address + args.role_id + args.token_id + args.end_time);
  }
  ctx.body = new Resp({ data: {
    sign,
    timestamp,
  },
  });
};

module.exports = {
  'POST /api/getOwnerSign': getOwnerSign,
  'POST /api/getOperationSign': getOperationSign,
  'POST /api/getMintSign': getMintSign,
  'POST /api/getSnapshotSign': getSnapshotSign,
  'POST /api/getVoteSign': getVoteSign,
  'POST /api/getAirdropNFTSign': getAirdropNFTSign,
  'POST /api/getAirdropFTSign': getAirdropFTSign,
};