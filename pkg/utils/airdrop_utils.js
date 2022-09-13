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
    if (field.name == 'Receiver_role') {
      result.role_id = await interaction.guild.roles.fetch().then(e => e.find(r => r.name === field.value.split('@').at(-1)).id);
      result.role_name = field.value;
    }
    else if (field.name == 'Contract_address') {
      result.contract_address = field.value;
    }
    else if (field.name == 'Token_id') {
      result.token_id = field.value;
    }
    else if (field.name == 'End_time(GMT)') {
      result.end_time = field.value;
    }
  }
  return result;
};

exports.formatFTEmbedMsg = async (interaction) => {
  const fields = interaction.message.embeds[0].fields;
  const result = {};
  for (const field of fields) {
    if (field.name == 'Receiver_role') {
      result.role_id = await interaction.guild.roles.fetch().then(e => e.find(r => r.name === field.value.split('@').at(-1)).id);
      result.role_name = field.value;
    }
    else if (field.name == 'Token_id') {
      result.token_id = field.value;
    }
    else if (field.name == 'Total_amount') {
      result.total_amount = field.value;
    }
    else if (field.name == 'Amount_per_share') {
      result.amount_per_share = field.value;
    }
    else if (field.name == 'End_time(GMT)') {
      result.end_time = field.value;
    }
  }
  return result;
};


exports.checkClaimed = async (userId) => {
  const account = await contractUtils.contract();
  return await account.viewFunction(config.rule_contract, 'get_guild', { user_id: userId });
};