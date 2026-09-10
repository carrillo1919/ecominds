import { createLogger, format, transports } from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const devFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  const payload = message ?? meta;
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return `${timestamp} ${level}: ${serialized}`;
});

const logger = createLogger({
  level: 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
  },
  format: isProduction
    ? format.combine(format.timestamp(), format.errors({ stack: true }), format.json())
    : format.combine(format.colorize(), format.timestamp(), devFormat),
  transports: [new transports.Console()],
});

export default logger;
