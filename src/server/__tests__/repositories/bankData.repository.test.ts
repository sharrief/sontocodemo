/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import * as db from '@lib/db';
import {
  BankData,
} from '@repositories';
import {
  User, BankDatum,
} from '@entities';
import {
  Connection, ConnectionOptions, createConnection, EntityManager, QueryRunner, Repository,
} from 'typeorm';
import { mocked } from 'ts-jest/utils';
import { BankAccountStatus, DefaultBankDatum, IReceivingBank } from '@interfaces';
import {
  createSaveAndGetTestBankAccountData, createSaveAndGetTestUserData,
} from './sampleData';

let connection: Connection;
let entityManager: EntityManager;
let queryRunner: QueryRunner;
jest.mock('@lib/db');
const { DBConfigTest } = jest.requireActual('@lib/db');
const mockedConnection = mocked(db.getConnection, true);
mockedConnection.mockImplementation(async () => entityManager as unknown as Connection);

describe('Users repository', () => {
  let customBankDataRepo: BankData;
  let usersRepo: Repository<User>;
  let bankDataRepo: Repository<BankDatum>;
  const allUsers: User[] = [];
  let client: User;
  let administrator: User;
  let director: User;
  let manager: User;
  const allBankData: BankDatum[] = [];
  let Bank1: IReceivingBank;
  let Bank2: IReceivingBank;
  let Bank3: IReceivingBank;
  let newBankDataInput: Partial<BankDatum> = {};
  beforeAll(async () => {
    try {
      const config = DBConfigTest;
      connection = await createConnection(config as ConnectionOptions);
      queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      entityManager = queryRunner.manager;
      customBankDataRepo = entityManager.getCustomRepository(BankData);
      usersRepo = entityManager.getRepository(User);
      bankDataRepo = entityManager.getRepository(BankDatum);
      const {
        allUsers: aU, administrator: ad, director: d, manager: m1, client: c1,
      } = await createSaveAndGetTestUserData(usersRepo);
      allUsers.push(...aU);
      administrator = ad;
      director = d;
      manager = m1;
      client = c1;
      const bankDataData = await createSaveAndGetTestBankAccountData(bankDataRepo);
      allBankData.push(...bankDataData.allBankData);
      Bank1 = bankDataData.Bank1;
      Bank2 = bankDataData.Bank2;
      Bank3 = bankDataData.Bank3;
      newBankDataInput = {
        userId: client.id,
        name: client.name,
        lastName: client.lastname,
        extra: 'Additional extra info',
      };
      return true;
    } catch ({ message }) {
      console.log(message);
      throw new Error(`Could not setup test data: ${message}`);
      return false;
    }
  });
  afterAll(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    if (connection) await connection.close();
  });

  async function create(authUserId: User['id'], bankData: BankDatum) {
    return customBankDataRepo.create(authUserId, bankData, client.accountNumber);
  }

  function getNewBankData() {
    return {
      ...DefaultBankDatum,
      ...newBankDataInput,
    };
  }
  describe('create', () => {
    try {
      it('enables a user to add bank data', async () => {
        const newBankData = getNewBankData();
        const createdBankData = await create(client.id, newBankData);
        expect(createdBankData).toBeDefined();
        expect(createdBankData).toHaveProperty('name', client.name);
        expect(createdBankData).toHaveProperty('lastName', client.lastname);
        expect(createdBankData).toHaveProperty('userId', client.id);
        expect(createdBankData).toHaveProperty('status', BankAccountStatus.Review);
        expect(createdBankData).toHaveProperty('extra', newBankDataInput.extra);
        expect(createdBankData.uuid).toBeDefined();
      });
      it('enables an admin to add bank data', async () => {
        const createdBankData = await create(administrator.id, getNewBankData());
        expect(createdBankData).toBeDefined();
        expect(createdBankData).toHaveProperty('name', client.name);
        expect(createdBankData).toHaveProperty('lastName', client.lastname);
        expect(createdBankData).toHaveProperty('userId', client.id);
        expect(createdBankData).toHaveProperty('status', BankAccountStatus.Validated);
        expect(createdBankData).toHaveProperty('extra', newBankDataInput.extra);
        expect(createdBankData.uuid).toBeDefined();
      });
      it('enables a manager to add bank data', async () => {
        const createdBankData = await create(manager.id, getNewBankData());
        expect(createdBankData).toBeDefined();
        expect(createdBankData).toHaveProperty('name', client.name);
        expect(createdBankData).toHaveProperty('lastName', client.lastname);
        expect(createdBankData).toHaveProperty('userId', client.id);
        expect(createdBankData).toHaveProperty('status', BankAccountStatus.Review);
        expect(createdBankData).toHaveProperty('extra', newBankDataInput.extra);
        expect(createdBankData.uuid).toBeDefined();
      });
    } catch ({ message }) {
      console.log(`Could not run create bankData tests: ${message}`);
    }
  });
  describe('modify bank data', () => {
    const trySetInvalidProp = (authUserId: User['id'], uuid: BankDatum['uuid'], prop: any) => customBankDataRepo.updateBankDataProperty(authUserId, uuid, 'test action', prop);
    const markValidated = (authUserId: User['id'], uuid: BankDatum['uuid']) => customBankDataRepo.validate(authUserId, uuid);
    const setReceivingBank = (authUserId: User['id'], uuid: BankDatum['uuid'], receivingBankId: IReceivingBank['id']) => customBankDataRepo.setReceivingBank(authUserId, uuid, receivingBankId);
    const setDCAFLink = (authUserId: User['id'], uuid: BankDatum['uuid'], DCAF: BankDatum['DCAF']) => customBankDataRepo.setDCAFLink(authUserId, uuid, DCAF);
    const findByUUID = (authUserId: User['id'], uuid: BankDatum['uuid']) => customBankDataRepo.findByUUID(authUserId, uuid, false);
    const sampleDCAF = 'https://sontocoholdings.sharepoint.com';
    const sampleInvalidDCAF = 'https://sontocoholdings.com';
    try {
      it('prevents setting an invalid property', async () => {
        const createdBankData = await create(administrator.id, getNewBankData());
        expect(createdBankData).toHaveProperty('status', BankAccountStatus.Validated);
        await expect(trySetInvalidProp(administrator.id, createdBankData.uuid, { status: BankAccountStatus.Invalid, test: 'test' })).rejects.toThrowError('Failed to test action because an invalid property was specified');
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('status', BankAccountStatus.Validated);
        expect(modifiedBankData).not.toHaveProperty('test');
      });
      it('prevents setting an disallowed property', async () => {
        const createdBankData = await create(administrator.id, getNewBankData());
        expect(createdBankData).toHaveProperty('status', BankAccountStatus.Validated);
        await expect(trySetInvalidProp(administrator.id, createdBankData.uuid, { status: BankAccountStatus.Invalid, id: 456 })).rejects.toThrowError('Failed to test action because an invalid property was specified');
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('status', BankAccountStatus.Validated);
        expect(modifiedBankData).not.toHaveProperty('test');
      });
      it('enables an admin to mark bank data as validated', async () => {
        const createdBankData = await create(client.id, getNewBankData());
        expect(createdBankData).toHaveProperty('status', BankAccountStatus.Review);
        await expect(markValidated(administrator.id, createdBankData.uuid)).resolves.toBeTruthy();
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('status', BankAccountStatus.Validated);
      });
      it('enables a director to mark bank data as validated', async () => {
        const createdBankData = await create(client.id, getNewBankData());
        expect(createdBankData).toHaveProperty('status', BankAccountStatus.Review);
        await expect(markValidated(director.id, createdBankData.uuid)).resolves.toBeTruthy();
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('status', BankAccountStatus.Validated);
      });
      it('prevents a user from marking bank data as validated', async () => {
        const createdBankData = await create(client.id, getNewBankData());
        expect(createdBankData).toHaveProperty('status', BankAccountStatus.Review);
        await expect(markValidated(client.id, createdBankData.uuid)).rejects.not.toBeUndefined();
        const modifiedBankData = await findByUUID(client.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('status', BankAccountStatus.Review);
      });
      it('prevents a manager from marking bank data as validated', async () => {
        const createdBankData = await create(manager.id, getNewBankData());
        expect(createdBankData).toHaveProperty('status', BankAccountStatus.Review);
        await expect(markValidated(manager.id, createdBankData.uuid)).rejects.not.toBeUndefined();
        const modifiedBankData = await findByUUID(manager.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('status', BankAccountStatus.Review);
      });
      it('enables an admin to change the receiving bank', async () => {
        const createdBankData = await create(administrator.id, getNewBankData());
        expect(createdBankData).toHaveProperty('receivingBank', Bank1.bankName);
        await expect(setReceivingBank(administrator.id, createdBankData.uuid, Bank2.id)).resolves.toBeTruthy();
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('receivingBank', Bank2.bankName);
      });
      it('prevents a director from setting an invalid receiving bank', async () => {
        const createdBankData = await create(administrator.id, getNewBankData());
        expect(createdBankData).toHaveProperty('receivingBank', Bank1.bankName);
        await expect(setReceivingBank(director.id, createdBankData.uuid, 'not a real bank' as any)).rejects.toThrowError('Failed to set the receiving bank because the value provided was invalid.');
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('receivingBank', Bank1.bankName);
      });
      it('enables a director to change the receiving bank', async () => {
        const createdBankData = await create(administrator.id, getNewBankData());
        expect(createdBankData).toHaveProperty('receivingBank', Bank1.bankName);
        await expect(setReceivingBank(director.id, createdBankData.uuid, Bank2.id)).resolves.toBeTruthy();
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('receivingBank', Bank2.bankName);
      });
      it('prevents an admin from setting an invalid receiving bank', async () => {
        const createdBankData = await create(administrator.id, getNewBankData());
        expect(createdBankData).toHaveProperty('receivingBank', Bank1.bankName);
        await expect(setReceivingBank(administrator.id, createdBankData.uuid, 'not a real bank' as any)).rejects.toThrowError('Failed to set the receiving bank because the value provided was invalid.');
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('receivingBank', Bank1.bankName);
      });
      it('prevents a user from changing the receiving bank', async () => {
        const createdBankData = await create(client.id, getNewBankData());
        expect(createdBankData).toHaveProperty('receivingBank', Bank1.bankName);
        await expect(setReceivingBank(client.id, createdBankData.uuid, Bank2.id)).rejects.not.toBeUndefined();
        const modifiedBankData = await findByUUID(client.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('receivingBank', Bank1.bankName);
      });
      it('prevents a manager from changing the receiving bank', async () => {
        const createdBankData = await create(manager.id, getNewBankData());
        expect(createdBankData).toHaveProperty('receivingBank', Bank1.bankName);
        await expect(setReceivingBank(manager.id, createdBankData.uuid, Bank2.id)).rejects.not.toBeUndefined();
        const modifiedBankData = await findByUUID(manager.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('receivingBank', Bank1.bankName);
      });

      it('enables an admin or director to change the DCAF link', async () => {
        const createdBankData = await create(administrator.id, getNewBankData());
        expect(createdBankData).toHaveProperty('DCAF', '');
        await expect(setDCAFLink(administrator.id, createdBankData.uuid, sampleDCAF)).resolves.toBeTruthy();
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('DCAF', sampleDCAF);
      });
      it('prevents an admin or director from setting an invalid link', async () => {
        const createdBankData = await create(administrator.id, getNewBankData());
        expect(createdBankData).toHaveProperty('DCAF', '');
        await expect(setDCAFLink(administrator.id, createdBankData.uuid, sampleInvalidDCAF)).rejects.not.toBeUndefined();
        const modifiedBankData = await findByUUID(administrator.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('DCAF', '');
      });
      it('prevents a user from changing the DCAF link', async () => {
        const createdBankData = await create(client.id, getNewBankData());
        expect(createdBankData).toHaveProperty('DCAF', '');
        await expect(setDCAFLink(client.id, createdBankData.uuid, sampleDCAF)).rejects.not.toBeUndefined();
        const modifiedBankData = await findByUUID(client.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('DCAF', '');
      });
      it('prevents a manager from changing the DCAF link', async () => {
        const createdBankData = await create(manager.id, getNewBankData());
        expect(createdBankData).toHaveProperty('DCAF', '');
        await expect(setDCAFLink(manager.id, createdBankData.uuid, sampleDCAF)).rejects.not.toBeUndefined();
        const modifiedBankData = await findByUUID(manager.id, createdBankData.uuid);
        expect(modifiedBankData).toHaveProperty('DCAF', '');
      });
    } catch ({ message }) {
      console.log(`Could not run modify bankData tests: ${message}`);
    }
  });
});
