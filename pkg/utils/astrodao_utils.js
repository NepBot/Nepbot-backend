const axios = require('axios');
const config = require('../../pkg/utils/config');
const logger = require('./logger');

const getMemberInfo = async (daoId) => {
  const memberInfo = await axios
    .get(`${config.astrodao.api}/${daoId}`)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      logger.error(error);
    });
  return memberInfo;
};

exports.isMemberHaveRole = async (daoId, accountId, roleInDao) => {
  const data = await getMemberInfo(daoId);
  for (const role of data.policy.roles) {
    if (role.name == roleInDao && role.accountIds.some(item => item === accountId)) {
      return true;
    }
  }
  return false;
};
//this.isMemberHaveRole('jacktest.sputnikv2.testnet', 'jacktest2.testnet', 'community').then(console.log);