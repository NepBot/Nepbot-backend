const { connect, WalletConnection, providers } = require('near-api-js');
const config = require('./config');
const BN = require('bn.js');
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

exports.filterNftActions = (contractIds, receipts) => {
  const ret = [];
  receipts = receipts.filter(item => item.receipt.Action && contractIds.findIndex(contractId => contractId == item.receiver_id) > -1 && item.receipt.Action.actions[0].FunctionCall.method_name.indexOf('nft_transfer') > -1);
  for (receipts of receipts) {
    const obj = {};
    obj.sender_id = receipts.predecessor_id;
    obj.contract_id = receipts.receiver_id;
    const args = JSON.parse(Buffer.from(receipts.receipt.Action.actions[0].FunctionCall.args, 'base64').toString());
    obj.receiver_id = args.receiver_id;
    ret.push(obj);
  }
  return ret;
};

exports.filterParasActions = (receipts) => {
  const ret = [];
  receipts = receipts.filter(item => item.receipt.Action && item.receiver_id == config.paras.nft_contract && item.receipt.Action.actions[0].FunctionCall.method_name.indexOf('nft_transfer') > -1);
  for (receipts of receipts) {
    const obj = {};
    obj.sender_id = receipts.predecessor_id;
    const args = JSON.parse(Buffer.from(receipts.receipt.Action.actions[0].FunctionCall.args, 'base64').toString());
    obj.receiver_id = args.receiver_id;
    obj.token_id = args.token_id;
    ret.push(obj);
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
    obj.daoId = receipts.receiver_id;
    const args = JSON.parse(Buffer.from(receipts.receipt.Action.actions[0].FunctionCall.args, 'base64').toString());
    if (!args.action.VoteApprove && !args.action.Finalize) {
      continue
    }
    const proposalResult = await account.viewFunction(receipts.receiver_id, 'get_proposal', { 'id': args.id })
    if (!(proposalResult.kind.AddMemberFromRole || proposalResult.kind.RemoveMemberFromRole)) {
      continue
    }
    obj.kind = proposalResult.kind;
    ret.push(obj);
  }
  return ret;
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