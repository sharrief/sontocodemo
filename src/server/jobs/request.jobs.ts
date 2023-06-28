import { CronJob } from 'cron';
import { DateTime } from 'luxon';
import { Emailer } from '@lib/email';
import env from '@lib/env';
import {
  Document, User, Request,
} from '@entities';
import {
  OperationType, DocumentStage, RequestStatus, BankAccountStatus,
} from '@interfaces';
import { debug, error } from '@log';
import { getConnection } from '@lib/db';

import { GetOptedOutManagerIds } from '@controllers';
import {
  distributionRequestedEmailTemplate, creditRequestedEmailTemplate, Labels as EmailLabels, getErrorEmailTemplate,
} from '@email';
import { Requests } from '@repositories';
import { EntityManager } from 'typeorm';

interface SMTPError extends NodeJS.ErrnoException {
  /** string code identifying the error, for example ‘EAUTH’ is returned when authentication */
  code?: string;
  /** the last response received from the server (if the error is caused by an error response from the server) */
  response?: string;
  /** the numeric response code of the response string (if available) */
  responseCode?: number;
  /** command which provoked an error */
  command?: string;
}

interface SentMessageInfo {
   /** most transports should return the final Message-Id value used with this property */
  messageId: string;
  /** an array of accepted recipient addresses. Normally this array should contain at least one address except when in LMTP mode. In this case the message itself might have succeeded but all recipients were rejected after sending the message. */
  accepted: string[];
  /** an array of rejected recipient addresses. This array includes both the addresses that were rejected before sending the message and addresses rejected after sending it if using LMTP */
  rejected: string[];
  /** if some recipients were rejected then this property holds an array of error objects for the rejected recipients */
  rejectedErrors?: SMTPError[];
  /** the last response received from the server */
  response: string;
  /** how long was envelope prepared */
  envelopeTime: number;
  /** how long was send stream prepared */
  messageTime: number;
  /** how many bytes were streamed */
  messageSize: number;
}

let shouldRun = env.var.SEND_REQUEST_EMAILS;

/**
 * This job watches the requests and sends email notifications at certain stages of the request workflow
 */
