require('dotenv').config();

module.exports = {
  mongoUrl: process.env.MONGO_URI || `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/test?authSource=admin`,
  jwtkey: process.env.JWT_KEY || 'thwijfejfjefiqjfiqejfkdlsakdodokmfd',
};
/*


*/