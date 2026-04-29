const winston = require('winston');
const path = require('path');

const level = process.env.LOG_LEVEL || 'info';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  process.env.NODE_ENV === 'production'
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
  }),
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
  }),
];

const logger = winston.createLogger({
  level,
  format,
  transports,
});

module.exports = logger;