export const startWatchNewRequests = async () => {
  /**
   * Cron time cheat sheet
   * Seconds: 0-59
   * Minutes: 0-59
   * Hours: 0-23
   * Day of Month: 1-31 (will be OR'ed with Day of Week)
   * Months: 0-11 (Jan-Dec)
   * Day of Week: 0-6 (Sun-Sat) (will be OR'ed with Day of Month)
   */
  let cronJobSchedule = '0 0 0 1 0 *'; // Midnight on Jan 1st
  if (env.isProduction) cronJobSchedule = '0 0 * * * *'; // The top of every hour
  if (env.isDevelopment) {
    cronJobSchedule = '0 * * * * *'; // Top of every minute
    debug(`env var SEND_REQUEST_EMAILS is ${env.var.SEND_REQUEST_EMAILS}`);
  }
  if (env.var.SEND_REQUEST_EMAILS) {
    const connection = await getConnection();
    if (connection) {
      const entityManager = connection.manager;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define, no-use-before-define
      const watchNewRequests = new CronJob(cronJobSchedule, () => processPendingRequests(490, entityManager));

      watchNewRequests.start();
      debug('Started job watchNewRequests');
    } else {
      error('Could not start job watchNewRequests because no db connection was established');
    }
  }
};
export async function processPendingRequests(authUserId: User['id'], entityManager: EntityManager) {
  try {
    // Runs every minute while testing
    if (!shouldRun) return;
    shouldRun = false;
    debug('Running job watchNewRequests');
    // TODO rewrite all of these loops and maps after moving to mongoDB (or similar document-based DB) from mySQL

    // Begin loop rewrite
    const requestsRepo = entityManager.getCustomRepository(Requests);
    const { requests } = await requestsRepo.find({
      authUserId,
      statuses: [RequestStatus.Pending, RequestStatus.Recurring],
      withBankAccounts: true,
      withBankAccountNumbers: true,
      withManager: true,
      withUser: true,
      withDocuments: true,
      withOperations: true,
    });
    debug(`Found ${requests.length} pending requests`);
    if (requests.length) {
      let numberOfRequestsWithExistingDocuments = 0;
      const Email = new Emailer();
      const documentRepo = entityManager.getRepository(Document);
      const results = await Promise.all(requests.map(async function handlePendingRequestEmailJob(request): Promise<{id: Request['id']; result: string; doc?: Document}> {
        try {
          const {
            id, user, documents, operations, status,
          } = request || {};
          const { manager } = user;
          const exceptions = [];
          if (documents.length) {
            numberOfRequestsWithExistingDocuments += 1;
            return { id, result: 'Request already has a document' };
          }

          if (operations.length && status === RequestStatus.Pending) {
            exceptions.push(`Existing operations exist for request ${request.id}`);
          }
          // create document for request missing DCAF and email admin
          if (exceptions.length) {
            throw new Error(`Did not send email for a request because: ${exceptions.join('; ')}.`);
          }

          if (env.isDevelopment) {
            user.email = 'sharrief@live.com';
          }

          const note = `We've sent you an email confirming your ${request.type} request.`;

          let stage = DocumentStage.Ready;
          if (request.type === OperationType.Credit) {
            stage = DocumentStage.Waiting;
          }

          let emailTemplate: JSX.Element;
          if (request.type === OperationType.Debit) {
            emailTemplate = distributionRequestedEmailTemplate({ request, siteUrl: env.var.SITE_URL, sendBy: DateTime.fromMillis(request.datetime).plus({ month: 1 }).valueOf() });
          } else if (request.type === OperationType.Credit) {
            emailTemplate = creditRequestedEmailTemplate(env.var.SITE_URL, request.id);
          } else {
            const msg = `Could not prepare email for request ${request.id}, as the type of ${request.type} was not among the expected values.`;
            error(msg);
            return { id, result: msg };
          }

          const to = `${user.displayName} <${user.email}>`;
          const cc = `${manager.username} <${manager.email}>`;
          const result: SentMessageInfo = await Email.sendMail({
            to,
            cc,
            subject: EmailLabels.getRequestEmailSubject(request),
            emailTemplate,
            sendingFunction: 'RequestJobs.processPendingRequests',
          });
          debug(`Sent email id ${result.messageId} ${request.id}:${request.amount} to ${to}, cc'd ${cc}`);
          if (!result.messageId) throw new Error(`Received no messageId after attempt to send email to ${to} and ${cc}`);
          const newDoc = documentRepo.create({
            userId: user.id,
            request,
            amount: request.amount,
            email: to,
            month: DateTime.fromMillis(request.datetime).endOf('month').month,
            year: DateTime.fromMillis(request.datetime).endOf('month').year,
            status: note,
            stage,
            publicId: 0,
          });
          return { id, result: 'Created doc and sent email', doc: newDoc };
        } catch (e) {
          error(e);
          Email.sendMail({
            to: env.var.EMAIL_ADMIN,
            subject: EmailLabels.getFailedToProcessJobEmailSubject(request),
            emailTemplate: getErrorEmailTemplate(`The error provided was: ${e}`),
            sendingFunction: 'RequestJobs.requestJobsError',
          });
          return { id: request.id, result: `Error processing request ${e}` };
        }
      }));
      // loop ends
      debug(`Documents already exist for ${numberOfRequestsWithExistingDocuments} of ${requests.length} pending requests.`);
      debug('Finished run watchNewRequests');
      shouldRun = env.var.SEND_REQUEST_EMAILS;
      const docsToSave = results
        .filter(({ doc }) => doc != null).map(({ doc }) => doc);
      await documentRepo.save(docsToSave);
      return;
    }
  } catch (e) {
    error(e);
  }
}
