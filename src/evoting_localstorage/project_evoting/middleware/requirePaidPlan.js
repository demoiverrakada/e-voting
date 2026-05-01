const PLAN_LIMITS = require('../lib/planLimits');

const requirePaidPlan = async (req, res, next) => {
  const org = req.org;
  if (!org) return res.status(401).json({ error: 'Unauthorized' });

  const limits = PLAN_LIMITS[org.plan] || PLAN_LIMITS.free;
  const electionsUsed = org.elections_created || 0;

  if (electionsUsed >= limits.max_elections) {
    return res.status(403).json({
      error: 'Election limit reached for your plan',
      plan: org.plan,
      limit: limits.max_elections,
      upgrade_required: true,
    });
  }
  next();
};

module.exports = requirePaidPlan;
