const { voterSchema } = require('../../validators/voterValidator');

describe('voterValidator', () => {
    test('accepts valid voter data', () => {
        const { error } = voterSchema.validate({
            voter_id: 'v123',
            name: 'John Doe',
            election_id: 1
        });
        expect(error).toBeUndefined();
    });

    test('rejects missing voter_id', () => {
        const { error } = voterSchema.validate({
            name: 'John Doe',
            election_id: 1
        });
        expect(error).toBeDefined();
    });

    test('rejects missing name', () => {
        const { error } = voterSchema.validate({
            voter_id: 'v123',
            election_id: 1
        });
        expect(error).toBeDefined();
    });

    test('rejects missing election_id', () => {
        const { error } = voterSchema.validate({
            voter_id: 'v123',
            name: 'John Doe'
        });
        expect(error).toBeDefined();
    });
});
