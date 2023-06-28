/* eslint-disable import/first */
import { mocked } from 'ts-jest/utils';
import 'reflect-metadata';

jest.mock('nodemailer');
jest.mock('nodemailer/lib/mailer');
import nodemailer, { Transport, SentMessageInfo } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import {
  User, Request,
  Operation,
  BankDatum, Document,
} from '@entities';
import { RequestStatus } from '@interfaces';

jest.mock('@controllers');
import * as Controllers from '@controllers';
import { processPendingRequests } from '@jobs';

jest.mock('@email');
import * as Email from '@email';

jest.mock('@lib/db');
import * as db from '@lib/db';

jest.mock('@log');
import '@server/lib/log';
import {
  Connection, ConnectionOptions, createConnection, EntityManager, QueryRunner, Repository,
} from 'typeorm';
import { Requests } from '@repositories';
import env from '@server/lib/env';
import {
  createSaveAndGetTestBankAccountData, createSaveAndGetTestDocumentData, createSaveAndGetTestOperationsData, createSaveAndGetTestRequestData, createSaveAndGetTestUserData,
} from '../repositories/sampleData';

jest.setTimeout(60000);

const mockMail = mocked(Mail, true);
mockMail.prototype.sendMail.mockImplementation(async (input: SentMessageInfo) => ({ messageId: `${input.to}` }));
const mockNodemailer = mocked(nodemailer, true);
mockNodemailer.createTransport.mockImplementation((input: Transport) => new Mail(input));

const mockedControllers = mocked(Controllers, true);

const { creditRequestedEmailTemplate, distributionRequestedEmailTemplate }: {
  creditRequestedEmailTemplate: typeof Email.creditRequestedEmailTemplate;
  distributionRequestedEmailTemplate: typeof Email.distributionRequestedEmailTemplate;
} = jest.requireActual('@email');

let connection: Connection;
let queryRunner: QueryRunner;
let entityManager: EntityManager;

const { DBConfigTest }: {
  DBConfigTest: typeof db.DBConfigTest;
} = jest.requireActual('@lib/db');
const mockedConnection = mocked(db.getConnection, true);
mockedConnection.mockImplementation(async () => queryRunner.manager as unknown as Connection);

