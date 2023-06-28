/* eslint-disable no-console */
import * as db from '@lib/db';
import {
  Documents,
} from '@repositories';
import {
  Request, Document, User, BankDatum,
} from '@entities';
import {
  Connection, ConnectionOptions, createConnection, EntityManager, QueryRunner, Repository,
} from 'typeorm';
import { mocked } from 'ts-jest/utils';
import {
  createSaveAndGetTestBankAccountData, createSaveAndGetTestDocumentData, createSaveAndGetTestRequestData, createSaveAndGetTestUserData,
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
  let customDocumentsRepo: Documents;
  let usersRepo: Repository<User>;
  let requestsRepo: Repository<Request>;
  let documentsRepo: Repository<Document>;
  let bankDataRepo: Repository<BankDatum>;
  const allUsers: User[] = [];
  let client: User;
  let client2: User;
  let administrator: User;
  let manager: User;
  let manager2: User;
  const allRequests: Request[] = [];
  let creditPending: Request;
  let requestDeleted: Request;
  const allDocuments: Document[] = [];
  let documentPosted: Document;
  let documentDeleted: Document;
  const allBankData: BankDatum[] = [];
  beforeAll(async () => {
    try {
      const config = DBConfigTest;
      connection = await createConnection(config as ConnectionOptions);
      queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      entityManager = queryRunner.manager;
      customDocumentsRepo = entityManager.getCustomRepository(Documents);
      usersRepo = entityManager.getRepository(User);
      requestsRepo = entityManager.getRepository(Request);
      documentsRepo = entityManager.getRepository(Document);
      bankDataRepo = entityManager.getRepository(BankDatum);
      const {
        allUsers: aU, administrator: ad, manager: m1, manager2: m2, client: c1, client2: c2,
      } = await createSaveAndGetTestUserData(usersRepo);
      allUsers.push(...aU);
      administrator = ad;
      manager = m1;
      manager2 = m2;
      client = c1;
      client2 = c2;
      const requestData = await createSaveAndGetTestRequestData(requestsRepo);
      allRequests.push(...requestData.allRequests);
      creditPending = requestData.creditPending2WithDoc;
      requestDeleted = requestData.requestDeleted;
      const documentData = await createSaveAndGetTestDocumentData(documentsRepo);
      documentPosted = documentData.documentPosted;
      documentDeleted = documentData.documentDeleted;
      allDocuments.push(...documentData.allDocuments);
      const bankDataData = await createSaveAndGetTestBankAccountData(bankDataRepo);
      allBankData.push(...bankDataData.allBankData);
      // bankDataClient = bankDataData.bankDataClient;
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

  describe('findById', () => {
    async function findById(authUserId: User['id'], documentId: Document['id']) {
      return customDocumentsRepo.findById(authUserId, documentId);
    }
    it('doesn\'t send documents if non match the id', async () => {
      const document = await findById(administrator.id, 0);
      const document2 = await findById(manager.id, 0);
      const document3 = await findById(client.id, 0);
      expect(document).toBeUndefined();
      expect(document2).toBeUndefined();
      expect(document3).toBeUndefined();
    });
    it('doesn\'t send deleted documents', async () => {
      const document = await findById(administrator.id, documentDeleted.id);
      const document2 = await findById(manager.id, documentDeleted.id);
      const document3 = await findById(client.id, documentDeleted.id);
      expect(document).toBeUndefined();
      expect(document2).toBeUndefined();
      expect(document3).toBeUndefined();
    });
    it('allows a client to find documents', async () => {
      const document = await findById(client.id, documentPosted.id);
      expect(document).toBeDefined();
      expect(document).toHaveProperty('id', documentPosted.id);
    });
    it('allows a manager to find documents', async () => {
      const document = await findById(manager.id, documentPosted.id);
      expect(document).toBeDefined();
      expect(document).toHaveProperty('id', documentPosted.id);
    });
    it('doesn\'t allow unathorized access', async () => {
      const document2 = await findById(manager2.id, documentPosted.id);
      const document3 = await findById(client2.id, documentPosted.id);
      expect(document2).toBeUndefined();
      expect(document3).toBeUndefined();
    });
    it('allows an admin to find documents', async () => {
      const document = await findById(administrator.id, documentPosted.id);
      expect(document).toBeDefined();
      expect(document).toHaveProperty('id', documentPosted.id);
    });
  });

  describe('findByRequestId', () => {
    async function findByRequestId(authUserId: User['id'], requestId: Request['id']) {
      const [doc] = await customDocumentsRepo.findByRequestId(authUserId, [requestId]);
      return doc;
    }
    it('doesn\'t send documents if non match the id', async () => {
      const document = await findByRequestId(administrator.id, 0);
      const document2 = await findByRequestId(manager.id, 0);
      const document3 = await findByRequestId(client.id, 0);
      expect(document).toBeUndefined();
      expect(document2).toBeUndefined();
      expect(document3).toBeUndefined();
    });
    it('doesn\'t send deleted documents', async () => {
      const document = await findByRequestId(administrator.id, requestDeleted.id);
      const document2 = await findByRequestId(manager.id, requestDeleted.id);
      const document3 = await findByRequestId(client.id, requestDeleted.id);
      expect(document).toBeUndefined();
      expect(document2).toBeUndefined();
      expect(document3).toBeUndefined();
    });
    it('allows a client to find documents', async () => {
      const document = await findByRequestId(client2.id, creditPending.id);
      expect(document).toBeDefined();
      expect(document).toHaveProperty('operationId', creditPending.id);
    });
    it('allows a manager to find documents', async () => {
      const document = await findByRequestId(manager2.id, creditPending.id);
      expect(document).toBeDefined();
      expect(document).toHaveProperty('operationId', creditPending.id);
    });
    it('doesn\'t allow unauthorized access', async () => {
      const document2 = await findByRequestId(manager.id, creditPending.id);
      const document3 = await findByRequestId(client.id, creditPending.id);
      expect(document2).toBeUndefined();
      expect(document3).toBeUndefined();
    });
    it('allows an admin to find documents', async () => {
      const document = await findByRequestId(administrator.id, creditPending.id);
      expect(document).toBeDefined();
      expect(document).toHaveProperty('operationId', creditPending.id);
    });
  });
});
