import winston from 'winston';
import env from '@lib/env';

const log = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'accounts' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`.
    // - Write all logs error (and below) to `error.log`.
    //
    ...((process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') ? [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ] : []),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
export const debug = (message: string) => !env.isTest && log.log({
  level: 'debug',
  message,
});
export const info = (message: string) => !env.isTest && log.log({
  level: 'http',
  message,
});
export const security = (message: string) => !env.isTest && log.log({
  level: 'warn',
  message,
});
export const error = (message: string) => !env.isTest && log.log({
  level: 'error',
  message,
});
