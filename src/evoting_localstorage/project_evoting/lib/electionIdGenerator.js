const { Election } = require('../models');

const generateElectionId = async (org_id) => {
  const last = await Election.findOne({ org_id })
    .sort({ election_id: -1 })
    .select('election_id');
  return last ? last.election_id + 1 : 1;
};

module.exports = { generateElectionId };
