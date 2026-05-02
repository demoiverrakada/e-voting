const { electionSchema } = require('../../validators/electionValidator');

describe('electionValidator', () => {
    test('accepts valid election data', () => {
        const { error } = electionSchema.validate({
            election_id: 1,
            election_name: 'Test Election',
            election_type: 'fptp'
        });
        expect(error).toBeUndefined();
    });

    test('rejects missing election_id', () => {
        const { error } = electionSchema.validate({
            election_name: 'Test Election',
            election_type: 'fptp'
        });
        expect(error).toBeDefined();
    });

    test('rejects missing election_name', () => {
        const { error } = electionSchema.validate({
            election_id: 1,
            election_type: 'fptp'
        });
        expect(error).toBeDefined();
    });

    test('rejects missing election_type', () => {
        const { error } = electionSchema.validate({
            election_id: 1,
            election_name: 'Test Election'
        });
        expect(error).toBeDefined();
    });

    test('rejects invalid election_type', () => {
        const { error } = electionSchema.validate({
            election_id: 1,
            election_name: 'Test Election',
            election_type: 'invalid'
        });
        expect(error).toBeDefined();
    });

    test('rejects long election_name', () => {
        const { error } = electionSchema.validate({
            election_id: 1,
            election_name: 'a'.repeat(201),
            election_type: 'fptp'
        });
        expect(error).toBeDefined();
    });
});
