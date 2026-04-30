/**
 * One-time migration script to drop the unique index on voter_id in the bulletins collection.
 * This is NOT to be run in production startup.
 */

const mongoose = require('mongoose');
const { mongoUrl } = require('../keys');

async function migrate() {
    const dbConnection = mongoose.createConnection(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    dbConnection.on('connected', async () => {
        console.log('Connected to MongoDB');
        
        try {
            await dbConnection.db.collection('bulletins').dropIndex('voter_id_1');
            console.log('Successfully dropped the voter_id unique index');
        } catch (error) {
            console.log('Error dropping index or index does not exist:', error.message);
        } finally {
            await dbConnection.close();
            process.exit(0);
        }
    });

    dbConnection.on('error', (err) => {
        console.error('Error connecting to MongoDB', err);
        process.exit(1);
    });
}

migrate();
