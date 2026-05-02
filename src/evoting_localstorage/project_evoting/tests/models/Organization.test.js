const { Organization } = require('../../models');
const { createTestOrg, beforeAllHook, afterAllHook } = require('../setup');

describe('Organization model', () => {
    beforeAll(async () => {
        await beforeAllHook();
    });

    afterAll(async () => {
        await afterAllHook();
    });

    test('comparePassword returns true for correct password', async () => {
        const { org, plainPassword } = await createTestOrg();
        const result = await org.comparePassword(plainPassword);
        expect(result).toBe(true);
    });

    test('comparePassword returns false for wrong password', async () => {
        const { org } = await createTestOrg();
        const result = await org.comparePassword('wrongpassword');
        expect(result).toBe(false);
    });

    test('org is created with free plan by default', async () => {
        const { org } = await createTestOrg();
        expect(org.plan).toBe('free');
    });

    test('org slug is stored as lowercase', async () => {
        // Manually creating to test lowercase conversion if it's in a hook
        const org = new Organization({
            name: 'Mixed Case Org',
            slug: 'Mixed-Case-Slug',
            email: 'mixed@test.com',
            passwordHash: 'pass123'
        });
        await org.save();
        expect(org.slug).toBe('mixed-case-slug');
    });
});
