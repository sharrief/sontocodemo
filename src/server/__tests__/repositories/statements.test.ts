/* eslint-disable no-console */
import {
  Operation, Request, Statement, Trade, User,
} from '@entities';
import * as db from '@lib/db';
import {
  AccountsQuery, Statements, GenerateStatementsArguments, Users,
} from '@repositories';
import {
  chain,
} from '@numbers';
import { mocked } from 'ts-jest/utils';
import {
  Connection, ConnectionOptions, createConnection, EntityManager, QueryRunner, Repository,
} from 'typeorm';
import {
  createSaveAndGetTestOperationsData, createSaveAndGetTestRequestData, createSaveAndGetTestStatementData, createSaveAndGetTestUserData,
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
jest.setTimeout(30000);
describe('Users Repository', () => {
  let customUsersRepo: Users;
  let usersRepo: Repository<User>;
  const allUsers: User[] = [];
  let client: User;
  let client2: User;
  let administrator: User;
  let manager: User;
  let requestsRepo: Repository<Request>;
  let operationsRepo: Repository<Operation>;
  let tradesRepo: Repository<Trade>;
  let customStatementsRepo: Statements;
  let statementsRepo: Repository<Statement>;
  const allStatements: Statement[] = [];
  const allOperations: Operation[] = [];
  const allTrades: Trade[] = [];
  beforeAll(async () => {
    const config = DBConfigTest;
    connection = await createConnection(config as ConnectionOptions);
    queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    entityManager = queryRunner.manager;
    customUsersRepo = entityManager.getCustomRepository(Users);
    usersRepo = entityManager.getRepository(User);
    requestsRepo = entityManager.getRepository(Request);
    operationsRepo = entityManager.getRepository(Operation);
    tradesRepo = entityManager.getRepository(Trade);
    customStatementsRepo = entityManager.getCustomRepository(Statements);
    statementsRepo = entityManager.getRepository(Statement);
    const {
      allUsers: aU, administrator: ad, manager: m1, client: c1, client2: c2,
    } = await createSaveAndGetTestUserData(usersRepo);
    allUsers.push(...aU);
    administrator = ad;
    manager = m1;
    client = c1;
    client2 = c2;
    await createSaveAndGetTestRequestData(requestsRepo);
    const { allOperations: aO } = await createSaveAndGetTestOperationsData(operationsRepo);
    allOperations.push(...aO);
    const { statements, trades } = await createSaveAndGetTestStatementData(statementsRepo, tradesRepo);
    allStatements.push(...statements);
    allTrades.push(...trades);
    return { statements, allOperations, trades };
  });
  afterAll(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    if (connection) await connection.close();
    return true;
  });
  describe('find', () => {
    async function getAccounts(query: AccountsQuery) {
      return customUsersRepo.accounts(query);
    }
    it('the sample data calculates statements correctly', async () => {
      expect(allStatements).toBeDefined();
      expect(allStatements).toHaveLength(6);
      expect(allOperations).toHaveLength(8);
      expect(client2).toBeDefined();
      expect(manager).toBeDefined();
      expect(administrator).toBeDefined();
    });
    it('doesn\'t load statements if they are not requested', async () => {
      const [account] = await getAccounts({ authUserId: client.id });
      expect(account).not.toHaveProperty('statements');
    });
    it('returns all not-deleted reports for a user', async () => {
      const accounts = await getAccounts({ authUserId: client.id, statements: { } });
      expect(accounts).toHaveLength(1);
      const [account] = accounts;
      expect(account).toHaveProperty('statements');
      expect(account.statements).toHaveLength(allStatements
        .filter(({ userId }) => userId === client.id).length);
      const hasDeletedStatement = account.statements.reduce((deleted: boolean, statement) => !!statement.deleted || deleted, false);
      expect(hasDeletedStatement).toBe(false);
    });
    it('allows a client to filter statements by year', async () => {
      const [account] = await getAccounts({ authUserId: client.id, statements: { date: { year: 2017 } } });
      expect(account.statements).toHaveLength(allStatements
        .filter(({ userId, year }) => userId === client.id && year === 2017).length);
      const statementYears = account.statements.reduce((years: Map<number, boolean>, statement) => years.set(statement.year, true), new Map<number, boolean>());
      expect(statementYears.size).toBe(1);
      expect(statementYears.get(2017)).toBe(true);
    });
    it('allows a client to filter statements by year and month ', async () => {
      const [account2] = await getAccounts({ authUserId: client2.id, statements: { date: { year: 2017, month: 2 } } });
      expect(account2.statements).toHaveLength(1);
      const [statement] = account2.statements;
      expect(statement).toHaveProperty('year', 2017);
      expect(statement).toHaveProperty('month', 2);
    });
    it('loads associated operations (doesn\'t load deleted)', async () => {
      const [account] = await getAccounts({ authUserId: client.id, statements: { } });
      const { operations } = account;
      expect(allOperations.filter(({ deleted }) => deleted).length).toBeGreaterThan(0);
      expect(operations).toHaveLength(allOperations
        .filter(({ userId, deleted }) => !deleted && userId === client.id).length);
      const [operation] = operations;
      expect(operation).toHaveProperty('amount');
      expect(operation).toHaveProperty('year');
      expect(operation).toHaveProperty('month');
      expect(operation).toHaveProperty('day');
      expect(operation).toHaveProperty('wireConfirmation');
    });
  });
  describe('generate', () => {
    async function generateStatements(genStatementArgs: GenerateStatementsArguments) {
      return customStatementsRepo.generate(genStatementArgs);
    }
    it('throws an error if a client tries to generate statements', async () => {
      const { error } = await generateStatements({
        authUserId: client.id,
        userIds: [client.id],
        monthAndYear: { month: 1, year: 2017 },
      });
      expect(error).toBeTruthy();
    });
    it('regenerates statements', async () => {
      const amount1 = 510;
      const amount2 = 322;
      const amount3 = 0.05;
      const op1 = operationsRepo.create({
        userId: client.id, amount: amount1, month: 1, year: 2017,
      });
      const op2 = operationsRepo.create({
        userId: client.id, amount: amount2, month: 2, year: 2017,
      });
      const op3 = operationsRepo.create({
        userId: client.id, amount: amount3, month: 3, year: 2017,
      });
      await operationsRepo.insert([op1, op2, op3]);
      allOperations.push(op1, op2, op3);
      const result = await generateStatements({
        authUserId: administrator.id,
        userIds: [client.id],
        monthAndYear: { month: 1, year: 2017 },
      });
      const { statements: newStatements, error } = result;
      expect(error).toBeUndefined();
      expect(newStatements).toHaveLength(3);
      const clientStatement1Before = allStatements.find(({ month, year, userId }) => (month === 1 && year === 2017 && userId === client.id));
      const clientStatement1After = newStatements.find(({ month, year, userId }) => (month === 1 && year === 2017 && userId === client.id));
      expect(clientStatement1After.endBalance).toBeAmount(chain(clientStatement1Before.endBalance).add(amount1).done());
      const clientStatement2After = newStatements.find(({ month, year, userId }) => (month === 2 && year === 2017 && userId === client.id));
      expect(clientStatement2After.endBalance).toBeAmount(chain(clientStatement1After.endBalance).add(amount2).add(clientStatement2After.gainLoss).done());
      const clientStatement3After = newStatements.find(({ month, year, userId }) => (month === 3 && year === 2017 && userId === client.id));
      expect(clientStatement3After.endBalance).toBeAmount(chain(clientStatement2After.endBalance)
        .add(allOperations.reduce((total, op) => {
          if (op.month === 3 && op.year === 2017 && !op.deleted) return chain(total).add(op.amount).done();
          return total;
        }, 0))
        .add(clientStatement3After.gainLoss).done());
      const userIds = newStatements.reduce((all, curr) => {
        if (all.includes(curr.userId)) return all;
        return [...all, curr.userId];
      }, [] as number[]);
      expect(userIds).toEqual([client.id]);
    });
  });
});
