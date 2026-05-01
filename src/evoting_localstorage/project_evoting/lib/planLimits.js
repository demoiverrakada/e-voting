const PLAN_LIMITS = {
  free: {
    max_elections: 2,
    max_voters_per_election: 100,
  },
  paid: {
    max_elections: Infinity,
    max_voters_per_election: Infinity,
  },
};
module.exports = PLAN_LIMITS;
