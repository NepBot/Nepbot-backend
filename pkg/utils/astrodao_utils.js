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
// this.isMemberHaveRole('goodguy.sputnikv2.testnet', '0xjacktest1.testnet', 'council').then(console.log);

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
      else if (role.permissions.includes('*:VoteApprove') || role.permissions.includes('*:VoteRemove')) {
        return true;
      }
      continue;
    }
    else if (role.kind.Group.some(item => item == accountId)) {
      if (permissions.findIndex(permission => permission == afterProposal.proposal_type) > -1) {
        return true;
      }
      else if (role.permissions.includes('*:VoteApprove') || role.permissions.includes('*:VoteRemove')) {
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
//formatPermission(Array.from(['*:VoteReject', '*:VoteRemove', '*:VoteApprove', '*:AddProposal', '*:Finalize'])).then(console.log);


async function getSubmitTime(time) {
  const subTime = new Date(time / 1000000);
  return subTime.toUTCString();
}
//getSubmitTime('1661061753973331808').then(console.log);

async function getDeadline(subTime, dueTime) {
  const time = new Date((new Date(subTime / 1000000).getTime() + new Date(dueTime / 1000000).getTime()));
  return time.toUTCString();
}

/**
 *
 * @param {json} proposal
 * @returns { proposal_type: snakeCase(proposal.kind), description: 'text show in discord' }
 */
exports.formatProposal = async (proposal) => {
  const embeds = [];
  if (typeof proposal.kind == 'object' && 'AddMemberToRole' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('AddMemberToRole') };
    afterProposal.origin = JSON.stringify(proposal);
    embeds.push({ name: 'Proposal ID', value: proposal.id.toString() });
    embeds.push({ name: 'Proposer', value: proposal.proposer });
    embeds.push({ name: 'Proposal Type', value: afterProposal.proposal_type });
    embeds.push({ name: 'Description', value: proposal.description.split('$$$$$$')[0].substring(0, 1024) });
    embeds.push({ name: 'Target', value: proposal.kind.AddMemberToRole.member_id });
    embeds.push({ name: 'Group', value: proposal.kind.AddMemberToRole.role });
    embeds.push({ name: 'Submission Time', value: await getSubmitTime(proposal.submission_time) });
    afterProposal.embeds = embeds;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'RemoveMemberFromRole' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('RemoveMemberFromRole') };
    afterProposal.origin = JSON.stringify(proposal);
    embeds.push({ name: 'Proposal ID', value: proposal.id.toString() });
    embeds.push({ name: 'Proposer', value: proposal.proposer });
    embeds.push({ name: 'Proposal Type', value: afterProposal.proposal_type });
    embeds.push({ name: 'Description', value: proposal.description.split('$$$$$$')[0].substring(0, 1024) });
    embeds.push({ name: 'Target', value: proposal.kind.AddMemberToRole.member_id });
    embeds.push({ name: 'Group', value: proposal.kind.AddMemberToRole.role });
    embeds.push({ name: 'Submission Time', value: await getSubmitTime(proposal.submission_time) });
    afterProposal.embeds = embeds;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'Transfer' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('Transfer') };
    afterProposal.origin = JSON.stringify(proposal);

    afterProposal.embeds = embeds;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'AddBounty' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('AddBounty') };
    afterProposal.origin = JSON.stringify(proposal);

    embeds.push({ name: 'Proposal ID', value: proposal.id.toString() });
    embeds.push({ name: 'Proposer', value: proposal.proposer });
    embeds.push({ name: 'Proposal Type', value: afterProposal.proposal_type });
    embeds.push({ name: 'Description', value: proposal.kind.AddBounty.bounty.description.split('$$$$')[0].substring(0, 1024) });
    embeds.push({ name: 'Token', value: proposal.kind.AddBounty.bounty.token });
    embeds.push({ name: 'Amount', value: proposal.kind.AddBounty.bounty.amount });
    embeds.push({ name: 'Available Claims', value: proposal.kind.AddBounty.bounty.times.toString() });
    embeds.push({ name: 'Deadline', value: await getDeadline(proposal.submission_time, proposal.kind.AddBounty.bounty.max_deadline) });
    embeds.push({ name: 'Submission Time', value: await getSubmitTime(proposal.submission_time) });

    afterProposal.embeds = embeds;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'BountyDone' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('BountyDone') };
    afterProposal.origin = JSON.stringify(proposal);

    embeds.push({ name: 'Proposal ID', value: proposal.id.toString() });
    embeds.push({ name: 'Proposer', value: proposal.proposer });
    embeds.push({ name: 'Proposal Type', value: afterProposal.proposal_type });
    embeds.push({ name: 'Description', value: proposal.description.split('$$$$')[0].substring(0, 1024) });
    embeds.push({ name: 'Bounty ID', value: proposal.kind.BountyDone.bounty_id.toString() });
    embeds.push({ name: 'Receiver ID', value: proposal.kind.BountyDone.receiver_id });
    embeds.push({ name: 'Submission Time', value: await getSubmitTime(proposal.submission_time) });

    afterProposal.embeds = embeds;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'ChangeConfig' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('config') };
    afterProposal.origin = JSON.stringify(proposal);
    return afterProposal;
  }
  else if (typeof proposal.kind == 'string' && proposal.kind == 'Vote') {
    const afterProposal = { proposal_type: snakeCase('Vote') };
    afterProposal.origin = JSON.stringify(proposal);
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'FunctionCall' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('FunctionCall') };
    afterProposal.origin = JSON.stringify(proposal);
    embeds.push({ name: 'Proposal ID', value: proposal.id.toString() });
    embeds.push({ name: 'Proposer', value: proposal.proposer });
    embeds.push({ name: 'Proposal Type', value: afterProposal.proposal_type });
    embeds.push({ name: 'Description', value: proposal.description.split('$$$$$$')[0].substring(0, 1024) });
    embeds.push({ name: 'Smart Contract Address', value: proposal.kind.FunctionCall.receiver_id });
    for (const action of proposal.kind.FunctionCall.actions) {
      embeds.push({ name: 'Method Name', value: action.method_name });
      embeds.push({ name: 'JSON', value: action.args });
      embeds.push({ name: 'Deposit', value: action.deposit });
    }
    embeds.push({ name: 'Submission Time', value: await getSubmitTime(proposal.submission_time) });
    afterProposal.embeds = embeds;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object' && 'ChangePolicy' in proposal.kind) {
    const afterProposal = { proposal_type: snakeCase('policy') };
    afterProposal.origin = JSON.stringify(proposal);
    embeds.push({ name: 'Proposal ID', value: proposal.id.toString() });
    embeds.push({ name: 'Proposer', value: proposal.proposer });
    embeds.push({ name: 'Proposal Type', value: afterProposal.proposal_type });
    embeds.push({ name: 'Description', value: proposal.description.split('$$$$$$')[0].substring(0, 1024) });
    embeds.push({ name: 'Submission Time', value: await getSubmitTime(proposal.submission_time) });
    afterProposal.embeds = embeds;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'object') {
    const afterProposal = { proposal_type: snakeCase('unknown_type') };
    afterProposal.origin = JSON.stringify(proposal);
    embeds.push({ name: 'Proposal ID', value: proposal.id.toString() });
    embeds.push({ name: 'Proposer', value: proposal.proposer });
    embeds.push({ name: 'Proposal Type', value: afterProposal.proposal_type });
    embeds.push({ name: 'Description', value: proposal.description.split('$$$$$$')[0].substring(0, 1024) });
    embeds.push({ name: 'Submission Time', value: await getSubmitTime(proposal.submission_time) });
    afterProposal.embeds = embeds;
    return afterProposal;
  }
  else if (typeof proposal.kind == 'string') {
    const afterProposal = { proposal_type: snakeCase('unknown_type') };
    afterProposal.origin = JSON.stringify(proposal);
    embeds.push({ name: 'Proposal ID', value: proposal.id.toString() });
    embeds.push({ name: 'Proposer', value: proposal.proposer });
    embeds.push({ name: 'Proposal Type', value: afterProposal.proposal_type });
    embeds.push({ name: 'Description', value: proposal.description.split('$$$$$$')[0].substring(0, 1024) });
    embeds.push({ name: 'Submission Time', value: await getSubmitTime(proposal.submission_time) });
    afterProposal.embeds = embeds;
    return afterProposal;
  }
};

// const proposal = {
//   id: 59,
//   proposer: 'jacktest4.testnet',
//   description: 'test$$$$$$$$ProposeAddMember',
//   kind: {
//     AddMemberToRole: { member_id: 'jacktest4.testnet', role: 'community' }
//   },
//   status: 'InProgress',
//   vote_counts: { all: [ 2, 0, 0 ] },
//   votes: { 'jacktest2.testnet': 'Approve', 'jacktest4.testnet': 'Approve' },
//   submission_time: '1661061753973331808'
// }
// ;
// this.formatProposal(proposal).then(console.log).catch(e => console.log(e));