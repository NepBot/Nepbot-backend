const axios = require('axios');
const config = require('../../pkg/utils/config');
const logger = require('./logger');
const contractUtils = require('./contract_utils');
const { snakeCase } = require('snake-case');

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
 * get the policy from astrodao
 * @param contractId
 * @returns return the policy
 */
exports.getAstrodaoPolicy = async (contractId) => {
  const account = await contractUtils.contract();
  return await account.viewFunction(contractId, 'get_policy', {});
};

/**
 * @description based on the params to justify the account have role in dao.
 * @param {String} daoId the address of the astrodao
 * @param {String} accountId near wallet id
 * @param {String} roleInDao the name of the role in the astrodao
 * @returns boolean
 */
exports.isMemberHaveRole = async (daoId, accountId, roleInDao) => {
  const policy = await this.getAstrodaoPolicy(daoId);
  for (const role of policy.roles) {
    if (role.name == roleInDao && role.kind.Group.some(item => item === accountId)) {
      return true;
    }
  }
  return false;
};
// this.isMemberHaveRole('jacktest.sputnikv2.testnet', 'jacktest3.testnet', 'community').then(console.log);

/**
 *
 * @param {String} daoId
 * @returns the last index of the proposal
 */
exports.getLastProposalId = async (daoId) => {
  const account = await contractUtils.contract();
  return await account.viewFunction(daoId, 'get_last_proposal_id', {});
};

/**
 * 
 * @param {string} daoId
 * @returns array
 */
exports.listActiveProposals = async (daoId, fromIndex, limit) => {
  const account = await contractUtils.contract();
  const proposals = await account.viewFunction(daoId, 'get_proposals', { 'from_index': fromIndex, 'limit': limit }).then(p => p.reverse());
  const activeProposals = [];
  for (const proposal of proposals) {

    if (await isProposalExpired(proposal.submission_time)) {
      if (proposal.status == 'InProgress') {
        activeProposals.push(proposal);
      }
    }
    else {
      break;
    }
  }
  return activeProposals;
};

//this.listActiveProposals('jacktest.sputnikv2.testnet', 86, 25).then(e => console.log(e.length));

exports.isActiveProposal = async (proposal) => {
  if (await isProposalExpired(proposal.submission_time) && proposal.status == 'InProgress') {
    return true;
  }
  return false;
};

const isProposalExpired = async (time) =>{
  const curTime = new Date();
  const subTime = new Date(time / 1000000);
  const expiredTime = subTime.setDate(subTime.getDate() + 7); // 7 days
  if (expiredTime > curTime) {
    return true;
  }
  return false;

};
/**
 *
 * @param {String} daoId
 * @param {String} proposalId
 * @returns
 */
exports.getProposal = async (daoId, proposalId) => {
  const account = await contractUtils.contract();
  return await account.viewFunction(daoId, 'get_proposal', { id: proposalId });
};

/**
 *
 * @param {Object} proposal
 * @param {string} accountId near wallet id
 * @returns boolean
 */
exports.isAlreadyVote = async (proposal, accountId) => {
  if (accountId in proposal.votes) {
    return true;
  }
  return false;
};

/**
 *
 * @param {JSON} policy
 * @param {JSON} afterProposal this proposal is from formateProposal()
 * @param {String} accountId
 * @returns boolean
 */
exports.checkPermissions = async (policy, afterProposal, accountId) => {
  for (const role of policy.roles) {
    if (role.permissions == null) {
      continue;
    }
    const permissions = await formatPermission(role.permissions);
    if (role.name == 'all') {
      if (permissions.findIndex(permission => permission == afterProposal.proposal_type) > -1) {
        return true;
      }
      continue;
    }
    else if (role.kind.Group.some(item => item === accountId)) {
      if (permissions.findIndex(permission => permission == afterProposal.proposal_type) > -1) {
        return true;
      }
      continue;
    }
  }

  return false;
};

// this.checkUserPermissions('jacktest.sputnikv2.testnet', 59, 'jacktest4.testnet').then(console.log);

/**
 *
 * @param {Array} permissions;
 * @returns Array
 */
async function formatPermission(permissions) {
  const permissionsSet = new Set();
  for (const permission of permissions) {
    permissionsSet.add(permission.split(':')[0]);
  }
  return Array.from(permissionsSet);
}

/**
 *
 * @param {json} proposal
 * @returns { proposal_type: snakeCase(proposal.kind), description: 'text show in discord' }
 */
exports.formatProposal = async (proposal) => {
  if (typeof proposal.kind == 'object' && 'AddMemberToRole' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('AddMemberToRole') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'RemoveMemberFromRole' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('RemoveMemberFromRole') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'Transfer' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('Transfer') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'AddBounty' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('AddBounty') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'ChangeConfig' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('config') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'string' && proposal.kind == 'Vote') {
    const afterProposal = { proposal_type: snakeCase('Vote') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'FunctionCall' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('call') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'ChangePolicy' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('policy') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object') {
    const afterProposal = { proposal_type: snakeCase('unknown_type') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'string') {
    const afterProposal = { proposal_type: snakeCase('unknown_type') };
    const description = JSON.stringify(proposal);
    afterProposal.description = description;
    return afterProposal;
  }
};