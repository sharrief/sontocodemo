/* eslint-disable no-console */
import * as db from '@lib/db';
import {
  Users, Requests, AccountsQuery, RequestFindParameters,
} from '@repositories';
import { Labels } from '@repositories/labels';
import {
  Request, Operation, Document, User, BankDatum,
} from '@entities';
import {
  RequestStatus,
} from '@interfaces';
import {
  Connection, ConnectionOptions, createConnection, EntityManager, QueryRunner, Repository,
} from 'typeorm';
import { mocked } from 'ts-jest/utils';
import { DateTime } from 'luxon';
import {
  createSaveAndGetTestBankAccountData, createSaveAndGetTestDocumentData, createSaveAndGetTestOperationsData, createSaveAndGetTestRequestData, createSaveAndGetTestUserData,
} from './sampleData';

let connection: Connection;
let entityManager: EntityManager;
let queryRunner: QueryRunner;
jest.mock('@lib/db');
const { DBConfigTest }: {
  DBConfigTest: typeof db.DBConfigTest;
} = jest.requireActual('@lib/db');
const mockedConnection = mocked(db.getConnection, true);
mockedConnection.mockImplementation(async () => entityManager as unknown as Connection);

describe('Users repository', () => {
  let customUsersRepo: Users;
  let customRequestsRepo: Requests;
  let usersRepo: Repository<User>;
  let requestsRepo: Repository<Request>;
  let operationsRepo: Repository<Operation>;
  let documentsRepo: Repository<Document>;
  let bankDataRepo: Repository<BankDatum>;
  const allUsers: User[] = [];
  let client: User;
  let client2: User;
  let administrator: User;
  let manager: User;
  const allRequests: Request[] = [];
  const year = 2020;
  const month = 10;
  const { day } = DateTime.fromObject({ year, month }).endOf('month');
  let creditPending: Request;
  let requestPosted: Request;
  let requestDeclined: Request;
  const allOperations: Operation[] = [];
  let operationPosted: Operation;
  const allDocuments: Document[] = [];
  let documentPosted: Document;
  const allBankData: BankDatum[] = [];
  let bankDataClient: BankDatum;
  beforeAll(async () => {
    try {
      const config = DBConfigTest;
      connection = await createConnection(config as ConnectionOptions);
      queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      entityManager = queryRunner.manager;
      customUsersRepo = entityManager.getCustomRepository(Users);
      customRequestsRepo = entityManager.getCustomRepository(Requests);
      usersRepo = entityManager.getRepository(User);
      requestsRepo = entityManager.getRepository(Request);
      operationsRepo = entityManager.getRepository(Operation);
      documentsRepo = entityManager.getRepository(Document);
      bankDataRepo = entityManager.getRepository(BankDatum);
      const {
        allUsers: aU, administrator: ad, manager: m1, client: c1, client2: c2,
      } = await createSaveAndGetTestUserData(usersRepo);
      allUsers.push(...aU);
      administrator = ad;
      manager = m1;
      client = c1;
      client2 = c2;
      // Requests test data
      const requestData = await createSaveAndGetTestRequestData(requestsRepo);
      allRequests.push(...requestData.allRequests);
      creditPending = requestData.creditPending;
      requestPosted = requestData.requestPosted;
      requestDeclined = requestData.requestDeleted;
      // Operations test data
      const operationData = await createSaveAndGetTestOperationsData(operationsRepo);
      operationPosted = operationData.operationPosted;
      allOperations.push(...operationData.allOperations);
      // Documents test data
      const documentData = await createSaveAndGetTestDocumentData(documentsRepo);
      documentPosted = documentData.documentPosted;
      allDocuments.push(...documentData.allDocuments);
      const bankDataData = await createSaveAndGetTestBankAccountData(bankDataRepo);
      allBankData.push(...bankDataData.allBankData);
      bankDataClient = bankDataData.bankDataClient;
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  });
  afterAll(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    if (connection) await connection.close();
  });

  describe('find accounts and requests', () => {
    async function getAccounts(user: User, query?: Partial<AccountsQuery>) {
      return customUsersRepo.accounts({ authUserId: user.id, ...query });
    }
    it('doesn\'t send requests if non are requested', async () => {
      const [account] = await getAccounts(client);
      expect(account).not.toHaveProperty('requests');
      const [account2] = await getAccounts(client, { requests: {} });
      expect(account2).not.toHaveProperty('requests');
    });
    it('returns Request objects', async () => {
      const [account] = await getAccounts(client, { requests: { all: true } });
      const request = account.requests
        .reduce((prev, curr) => (curr.id === creditPending.id ? curr : prev));
      expect(request).toHaveProperty('amount', creditPending.amount);
      expect(request).toHaveProperty('status', creditPending.status);
    });
    it('allows a client to view non-deleted requests', async () => {
      const [account] = await getAccounts(client, { requests: { all: true } });
      expect(account.requests).toHaveLength(allRequests
        .filter(({ status, userId }) => userId === account.id && status !== RequestStatus.Deleted).length);
    });
    it('allows a client to filter requests by status', async () => {
      const [account] = await getAccounts(client, { requests: { status: RequestStatus.Declined } });
      expect(account.requests).toHaveLength(1);
      expect(account.requests[0].status).toBe(RequestStatus.Declined);
    });
    it('allows an admin to view all non-deleted client requests', async () => {
      const accounts = await getAccounts(administrator, { requests: { all: true } });
      const requests = accounts.reduce(
        (requestArray, account) => (
          requestArray.concat(account.requests)
        ),
       [] as Request[],
      );
      expect(requests).toHaveLength(allRequests
        .filter(({ status }) => status !== RequestStatus.Deleted).length);
    });
    it('allows a manager to view all non-deleted client requests', async () => {
      const accounts = await getAccounts(manager, { requests: { all: true } });
      const requests = accounts.reduce(
        (requestArray, account) => (
          requestArray.concat(account.requests)
        ),
       [] as Request[],
      );
      expect(requests).toHaveLength(allRequests
        .filter(({ status, user }) => user.fmId === manager.id && status !== RequestStatus.Deleted).length);
    });
    it('loads associated operations', async () => {
      const [account] = await getAccounts(client, { requests: { all: true } });
      const { requests } = account;
      const operations = requests.reduce((ops, req) => ops.concat(req.operations), [] as Operation[]);
      expect(operations.length).toBeGreaterThan(0);
      expect(operations).toHaveLength(allOperations
        .filter(({ userId, deleted, request }) => request && !deleted && account.id === userId).length);
      const [operation] = allOperations;
      expect(operation).toHaveProperty('amount', operationPosted.amount);
      expect(operation).toHaveProperty('year', operationPosted.year);
      expect(operation).toHaveProperty('month', operationPosted.month);
      expect(operation).toHaveProperty('day', operationPosted.day);
      expect(operation).toHaveProperty('wireConfirmation', operationPosted.wireConfirmation);
    });
    it('loads associated request documents', async () => {
      const [account] = await getAccounts(client, { requests: { all: true } });
      const { requests } = account;
      const documents = requests.reduce((docs, req) => docs.concat(req.documents), [] as Document[]);
      expect(documents).toHaveLength(allDocuments
        .filter(({ userId, deleted }) => !deleted && userId === account.id)
        .length);
      const [document] = documents.filter(({ operationId }) => operationId === requestPosted.id);
      expect(document).toHaveProperty('amount', documentPosted.amount);
      expect(document).toHaveProperty('status', documentPosted.status);
      expect(document).toHaveProperty('stage', documentPosted.stage);
      expect(document).toHaveProperty('documentLink', documentPosted.documentLink);
      expect(document).toHaveProperty('lastUpdated', documentPosted.lastUpdated);
    });
    it('loads associated preferred user bank data', async () => {
      const [account] = await getAccounts(client, { requests: { all: true } });
      const { bankAccounts } = account;
      expect(bankAccounts).toHaveLength(allBankData.filter(({ preferred }) => preferred).length);
      const bankData = bankAccounts.find(({ preferred, userId }) => preferred && userId === bankDataClient.userId);
      expect(bankData).toHaveProperty('accountEnding', bankDataClient.accountEnding);
      expect(bankData).toHaveProperty('accountName', bankDataClient.accountName);
      expect(bankData).toHaveProperty('DCAF', bankDataClient.DCAF);
    });
  });

  describe('findByStatus', () => {
    async function getRequests(user: User, query?: Partial<RequestFindParameters>) {
      return (await customRequestsRepo.find({ authUserId: user.id, ...query })).requests;
    }
    it('allows an admin to access all non-deleted requests', async () => {
      const requests = await getRequests(administrator);
      expect(requests).toHaveLength(allRequests
        .filter(({ status }) => status !== RequestStatus.Deleted).length);
    });
    it('allows a user to access their non-deleted requests', async () => {
      const requests = await getRequests(client, { withUser: true });
      expect(requests).toHaveLength(allRequests
        .filter(({ userId, status }) => userId === client.id && status !== RequestStatus.Deleted).length);
      const [request] = requests;
      expect(request).toHaveProperty('user');
      expect(request.user).toHaveProperty('id', client.id);
    });
    it('includes the documents, operations, and bank accounts for each request', async () => {
      const requests = await getRequests(client, {
        withDocuments: true,
        withOperations: true,
        withBankAccounts: true,
      });
      expect(requests.length).toBeGreaterThan(0);
      expect(requests).toHaveLength(allRequests
        .filter(({ userId, status }) => (
          status !== RequestStatus.Deleted
          && userId === client.id
        )).length);
      const postedRequest = requests
        .reduce((prev, curr) => (curr.id === requestPosted.id ? curr : prev));
      const { documents, operations, user: { bankAccounts } } = postedRequest;
      expect(documents).toBeDefined();
      expect(documents.length).toBeGreaterThan(0);
      expect(documents).toHaveLength(allDocuments
        .filter(({ userId, operationId }) => (
          userId === client.id
          && operationId === postedRequest.id)).length);
      expect(operations).toBeDefined();
      expect(operations.length).toBeGreaterThan(0);
      expect(operations).toHaveLength(allOperations
        .filter(({ userId, requestId }) => (
          userId === client.id
          && requestId === postedRequest.id
        )).length);
      expect(bankAccounts).toBeDefined();
      expect(bankAccounts.length).toBeGreaterThan(0);
      expect(bankAccounts).toHaveLength(allBankData
        .filter(({ userId }) => userId === client.id).length);
    });
  });
  // Layer of indirection here to minimize impact on test of future API changes
  async function submitRequest(user: User, amount: Request['amount'], recurring?: boolean, accountNumber?: User['accountNumber']) {
    const result = await customRequestsRepo.handleRequestSubmission({
      authUserId: user.id,
      accountNumber: accountNumber || user.accountNumber,
      amount,
      recurring,
    });
    if (result.request) { allRequests.push(result.request); }
    return result;
  }
  async function updateRequest(user: User, id: Request['id'], status?: Request['status'], amount?: Request['amount'], wireConfirmation?: Request['wireConfirmation']) {
    return customRequestsRepo.handleRequestUpdate({
      authUserId: user.id,
      id,
      status,
      amount,
      wireConfirmation,
    });
  }
  async function postRequest({ id: authUserId }: User, id: Request['id'], wireAmount: number, adjustment: number, y: Operation['year'], m: Operation['month']) {
    const result = await customRequestsRepo.handleRequestPost({
      authUserId, id, wireAmount, adjustment, year: y, month: m,
    });
    if (result.request) allRequests.push(result.request);
    return result;
  }
  describe('handle request submission', () => {
    function expectToHaveNonZeroIdAndDatetime(request: Request) {
      expect(request).toHaveProperty('id');
      expect(request.id).toBeGreaterThan(0);
      expect(request).toHaveProperty('datetime');
      expect(request.datetime).toBeGreaterThan(0);
    }
    const expectedRequest = {
      status: RequestStatus.Pending,
      amount: 100,
      userId: 0,
      // user: {
      //   accountNumber: '',
      //   id: 0,
      // },
      admin: false,
    };
    beforeAll(async () => {
      expectedRequest.userId = client.id;
      // expectedRequest.user = { accountNumber: client.accountNumber, id: client.id };
    });
    it('returns an error when provided an invalid account number', async () => {
      const invalidClient = new User();
      invalidClient.accountNumber = 'test';
      const { request, error } = await submitRequest(invalidClient, 500);
      expect(error).not.toBeNull();
      expect(request).toBeUndefined();
    });
    it('allows a client to submit a request', async () => {
      const amount = 500;
      const { request, error } = await submitRequest(client, amount);
      expect(error).toBeUndefined();
      expectToHaveNonZeroIdAndDatetime(request);
      // TODO revisit usage of toMatchObject once test data has been formalized
      expect(request).toMatchObject({ ...expectedRequest, amount: 500 });
    });
    it('allows a client to submit a recurring request', async () => {
      const amount = 500;
      const { request, error } = await submitRequest(client, amount, true);
      const status = RequestStatus.Recurring;
      expect(error).toBeUndefined();
      expectToHaveNonZeroIdAndDatetime(request);
      expect(request).toMatchObject({ ...expectedRequest, amount, status });
    });
    it('allows an admin to submit requests', async () => {
      const amount = 100;
      const { request, error } = await submitRequest(administrator, amount, false, client.accountNumber);
      const admin = true;
      expect(error).toBeUndefined();
      expectToHaveNonZeroIdAndDatetime(request);
      expect(request).toMatchObject({ ...expectedRequest, amount, admin });
    });
    it('allows a manager to submit requests', async () => {
      const amount = 200;
      const { request, error } = await submitRequest(manager, amount, false, client.accountNumber);
      expect(error).toBeUndefined();
      expectToHaveNonZeroIdAndDatetime(request);
      expect(request).toMatchObject({ ...expectedRequest, amount });
    });
  });
  describe('handle request update', () => {
    it('returns an error when provided an invalid requestId', async () => {
      const { request, error } = await updateRequest(client, -1);
      expect(request).toBeUndefined();
      expect(error).not.toBeFalsy();
    });
    it('returns an error when the user does not have access to the request', async () => {
      const { request, error } = await updateRequest(client2, creditPending.id);
      expect(request).toBeUndefined();
      expect(error).not.toBeFalsy();
    });
    it('returns an error when a user tries to change the request', async () => {
      const { request, error } = await updateRequest(client, creditPending.id);
      expect(request).toBeUndefined();
      expect(error).not.toBeFalsy();
    });
    it('returns an error when an admin attempts to update the amount of an approved request', async () => {
      const { request: updatedRequest, message, error } = await updateRequest(administrator, requestPosted.id, undefined, 400);
      expect(updatedRequest).toBeUndefined();
      expect(message).not.toBeFalsy();
      expect(error).toBeFalsy();
    });
    it('allows an admin to update the amount and status of a pending request', async () => {
      const initialAmount = 250;
      const { request: requestToUpdate } = await submitRequest(client, initialAmount, false, client.accountNumber);
      const { id } = requestToUpdate;
      expect(requestToUpdate).toMatchObject({
        amount: initialAmount,
        status: RequestStatus.Pending,
      });
      const status = RequestStatus.Declined;
      const amount = 500;
      const { request, error } = await updateRequest(administrator, id, status, amount);
      expect(error).toBeUndefined();
      expect(request).toMatchObject({
        id,
        amount,
        status,
      });
    });
  });
  describe('handle request post', () => {
    it('returns an error if the request is not pending or recurring', async () => {
      const { request: declinedRequest, operation: o1, error: e1 } = await postRequest(administrator, requestDeclined.id, requestDeclined.amount, 0, 2020, 11);
      expect(declinedRequest).toBeUndefined();
      expect(o1).toBeUndefined();
      expect(e1).toBe(Labels.CannotPostBecauseStatus(requestDeclined));
      const { request: approvedRequest, operation: o2, error: e2 } = await postRequest(administrator, requestPosted.id, requestPosted.amount, 0, 2020, 11);
      expect(approvedRequest).toBeUndefined();
      expect(o2).toBeUndefined();
      expect(e2).toBe(Labels.CannotPostBecauseStatus(requestPosted));
    });
    describe('pending requests', () => {
      it('returns an error when attempting to post a pending request that has already been posted', async () => {
        const { request: postedRequest } = await submitRequest(administrator, 50, false, client.accountNumber);
        const { operation: postedOperation } = await postRequest(administrator, postedRequest.id, postedRequest.amount, 0, year, month);
        await updateRequest(administrator, postedRequest.id, RequestStatus.Pending);
        const { error, operation, request } = await postRequest(administrator, postedRequest.id, postedRequest.amount, 0, year, month);
        expect(request).toBeUndefined();
        expect(operation).toBeUndefined();
        expect(error).toBe(Labels.AlreadyPostedRequest(postedRequest, postedOperation));
      });
      it('allows an admin to post a pending request', async () => {
        const { request: requestToPost } = await submitRequest(client, 500);
        const postResult = await postRequest(administrator, requestToPost.id, requestToPost.amount, 0, year, month);
        const { request: postedRequest, operation, error } = postResult;
        const expectedPostedRequest = {
          id: requestToPost.id,
          status: RequestStatus.Approved,
        };
        const expectedOperation = {
          year, month, amount: requestToPost.amount,
        };
        expect(error).toBeUndefined();
        expect(postedRequest).toMatchObject(expectedPostedRequest);
        expect(operation).toMatchObject(expectedOperation);
      });
    });
    describe('recurring requests', () => {
      it('returns an error when attempting to post a recurring request twice to the same year/month', async () => {
        const { request: recurringRequest } = await submitRequest(client, 750, true);
        await postRequest(administrator, recurringRequest.id, recurringRequest.amount, 0, year, month);
        const { request, operation, error } = await postRequest(administrator, recurringRequest.id, recurringRequest.amount, 0, year, month);
        expect(request).toBeUndefined();
        expect(operation).toBeUndefined();
        expect(error).not.toBeFalsy();
      });
      it('allows an admin to post a recurring request', async () => {
        const { request: recurringRequest } = await submitRequest(client, 750, true);
        const { request, operation, error } = await postRequest(administrator, recurringRequest.id, recurringRequest.amount, 0, year, month);
        expect(error).toBeUndefined();
        expect(request).toHaveProperty('status', RequestStatus.Recurring);
        expect(operation.id).not.toBeFalsy();
        expect(operation.user).toEqual(request.user);
        expect(operation.request).toEqual(request);
        expect(operation.amount).toBe(request.amount);
        expect(operation.year).toBe(year);
        expect(operation.month).toBe(month);
        expect(operation.day).toBe(day);
        expect(operation.wireConfirmation).toBe(request.wireConfirmation);
      });
    });
  });
});
