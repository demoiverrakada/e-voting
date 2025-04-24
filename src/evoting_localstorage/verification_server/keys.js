require('dotenv').config();

module.exports = {
  mongoUrl: `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`,
  jwtkey: process.env.JWT_KEY,
};