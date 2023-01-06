const config = require('../../pkg/utils/config');
const logger = require('./logger');
const contractUtils = require('./contract_utils');

exports.getGMTTime = async (duration) => {
  const date = new Date();
  date.setDate(date.getDate() + duration);
  return date.toISOString();
};

//this.getGMTTime('2022-09-01 05:53:22').then(console.log);

exports.formatNFTEmbedMsg = async (interaction) => {
  const fields = interaction.message.embeds[0].fields;
  const result = {};
  for (const field of fields) {
    if (config.fields.airdrop_hash.findIndex(item => item == field.name) > -1) {
      result.hash = field.value;
    }
  }
  return result;
};

exports.formatFTEmbedMsg = async (interaction) => {
  const fields = interaction.message.embeds[0].fields;
  const result = {};
  for (const field of fields) {
    if (config.fields.airdrop_hash.findIndex(item => item == field.name) > -1) {
      result.hash = field.value;
    }
  }
  return result;
};


exports.checkIsClaimed = async (userId, hash) => {
  const account = await contractUtils.contract();
  return await account.viewFunction(config.airdrop_contract, 'check_is_claimed', { user_id: userId, hash });
};

exports.getCampaign = async (hash) => {
  const account = await contractUtils.contract();
  return await account.viewFunction(config.airdrop_contract, 'get_campaign', { hash });
}