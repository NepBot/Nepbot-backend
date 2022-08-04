const { connect, WalletConnection, providers } = require('near-api-js');
const config = require('./config');
const BN = require('bn.js');
const logger = require('./logger');
const contract = async () => {
  // connect to NEAR
  const near = await connect(config.nearWallet);
  return await near.account();
};

exports.contract = contract;
exports.getFieldList = async () => {
  const account = await this.contract();
  return await account.viewFunction(config.rule_contract, 'get_token_list', {});
};

exports.getRules = async (guildId) => {
  const account = await this.contract();
  // return await queryRule({guild_id: guildId});
  return await account.viewFunction(config.rule_contract, 'get_guild', { guild_id: guildId });
};

exports.getRulesByField = async (key, value) => {
  const account = await this.contract();
  return await account.viewFunction(config.rule_contract, 'get_field', { field_key: key, field_value: value });
};

exports.getBalanceOf = async (tokenId, accountId) => {
  const account = await this.contract();
  return await account.viewFunction(tokenId, 'ft_balance_of', { account_id: accountId });
};

exports.getNftCountOf = async (contractId, accountId) => {
  const account = await this.contract();
  return await account.viewFunction(contractId, 'nft_supply_for_owner', { account_id: accountId });
};

exports.getParasNftCountOf = async (accountId, tokenId) => {
  const account = await this.contract();

  return await account.viewFunction(tokenId, 'nft_supply_for_owner', { account_id: accountId });
};

exports.getNearBalanceOf = async (accountId) => {
  const near = await connect(config.nearWallet);
  const account = await near.account(accountId);
  const balance = await account.getAccountBalance();
  return balance.total;
};

exports.getOctAppchainRole = async (appchain_id, account_id) => {
  const account = await this.contract();
  const validator = await account.viewFunction(appchain_id + '.' + config.oct_contract, 'get_validator_list_of', {});
  const delegator = await account.viewFunction(appchain_id + '.' + config.oct_contract, 'get_delegations_of', { delegator_id: account_id });
  if (validator && validator.findIndex(item => item.validator_id == account_id) > -1) {
    return 'validator';
  }
  else if (delegator && delegator.length > 0) {
    return 'delegator';
  }
  else {
    return;
  }
};

exports.getCollectionSeries = async (collectionId) => {
  try {
    const account = await this.contract();
    const series = await account.viewFunction(config.nft_contract, 'get_token_metadata', { collection_id: collectionId });
    return series;
  }
  catch (e) {
    return [];
  }
};

exports.getCollectionsByGuild = async (guildId) => {
  try {
    const account = await this.contract();
    return await account.viewFunction(config.nft_contract, 'get_collections_by_guild', { guild_id: guildId });
  }
  catch (e) {
    return [];
  }
};

async function parseEvents(receipt, txMap, eventType) {
  console.log(txMap)
  let txDigests = txMap[receipt.receipt.Action.signer_id]
  if (!txDigests || !txDigests[txDigest.length - 1]) {
    return []
  }
  let tx = {}
  for (let txDigest of txDigests) {
    tx = await provider.txStatus(txDigest.hash, txDigest.signer_id)
    if (tx.transaction_outcome.outcome.receipt_ids.findIndex(receipt_id => receipt_id == receipt.receipt_id) > -1) {
      break
    }
  }
  console.log()
  let ret = []
  for (let outcome of tx.receipts_outcome) {
    const events = outcome.outcome.logs.filter(log => {
      try {
        const logObj = JSON.parse(log)
        return logObj.EVENT_JSON && logObj.EVENT_JSON.event == eventType
      } catch (e) {
        return false
      }
    })
    ret = ret.concat(events)
  }
  return ret
}

exports.filterTokenActions = (tokenIds, receipts) => {
  const ret = [];
  receipts = receipts.filter(item => item.receipt.Action && tokenIds.findIndex(tokenId => tokenId == item.receiver_id) > -1 && item.receipt.Action.actions[0].FunctionCall.method_name.indexOf('ft_transfer') > -1);
  for (receipts of receipts) {
    const obj = {};
    obj.sender_id = receipts.predecessor_id;
    obj.token_id = receipts.receiver_id;
    const args = JSON.parse(Buffer.from(receipts.receipt.Action.actions[0].FunctionCall.args, 'base64').toString());
    obj.receiver_id = args.receiver_id;
    ret.push(obj);
  }

  return ret;
};

exports.filterOctActions = (receipts) => {
  const ret = [];
  receipts = receipts.filter(item => item.receipt.Action && item.receiver_id == config.oct_contract && item.receipt.Action.actions[0].FunctionCall.method_name == 'sync_state_of');
  for (receipts of receipts) {
    const obj = {};
    const args = JSON.parse(Buffer.from(receipts.receipt.Action.actions[0].FunctionCall.args, 'base64').toString());
    obj.appchain_id = args.appchain_id;
    obj.signer_id = receipts.receipt.Action.signer_id;
    ret.push(obj);
  }
  return ret;
};

exports.filterRoleActions = (receipts) => {
  const ret = [];
  receipts = receipts.filter(item =>
    item.receipt.Action && item.receiver_id == config.rule_contract &&
			(item.receipt.Action.actions[0].FunctionCall.method_name == 'set_roles' ||
			item.receipt.Action.actions[0].FunctionCall.method_name == 'del_roles'),
  );
  for (receipts of receipts) {
    const obj = {};
    obj.method_name = receipts.receipt.Action.actions[0].FunctionCall.method_name;
    const args = JSON.parse(Buffer.from(receipts.receipt.Action.actions[0].FunctionCall.args, 'base64').toString());
    obj.roles = args.roles;
    ret.push(obj);
  }
  return ret;
};

