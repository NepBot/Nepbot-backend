const axios = require('axios');
const config = require('../../pkg/utils/config');
const logger = require('./logger');
const contractUtils = require('./contract_utils');

// this is just a backup for using astrodao API, it's not used in anywhere 2022-08-05
const getMemberInfo = async (daoId) => {
  const memberInfo = await axios
    .get(`${config.astrodao.api}/${daoId}`)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      logger.error(error.response.data);
    });
  return memberInfo;
};

/**
 * @description based on the params to justify the account have role in dao.
 * @param {*} daoId
 * @param {*} accountId
 * @param {*} roleInDao
 * @returns boolean
 */
exports.isMemberHaveRole = async (daoId, accountId, roleInDao) => {
  const policy = await contractUtils.getAstrodaoPolicy(daoId);
  for (const role of policy.roles) {
    if (role.name == roleInDao && role.kind.Group.some(item => item === accountId)) {
      return true;
    }
  }
  return false;
};
// this.isMemberHaveRole('jacktest.sputnikv2.testnet', 'jacktest3.testnet', 'community').then(console.log);