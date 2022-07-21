const axios = require('axios');
const config = require('../../pkg/utils/config');
const logger = require('./logger');

const getMembers = async (daoId) => {
  const members = await axios
    .get(`${config.astrodao.api}/${daoId}/members`)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      logger.error(error);
    });
  return members;
};

exports.isMemberInOrganization = async (daoId, accountId) => {
  const members = await getMembers(daoId);
  return members.some(item => item.accountId === accountId);
};