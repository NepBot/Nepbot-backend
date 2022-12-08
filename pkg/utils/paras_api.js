/**
 * all source code about paras can be found in https://github.com/orgs/ParasHQ/repositories?type=all
 */
const request = require('request');
const config = require('../../pkg/utils/config');
const rp = require('request-promise');
const fs = require('fs');
const logger = require('./logger');
const axios = require('axios');
const contractUtils = require('./contract_utils');
const { throws } = require('assert');

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
      logger.error(error);
    });
  return userInfo;
};
// this.getUserInfo('gogoshishi.near').then(e => console.log(e.level));

const LEVEL = ['Everyone', 'Bronze', 'Silver', 'Gold', 'Platinum'];
exports.checkUserLevel = async (accountLevel, ruleLevel) => {

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
//this.checkUserLevel('Bronze', 'Sliver').then(console.log);

exports.getRaffleId = async () => {
  const current = await axios
    .get(`${config.paras.api}/raffle/current`)
    .then(res => {
      return res.data.raffle._id;
    })
    .catch(error => {
      logger.error(error);
    });
  return current;
};

exports.getLeaderBoard = async (raffleId, raffleType, accountId) => {
  if (accountId) {
    const result = await axios
      .get(`${config.paras.api}/raffle/${raffleId}/leaderboards?__skip=0&__limit=1&raffle_type=${raffleType}&account_id=${accountId}`)
      .then(res => {
        return res.data.account_id;
      })
      .catch(error => {
        logger.error(error);
      });
    return result;
  }
  else {
    const result = await axios
      .get(`${config.paras.api}/raffle/${raffleId}/leaderboards?__skip=0&__limit=10&raffle_type=${raffleType}`)
      .then(res => {
        return res.data.results;
      })
      .catch(error => {
        logger.error(error);
      });
    return result;
  }
};
// this.getLeaderBoard('platinum', 'smile143.near').then(console.log);

/**
 * get the user locked seeds
 * @param accountId
 * @returns
 * pub struct LockedSeed {
    pub balance: U128,
    pub started_at: u32,
    pub ended_at: u32
}
 */
exports.getUserLockedSeeds = async (accountId) => {
  const account = await contractUtils.contract();
  return await account.viewFunction(config.paras.stake_contract, 'list_user_locked_seeds', { account_id: accountId }).then((e) => (e)[config.paras.token_contract]);
};
//this.getUserLockedSeeds('dolmat.near').then(console.log).catch(e => console.log(e));

exports.prettyBalance = (balance, decimals = 18, len = 8) => {
  if (!balance) {
    return '0';
  }
  const diff = balance.toString().length - decimals;
  const fixedPoint = Math.max(2, len - Math.max(diff, 0));
  const fixedBalance = (balance / 10 ** decimals).toFixed(fixedPoint);
  const finalBalance = parseFloat(fixedBalance).toString();
  const [head, tail] = finalBalance.split('.');
  if (head == 0) {
    if (tail) {
      return `${head}.${tail.substring(0, len - 1)}`;
    }
    return `${head}`;
  }
  const formattedHead = head.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return tail ? `${formattedHead}.${tail}` : formattedHead;
};

// console.log(this.prettyBalance('3002980000000000000000'));
