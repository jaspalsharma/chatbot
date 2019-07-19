const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format

// Initialize logging
const logFormat = printf(info => {
  return `${info.level.toUpperCase()}: ${info.message}`; //`${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`;
});

const oLogger = createLogger({
  format: combine(
    timestamp(),
    logFormat
  ),
	transports: [
		new transports.Console()/*,
		new (winston.transports.File)({ filename: 'bot_server.log' })*/
	]
});

module.exports = oLogger;
