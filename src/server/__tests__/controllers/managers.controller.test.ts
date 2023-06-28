/* eslint-disable @typescript-eslint/no-explicit-any */
import * as db from '@lib/db';
import {
  createConnection, Connection, ConnectionOptions, QueryRunner, Repository,
} from 'typeorm';
import { ManagersController } from '@controllers';
import {
  Statement, User, Trade, Operation, Request,
} from '@entities';
import { RoleId } from '@interfaces';
import { mocked } from 'ts-jest/utils';
import { DateTime } from 'luxon';
import { chain } from '@numbers';
import {
  createSaveAndGetTestOperationsData, createSaveAndGetTestRequestData, createSaveAndGetTestStatementData, createSaveAndGetTestUserData,
} from '../repositories/sampleData';

let connection: Connection;
let queryRunner: QueryRunner;
jest.mock('@lib/db');
const { DBConfigTest }: {
  DBConfigTest: typeof db.DBConfigTest;
} = jest.requireActual('@lib/db');
const mockedConnection = mocked(db.getConnection, true);
mockedConnection.mockImplementation(async () => queryRunner.manager as unknown as Connection);
describe('Managers controller', () => {
  let managersController: ManagersController;
  let usersRepo: Repository<User>;
  let operationsRepo: Repository<Operation>;
  let requestsRepo: Repository<Request>;
  let statementsRepo: Repository<Statement>;
  let tradesRepo: Repository<Trade>;
  const allUsers: User[] = [];
  let administrator: User;
  let client: User;
  let manager: User;
  let statements: Statement[] = [];
  let operations: Operation[] = [];
  beforeAll(async () => {
    managersController = new ManagersController();
    connection = await createConnection(DBConfigTest as ConnectionOptions);
    queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    usersRepo = queryRunner.manager.getRepository(User);
    operationsRepo = queryRunner.manager.getRepository(Operation);
    requestsRepo = queryRunner.manager.getRepository(Request);
    statementsRepo = queryRunner.manager.getRepository(Statement);
    tradesRepo = queryRunner.manager.getRepository(Trade);
    const userData = await createSaveAndGetTestUserData(usersRepo);
    await createSaveAndGetTestRequestData(requestsRepo);
    const operationsData = await createSaveAndGetTestOperationsData(operationsRepo);
    const statementData = await createSaveAndGetTestStatementData(statementsRepo, tradesRepo);
    allUsers.push(...userData.allUsers);
    administrator = userData.administrator;
    client = userData.client;
    manager = userData.manager;
    statements = statementData.statements;
    operations = operationsData.allOperations;
    return true;
  });
  afterAll(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    if (connection) await connection.close();
  });
  describe('managersRoute', () => {
    async function getManagersRoute(userId?: number) {
      const request = { user: { authUser: { id: userId } } };
      return managersController.managersRoute(request as any);
    }
    it('returns an error if user is not in the request object', async () => {
      const { error, managers } = await getManagersRoute();
      expect(managers).toBeFalsy();
      expect(error).toBe('An error occurred while loading managers: The user was missing on the request to managersRoute');
    });
    it('returns no managers for a request user without access to managers', async () => {
      const { error, managers } = await getManagersRoute(0);
      expect(managers).toHaveLength(0);
      expect(error).toBeFalsy();
    });
    it('returns no managers for a client user', async () => {
      const { error, managers } = await getManagersRoute(client.id);
      expect(managers).toHaveLength(0);
      expect(error).toBeFalsy();
    });
    it('returns self for a manager', async () => {
      const { error, managers } = await getManagersRoute(manager.id);
      expect(managers).toHaveLength(1);
      const [manager1] = managers;
      expect(manager1.id).toBe(manager.id);
      expect(error).toBeFalsy();
    });
    it('returns the list of all managers when requested by an admin', async () => {
      const { error, managers } = await getManagersRoute(administrator.id);
      expect(error).toBeFalsy();
      expect(managers).toHaveLength(allUsers
        .filter(({ deleted, roleId }) => !deleted && [RoleId.manager, RoleId.director].includes(roleId)).length);
    });
  });
  describe('portfolioBalanceByMonth', () => {
    async function getPortfolioBalances(userId?: number) {
      const request = { user: { authUser: { id: userId } } };
      return managersController.portfolioBalanceByMonth(request as any);
    }
    it('returns an error if userId is missing', async () => {
      const { portfolioBalances, error } = await getPortfolioBalances();
      expect(portfolioBalances).toBeUndefined();
      expect(error).toBe('An error occurred while finding portfolio account statements: Could not query database because no authorized user was specified.');
    });
    it('returns client\'s data for a client user', async () => {
      const { portfolioBalances, error } = await getPortfolioBalances(client.id);
      expect(error).toBeUndefined();
      expect(portfolioBalances).toHaveLength(statements
        .filter(({ userId }) => userId === client.id)
        .length);
      const [line] = portfolioBalances;
      const [statement] = statements
        .filter(({ month, year, userId }) => (userId === client.id && line.month === month && line.year === year));
      const operationTotal = operations
        .filter(({ month, year, userId }) => (userId === client.id && line.month === month && line.year === year))
        .reduce((total, { amount }) => total + amount, 0);
      expect(line.accountNumber).toBe(client.accountNumber);
      expect(line.userId).toBe(client.id);
      expect(chain(line.endBalance)
        .equal(statement.endBalance)
        .done())
        .toBe(true);
      expect(chain(line.gainLoss)
        .equal(statement.gainLoss)
        .done())
        .toBe(true);
      expect(chain(line.netOperations)
        .equal(operationTotal)
        .done())
        .toBe(true);
    });
    it('returns managers client\'s data for a manager user', async () => {
      const { portfolioBalances, error } = await getPortfolioBalances(manager.id);
      expect(error).toBeUndefined();
      const managerClientIds = allUsers
        .filter(({ fmId }) => fmId === manager.id)
        .map(({ id }) => id);
      const sortedStatements = statements
        .sort(({ month: mA, year: yA }, { month: mB, year: yB }) => (
          DateTime.fromFormat(`${mA}-${yA}`, 'M-yyyy') > DateTime.fromFormat(`${mB}-${yB}`, 'M-yyyy') ? -1 : 1
        ));
      const [{ month, year }] = sortedStatements;
      const latestStatementsTotals = statements
        .filter(({ month: m, year: y, userId }) => (managerClientIds.includes(userId) && month === m && year === y))
        .reduce(({ bal, gain }, { endBalance, gainLoss }) => ({ bal: bal + endBalance, gain: gain + gainLoss }), { bal: 0, gain: 0 });
      const latestOperationsTotal = operations
        .filter(({
          month: m, year: y, userId, deleted,
        }) => (!deleted && managerClientIds.includes(userId) && month === m && year === y))
        .reduce((total, { amount }) => (total + amount), 0);
      const latestPortfolioBalance = portfolioBalances
        .filter(({ month: m, year: y }) => (month === m && year === y))
        .reduce(({ endBalance, gainLoss, netOperations }, { endBalance: bal, gainLoss: gain, netOperations: net }) => ({
          endBalance: chain(endBalance).add(bal).done(),
          gainLoss: chain(gainLoss).add(gain).done(),
          netOperations: chain(netOperations).add(net).done(),
        }), { endBalance: 0, gainLoss: 0, netOperations: 0 });
      expect(latestPortfolioBalance.endBalance)
        .toBeAmount(latestStatementsTotals.bal);
      expect(latestPortfolioBalance.gainLoss)
        .toBeAmount(latestStatementsTotals.gain);
      expect(latestPortfolioBalance.netOperations)
        .toBeAmount(latestOperationsTotal);
    });
    it('returns all client\'s data for an admin user', async () => {
      const { portfolioBalances, error } = await getPortfolioBalances(administrator.id);
      expect(error).toBeUndefined();
      const sortedStatements = statements
        .sort(({ month: mA, year: yA }, { month: mB, year: yB }) => (
          DateTime.fromFormat(`${mA}-${yA}`, 'M-yyyy') > DateTime.fromFormat(`${mB}-${yB}`, 'M-yyyy') ? -1 : 1
        ));
      const [{ month, year }] = sortedStatements;
      const latestStatementsTotals = statements
        .filter(({ month: m, year: y }) => (month === m && year === y))
        .reduce(({ bal, gain }, { endBalance, gainLoss }) => ({ bal: bal + endBalance, gain: gain + gainLoss }), { bal: 0, gain: 0 });
      const latestOperationsTotal = operations
        .filter(({ month: m, year: y, deleted }) => (!deleted && month === m && year === y))
        .reduce((total, { amount }) => (total + amount), 0);
      const latestPortfolioBalance = portfolioBalances
        .filter(({ month: m, year: y }) => (month === m && year === y))
        .reduce(({ endBalance, gainLoss, netOperations }, { endBalance: bal, gainLoss: gain, netOperations: net }) => ({
          endBalance: chain(endBalance).add(bal).done(),
          gainLoss: chain(gainLoss).add(gain).done(),
          netOperations: chain(netOperations).add(net).done(),
        }), { endBalance: 0, gainLoss: 0, netOperations: 0 });
      expect(latestPortfolioBalance.endBalance).toBeAmount(latestStatementsTotals.bal);
      expect(latestPortfolioBalance.gainLoss).toBeAmount(latestStatementsTotals.gain);
      expect(latestPortfolioBalance.netOperations).toBeAmount(latestOperationsTotal);
    });
  });
});
