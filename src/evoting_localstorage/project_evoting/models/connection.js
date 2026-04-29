const mongoose = require('mongoose');
const { mongoUrl } = require('../keys');

let dbConnection;

if (process.env.NODE_ENV === 'test') {
    dbConnection = mongoose.connection;
} else {
    dbConnection = mongoose.createConnection(mongoUrl);
}

dbConnection.on('connected', () => {
    if (process.env.NODE_ENV !== 'test') {
        console.log('Connected to MongoDB');
    }
});

dbConnection.on('error', (err) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log('Error connecting to MongoDB', err);
    }
});

module.exports = dbConnection;