exports.filterTransferActions = (accountIds, receipts) => {
  const ret = [];
  receipts.forEach(item => {
    if (item.receipt.Action && item.receipt.Action.actions[0] && item.receipt.Action.actions[0].Transfer) {
      if (accountIds.findIndex(accountId => accountId == item.receiver_id) > -1) {
        ret.push({ account_id: item.receiver_id });
      }
      if (accountIds.findIndex(accountId => accountId == item.predecessor_id) > -1) {
        ret.push({ account_id: item.predecessor_id });
      }
    }

  });
  return ret;
};

exports.filterNftActions = async (contractIds, receipts, txMap) => {
  const ret = [];
  receipts = receipts.filter(item => item.receipt.Action && contractIds.findIndex(contractId => contractId == item.receiver_id) > -1);
  //console.log(receipts)
  for (receipts of receipts) {
    const events = await parseEvents(receipt, txMap, "nft_transfer")
    console.log(events)
    for (let event of events) {
      const obj = {};
      obj.sender_id = event.data.old_owner_id;
      obj.contract_id = receipts.receiver_id;
      obj.receiver_id = event.data.new_owner_id;
      ret.push(obj);
    }
  }
  return ret;
};

exports.filterParasActions = async (receipts, txMap) => {
  const ret = [];
  receipts = receipts.filter(item => item.receipt.Action && item.receiver_id == config.paras.nft_contract);
  for (receipts of receipts) {
    const events = await parseEvents(receipt, txMap, "nft_transfer")
    for (let event of events) {
      const obj = {};
      obj.sender_id = event.data.old_owner_id;
      obj.receiver_id = event.data.new_owner_id;
      obj.token_id = event.data.token_ids[0]
      ret.push(obj);
    }
  }
  return ret;
};

exports.filterCollectionActions = (receipts) => {
  const ret = [];
  receipts = receipts.filter(item =>
    item.receipt.Action && item.receiver_id == config.nft_contract &&
			(item.receipt.Action.actions[0].FunctionCall.method_name == 'create_collection'),
  );
  for (receipts of receipts) {
    const obj = {};
    obj.method_name = receipts.receipt.Action.actions[0].FunctionCall.method_name;
    const args = JSON.parse(Buffer.from(receipts.receipt.Action.actions[0].FunctionCall.args, 'base64').toString());
    obj.outer_collection_id = args.outer_collection_id;
    obj.contract_type = args.contract_type;
    obj.guild_id = args.guild_id;
    ret.push(obj);
  }
  return ret;
};

exports.filterAstroDaoMemberActions = async (daoIds, receipts) => {
  const account = await this.contract();
  const ret = [];
  receipts = receipts.filter(item =>
    item.receipt.Action &&
    daoIds.findIndex(daoId => daoId == item.receiver_id) > -1 &&
    item.receipt.Action.actions[0].FunctionCall.method_name == 'act_proposal');
  for (receipts of receipts) {
    const obj = {};
    obj.dao_id = receipts.receiver_id;
    const args = JSON.parse(Buffer.from(receipts.receipt.Action.actions[0].FunctionCall.args, 'base64').toString());
    const proposalResult = await account.viewFunction(receipts.receiver_id, 'get_proposal', { 'id': args.id });
    if (!('AddMemberToRole' in proposalResult.kind || 'RemoveMemberFromRole' in proposalResult.kind) && proposalResult.status != 'Approved') {
      continue;
    }
    obj.kind = proposalResult.kind;
    // obj = {dao_id: "xxxxxxxxx.sputnikv2.testnet", kind: {RemoveMemberFromRole: { member_id: 'member_id', role: 'council' }}}
    ret.push(obj);
  }
  if (ret.length > 0) {
    logger.debug(`ret: ${ JSON.stringify(ret) }`);
    return ret;
  }
};

/**
 * get the staking balance for specifying user
 * @param accountId
 * @returns return the total staking balance in string format
 */
exports.getStakingBalance = async (accountId) => {
  const stakingDeposits = await fetch(`${config.indexer_service_url}/staking-deposits/${accountId}`)
    .then((r) => r.json());
  let stakedBalance = new BN('0');
  stakingDeposits.forEach(({ deposit }) => {
    stakedBalance = stakedBalance.add(new BN(deposit));
  });
  return stakedBalance.toString();
};

/**
 * get the staking balance on paras for specifying user
 * @param accountId
 * @returns return the total staking balance in string format
 */
exports.getStakedParas = async (accountId) => {
  const account = await this.contract();
  const data = await account.viewFunction(config.paras.stake_contract, 'list_user_seeds', { account_id: accountId }).then((r) => r[config.paras.token_contract]);
  return new BN(data);
};

/**
 * get the collection info from nepbot contract
 * @param collectionId
 * @returns return collection info
 * CollectionInfo {
            collection_id,
            outer_collection_id: collection.outer_collection_id,
            contract_type: collection.contract_type,
            guild_id: collection.guild_id,
            creator_id: collection.creator_id,
            mintable_roles: collection.mintable_roles,
            royalty: collection.royalty,
            price: collection.price.into(),
            mint_count_limit: collection.mint_count_limit
        }
 */
exports.getCollectionInfo = async (collectionId) => {
  const account = await this.contract();
  return await account.viewFunction(config.nft_contract, 'get_collection', { collection_id: collectionId });
};

exports.getAstrodaoPolicy = async (contractId) => {
  
  return await account.viewFunction(config.nft_contract, 'get_policy', { collection_id: collectionId });
}

exports.checkAstrodaoRole = async (contractId, role, accountId) => {
  const account = await this.contract();
  const res = await account.viewFunction(contractId, 'get_policy', {});
  console.log(res)
}