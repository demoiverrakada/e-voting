const { Election } = require('../models');

async function generateElectionId(org_id) {
  const lastElection = await Election.findOne({ org_id })
    .sort({ election_id: -1 })
    .select('election_id');

  if (!lastElection) {
    return 1;
  }

  return lastElection.election_id + 1;
}

module.exports = { generateElectionId };
