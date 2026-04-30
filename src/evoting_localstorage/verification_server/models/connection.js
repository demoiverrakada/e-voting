const mongoose = require('mongoose');
const { mongoUrl } = require('../keys');

const dbConnection = mongoose.createConnection(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

dbConnection.on('connected', () => {
  console.log('Connected to MongoDB');
});

dbConnection.on('error', (err) => {
  console.log('Error connecting to MongoDB', err);
});

module.exports = dbConnection;