describe('Request jobs', () => {
  // Setup test user data
  let usersRepo: Repository<User>;
  let requestsRepo: Repository<Request>;
  let operationsRepo: Repository<Operation>;
  let requestsCustomRepo: Requests;
  let bankDataRepo: Repository<BankDatum>;
  let documentsRepo: Repository<Document>;
  const allUsers: User[] = [];
  let administrator: User;
  let manager2: User;
  let client2: User;
  const allRequests: Request[] = [];
  let creditPending: Request;
  let creditPending2: Request;
  let debitPending: Request;
  let debitPending2: Request;
  let debitRecurring: Request;
  let clientBankData: BankDatum;
  let initialRequestsToBeEmailed: Request[] = [];
  let initialCountOfRequestsToBeEmailed = 0;

  async function getRequestsToBeEmailed() {
    const allPendingRecurringRequests = (await requestsCustomRepo.find({
      authUserId: administrator.id,
      statuses: [RequestStatus.Pending, RequestStatus.Recurring],
      withDocuments: true,
      withOperations: true, // TODO add test that req is not processed if op exists
      withBankAccounts: true,
      withManager: true,
      withUser: true,
    })).requests;
    const requestsToBeEmailed = allPendingRecurringRequests
      .filter((request) => {
        if (
          (request.status === RequestStatus.Pending
        && !request.documents.filter(({ deleted }) => !deleted).length
        && !request.operations.filter(({ deleted }) => !deleted).length)
        || (request.status === RequestStatus.Recurring
        && !request.documents.filter(({ deleted }) => !deleted).length)) {
          return true;
        }
        return false;
      });
    return requestsToBeEmailed;
  }

  beforeAll(async () => {
    try {
      connection = await createConnection(DBConfigTest as ConnectionOptions);
      queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      entityManager = queryRunner.manager;
      usersRepo = entityManager.getRepository(User);
      requestsRepo = entityManager.getRepository(Request);
      requestsCustomRepo = entityManager.getCustomRepository(Requests);
      bankDataRepo = entityManager.getRepository(BankDatum);
      documentsRepo = entityManager.getRepository(Document);
      operationsRepo = entityManager.getRepository(Operation);
      const userData = await createSaveAndGetTestUserData(usersRepo);
      allUsers.push(...userData.allUsers);
      administrator = userData.administrator;
      manager2 = userData.manager2;
      client2 = userData.client2;
      jest.spyOn(mockedControllers, 'GetOptedOutManagerIds').mockReturnValue([manager2.id]);
      const requestData = await createSaveAndGetTestRequestData(requestsRepo);
      allRequests.push(...requestData.allRequests);
      ({
        creditPending, debitPending, creditPending2, debitPending2, debitRecurring,
      } = requestData);
      const bankDataData = await createSaveAndGetTestBankAccountData(bankDataRepo);
      clientBankData = bankDataData.bankDataClient;
      await createSaveAndGetTestOperationsData(operationsRepo);
      await createSaveAndGetTestDocumentData(documentsRepo);

      //* setup and run the job once before all tests */
      initialRequestsToBeEmailed = (await getRequestsToBeEmailed());
      initialCountOfRequestsToBeEmailed = initialRequestsToBeEmailed.length;
      await processPendingRequests(administrator.id, entityManager);

      return true; // must return something for Jest to wait before running tests
    } catch (e) {
      return e;
    }
  });
  afterAll(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    if (connection) await connection.close();
  });

  jest.spyOn(Email, 'creditRequestedEmailTemplate')
    .mockImplementation(creditRequestedEmailTemplate);
  jest.spyOn(Email, 'distributionRequestedEmailTemplate')
    .mockImplementation(distributionRequestedEmailTemplate);

  it('Calls nodemailer', async () => {
    expect(mockNodemailer.createTransport).toBeCalledTimes(1);
  });

  it('Sends wire information emails for new credits on DCAF procedure', async () => {
    //* the database rounds the datetime, so mimic that in the sample data
    // TODO move this to the sample data file
    creditPending.datetime = Math.round(creditPending.datetime / 1000) * 1000;

    //* confirm the job sends the email using the correct template
    const htmlTemplate = creditRequestedEmailTemplate(env.var.SITE_URL);
    expect(mockMail.prototype.sendMail).toHaveBeenCalledWith({
      from: 'No-Reply Auto-Email <no-reply@sontocoholdings.com>',
      to: `${creditPending.user.displayName} <${creditPending.user.email}>`,
      replyTo: 'Accounts Administration <admin@sontocoholdings.com>',
      bcc: undefined,
      cc: `${creditPending.user.manager.displayName} <${creditPending.user.manager.email}>`,
      subject: `${creditPending.type} request #${creditPending.id}`,
      htmlTemplate,
    });
  });
  it('Sends distribution request confirmation emails for new distribution requests on DCAF procedure', async () => {
    //* the database rounds the datetime, so mimic that in the sample data
    // TODO move this to the sample data file
    debitPending.datetime = Math.round(debitPending.datetime / 1000) * 1000;

    //* confirm the job correctly creates the email using the correct template
    const htmlTemplate = distributionRequestedEmailTemplate({
      request: debitPending,
      siteUrl: env.var.SITE_URL,
      sendBy: debitPending.datetime + 2678400000, // 31 days
    });
    expect(mockMail.prototype.sendMail).toHaveBeenCalledWith({
      from: 'No-Reply Auto-Email <no-reply@sontocoholdings.com>',
      to: `${debitPending.user.displayName} <${debitPending.user.email}>`,
      replyTo: 'Accounts Administration <admin@sontocoholdings.com>',
      cc: `${debitPending.user.manager.displayName} <${debitPending.user.manager.email}>`,
      subject: `${debitPending.type} request #${debitPending.id}`,
      htmlTemplate,
    });
  });
  it('Sends distribution request confirmation emails for recurring distribution requests on DCAF procedure', async () => {
    // TODO move this to the sample data file
    debitRecurring.datetime = Math.round(debitRecurring.datetime / 1000) * 1000;

    //* confirm the job correctly creates the email using the correct template
    const emailTemplate = distributionRequestedEmailTemplate({
      request: debitRecurring,
      siteUrl: env.var.SITE_URL,
      sendBy: debitRecurring.datetime + 2678400000, // 31 days
    });
    expect(mockMail.prototype.sendMail).toHaveBeenCalledWith({
      from: 'No-Reply Auto-Email <no-reply@sontocoholdings.com>',
      to: `${debitRecurring.user.displayName} <${debitRecurring.user.email}>`,
      replyTo: 'Accounts Administration <admin@sontocoholdings.com>',
      cc: `${debitRecurring.user.manager.displayName} <${debitRecurring.user.manager.email}>`,
      subject: `${debitRecurring.type} request #${debitRecurring.id}`,
      emailTemplate,
    });
  });
});
