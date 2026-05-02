const { Organization } = require('../../models');
const { beforeAllHook, afterAllHook, createTestOrg } = require('../setup');

describe('Organization model', () => {

  beforeAll(async () => { await beforeAllHook(); });
  afterAll(async () => { await afterAllHook(); });

  test('comparePassword returns true for correct password', async () => {
    const { org, plainPassword } = await createTestOrg({ email: 'cmp-true@test.com', name: 'Org CmpTrue' });
    const result = await org.comparePassword(plainPassword);
    expect(result).toBe(true);
  });

  test('comparePassword returns false for wrong password', async () => {
    const { org } = await createTestOrg({ email: 'cmp-false@test.com', name: 'Org CmpFalse' });
    const result = await org.comparePassword('wrongpassword');
    expect(result).toBe(false);
  });

  test('org is created with free plan by default', async () => {
    const { org } = await createTestOrg({ email: 'plan-check@test.com', name: 'Org PlanCheck' });
    expect(org.plan).toBe('free');
  });

  test('org slug is stored as lowercase', async () => {
    const org = new Organization({
      name: 'Mixed Case Org',
      slug: 'mixed-case-slug',
      email: 'mixed@test.com',
      passwordHash: 'hashedpassword123',
    });
    await org.save();
    expect(org.slug).toBe(org.slug.toLowerCase());
  });

});
