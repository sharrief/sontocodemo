import { CronJob } from 'cron';
import path from 'path';
import fs from 'fs';
import env from '@lib/env';
import { debug, error, info } from '@log';
import { getConnection } from '@lib/db';

/**
 * Reads demodata/prod/sontoco.sql and re-applies it against the live database.
 * Each statement error is caught individually so one bad statement does not abort the run.
 */
async function reseedDatabase() {
  try {
    const sqlFilePath = path.resolve(process.cwd(), 'demodata/prod/sontoco.sql');
    const rawSql = fs.readFileSync(sqlFilePath, 'utf8');

    const connection = await getConnection();
    if (!connection) {
      error('reseedDatabase: no db connection available, skipping reseed');
      return;
    }
    const entityManager = connection.manager;

    const statements = rawSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const allStatements = [
      'SET FOREIGN_KEY_CHECKS=0',
      ...statements,
      'SET FOREIGN_KEY_CHECKS=1',
    ];

    for (const stmt of allStatements) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await entityManager.query(stmt);
      } catch (e) {
        error(`reseedDatabase: error executing statement — ${e}`);
      }
    }

    info('Daily reseed complete');
  } catch (e) {
    error(`reseedDatabase: fatal error — ${e}`);
  }
}

/**
 * Registers a daily cron job that re-applies the demo seed SQL file against the
 * live database. Gated behind the RESEED_DB environment variable.
 *
 * Schedule precedence (6-field, seconds-first format):
 *   1. RESEED_DB_CRON env var (explicit override)
 *   2. Development default: every minute ('0 * * * * *')
 *   3. Production default: midnight UTC daily ('0 0 0 * * *')
 */
export const startDailyReseed = async () => {
  if (!env.var.RESEED_DB) {
    debug('Skipping daily reseed job (RESEED_DB not enabled)');
    return;
  }

  let cronSchedule: string;
  if (env.var.RESEED_DB_CRON) {
    cronSchedule = env.var.RESEED_DB_CRON;
  } else if (env.isDevelopment) {
    cronSchedule = '0 * * * * *'; // every minute in development
  } else {
    cronSchedule = '0 0 0 * * *'; // midnight UTC daily
  }

  const connection = await getConnection();
  if (!connection) {
    error('Could not start job dailyReseed because no db connection was established');
    return;
  }

  const job = new CronJob(cronSchedule, reseedDatabase);
  job.start();
  debug(`Started job dailyReseed (schedule: ${cronSchedule})`);
};
