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
    // if (field.name == 'Receiver Role') {
    //   if (field.value == '@everyone') {
    //     result.role_id = await interaction.guild.roles.fetch().then(e => e.find(r => r.name === field.value).id);
    //   }
    //   else {
    //     result.role_id = await interaction.guild.roles.fetch().then(e => e.find(r => r.name === field.value.split('@').at(-1)).id);
    //   }
    //   result.role_name = field.value;
    // }
    // else if (field.name == 'Contract Address') {
    //   result.contract_address = field.value;
    // }
    // else if (field.name == 'Token d') {
    //   result.token_id = field.value;
    // }
    // else if (field.name == 'End_time(GMT)') {
    //   result.end_time = field.value;
    // }
    if (field.name == 'Airdrop ID' || field.name == "Hash") {
      result.hash = field.value;
    }
  }
  return result;
};

exports.formatFTEmbedMsg = async (interaction) => {
  const fields = interaction.message.embeds[0].fields;
  const result = {};
  for (const field of fields) {
    // if (field.name == 'Receiver_role') {
    //   if (field.value == '@everyone') {
    //     result.role_id = await interaction.guild.roles.fetch().then(e => e.find(r => r.name === field.value).id);
    //   }
    //   else {
    //     result.role_id = await interaction.guild.roles.fetch().then(e => e.find(r => r.name === field.value.split('@').at(-1)).id);
    //   }
    //   result.role_name = field.value;
    // }
    // else if (field.name == 'Token_Contract') {
    //   result.token_contract = field.value;
    // }
    // else if (field.name == 'Total_amount') {
    //   result.total_amount = field.value;
    // }
    // else if (field.name == 'Amount_per_share') {
    //   result.amount_per_share = field.value;
    // }
    // else if (field.name == 'End_time(GMT)') {
    //   result.end_time = field.value;
    // }
    if (field.name == 'Airdrop ID' || field.name == "Hash") {
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