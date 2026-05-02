const requirePaidPlan = require('../../middleware/requirePaidPlan');

describe('requirePaidPlan Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('free plan under limit calls next', async () => {
    req = { org: { plan: 'free', elections_created: 0 } };
    await requirePaidPlan(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('free plan at limit returns 403', async () => {
    req = { org: { plan: 'free', elections_created: 2 } };
    await requirePaidPlan(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      upgrade_required: true,
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('paid plan with many elections calls next', async () => {
    req = { org: { plan: 'paid', elections_created: 99 } };
    await requirePaidPlan(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('unauthorized returns 401', async () => {
    req = {};
    await requirePaidPlan(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
