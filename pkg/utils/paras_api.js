const request = require('request');
const config = require('../../pkg/utils/config');
const rp = require('request-promise');
const fs = require('fs');
const logger = require('./logger');
const axios = require('axios');

exports.getCollection = async (collectionId) => {
  const result = await request({
    method:'get',
    url:`${config.paras.api}/collections?collection_id=${collectionId}`,
  });
  if (result.data.status == 1) {
    return result.data.data;
  }
  return false;
};

exports.createCollection = async (formData, auth) => {
  const options = {
    method: 'POST',
    url: `${config.paras.api}/collections`,
    headers: formData.getHeaders({
      'authorization': auth,
    }),
    body: formData,
  };
  const result = await rp(options).catch(e => {
    console.log(e);
  });
  console.log(result);
  return JSON.parse(result);
};

exports.getTokenSeries = async (tokenSeriesId) => {
  const res = await new Promise((resolve, reject) => {
    request(`${config.paras.api}/token?token_series_id=${tokenSeriesId}&contract_id=${config.paras.nft_contract}&__limit=1`, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(JSON.parse(body));
      }
      reject(error);
    });
  });
  if (res.data.results) {
    return res.data.results[0];
  }
};

exports.getTokenPerOwnerCount = async (collectionId, ownerId, limit) => {
  return await new Promise((resolve, reject) => {
    request(`${config.paras.api}/token?collection_id=${collectionId}&owner_id=${ownerId}&exclude_total_burn=true&__limit=${limit}`, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        const res = JSON.parse(body);
        resolve(res.data.results.length);
      }
      reject(error);
    });
  });

};

exports.getUserInfo = async (accountId) => {
  const userInfo = await axios
    .get(`${config.paras.api}/profiles?accountId=${accountId}`)
    .then(res => {
      return res.data.data.results[0];
    })
    .catch(error => {
      logger.error(error.response.data);
    });
  return userInfo;
};
//this.getUserInfo('kangmalu.testnet').then(e => console.log(e.level));

const LEVEL = ['everyone', 'bronze', 'silver', 'gold', 'platinum'];
exports.checkUserLevel = async (accountLevel, ruleLevel) => {
  logger.debug(`accountLevel: ${accountLevel} --- ruleLevel: ${ruleLevel}`);

  if (LEVEL.indexOf(accountLevel) == -1 || LEVEL.indexOf(ruleLevel) == -1) {
    return false;
  }
  else if (LEVEL.indexOf(accountLevel) < LEVEL.indexOf(ruleLevel)) {
    return false;
  }
  else if (LEVEL.indexOf(accountLevel) > LEVEL.indexOf(ruleLevel)) {
    return true;
  }
  else if (LEVEL.indexOf(accountLevel) == LEVEL.indexOf(ruleLevel)) {
    return true;
  }
};
//this.checkUserLevel('bronze', 'test').then(console.log);