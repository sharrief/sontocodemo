import * as db from '@lib/db';
import {
  User,
} from '@entities';
import {
  IUser, IUserEditable, Modality, RoleId, RoleName, UserAccountStatus,
} from '@interfaces';
import { AccountsQuery, Users } from '@repositories';
import { mocked } from 'ts-jest/utils';
import {
  Connection, ConnectionOptions, createConnection, EntityManager, QueryRunner, Repository,
} from 'typeorm';
import { createSaveAndGetTestUserData } from './sampleData';

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
  let usersRepo: Repository<User>;
  let allUsers: Map<User['id'], User>;
  let client: User;
  let client2: User;
  let clientDeleted: User;
  let clientInactive: User;
  let administrator: User;
  let manager: User;
  let manager2: User;
  beforeAll(async () => {
    const config = DBConfigTest;
    connection = await createConnection(config as ConnectionOptions);
    queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    entityManager = queryRunner.manager;
    customUsersRepo = entityManager.getCustomRepository(Users);
    usersRepo = entityManager.getRepository(User);
    const {
      allUsers: aU, administrator: ad, manager: m1, manager2: m2, client: c1, client2: c2, clientDeleted: cd, clientInactive: ci,
    } = await createSaveAndGetTestUserData(usersRepo);
    allUsers = new Map(aU.map((user) => [user.id, user]));
    administrator = ad;
    manager = m1;
    manager2 = m2;
    client = c1;
    client2 = c2;
    clientDeleted = cd;
    clientInactive = ci;
    return aU;
  });
  afterAll(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    if (connection) await connection.close();
  });

  describe('find accounts', () => {
    async function findAccounts(user: User, query?: Partial<AccountsQuery>) {
      return customUsersRepo.accounts({ authUserId: user.id, ...query });
    }
    it('returns no accounts if no authUserId is specified', async () => {
      const accounts = await findAccounts(usersRepo.create());
      expect(accounts).toHaveLength(0);
    });
    it('allows a client to access their account', async () => {
      const accounts = await findAccounts(client);
      expect(accounts.length).toBeGreaterThan(0);
      const numberOfAuthorizedAccounts = Array.from(allUsers.entries())
        .filter(([, { id: userId }]) => userId === client.id).length;
      expect(accounts).toHaveLength(numberOfAuthorizedAccounts);
      const [account] = accounts;
      const clientCopy = { ...client };
      delete clientCopy.manager;
      clientCopy.hashedPassword = '';
      expect(account).toMatchObject(clientCopy);

      const accountsByUserIds = await findAccounts(client, { accounts: { ids: [client.id] } });
      expect(accountsByUserIds).toHaveLength(numberOfAuthorizedAccounts);
      const accountsByAccountNumber = await findAccounts(client, { accounts: { accountNumbers: [client.accountNumber] } });
      expect(accountsByAccountNumber).toHaveLength(numberOfAuthorizedAccounts);
    });
    it('prevents a client from accessing other accounts', async () => {
      const accountIdZero = await findAccounts(client, { accounts: { ids: [client2.id] } });
      expect(accountIdZero).toHaveLength(0);
      const unknownAccount = await findAccounts(client, { accounts: { ids: [1.5] } });
      expect(unknownAccount).toHaveLength(0);
      const managerAccounts = await findAccounts(client, { accounts: { ids: [manager.id] } });
      expect(managerAccounts).toHaveLength(0);
      const whenQueryingSeveralAccounts = await findAccounts(client, { accounts: { ids: [0, client.id, 1.5, client2.id, manager.id, administrator.id, manager2.id] } });
      expect(whenQueryingSeveralAccounts).toHaveLength(1);
      const [clientAccount] = whenQueryingSeveralAccounts;
      const clientCopy = { ...client };
      delete clientCopy.manager;
      clientCopy.hashedPassword = '';
      expect(clientAccount).toMatchObject(clientCopy);
    });
    it('allows an admin to filter accounts by manager id', async () => {
      const m1Accounts = await findAccounts(administrator, { withManager: true, managers: { ids: [manager.id] } });
      expect(m1Accounts.length).toBeGreaterThan(0);
      expect(m1Accounts).toHaveLength(Array.from(allUsers.entries())
        .filter(([, { deleted, fmId }]) => !deleted && fmId === manager.id).length);
      const [{ manager: m1 }] = m1Accounts;
      expect(m1).toHaveProperty('id', manager.id);

      const m2Accounts = await findAccounts(administrator, { withManager: true, managers: { ids: [manager2.id] } });
      expect(m2Accounts.length).toBeGreaterThan(0);
      expect(m2Accounts).toHaveLength(Array.from(allUsers.entries())
        .filter(([, { deleted, fmId }]) => !deleted && fmId === manager2.id).length);
      const [{ manager: m2 }] = m2Accounts;
      expect(m2).toHaveProperty('id', manager2.id);
    });
    it('allows an admin to load the account managers', async () => {
      const accounts = await findAccounts(administrator, { accounts: { roles: [RoleId.manager] } });
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts).toHaveLength(Array.from(allUsers.entries())
        .filter(([, { roleId }]) => roleId === RoleId.manager).length);
    });
  });
  describe('getUserById', () => {
    const getUserById = (args: { authUserId: number; id: number }) => customUsersRepo.getUserById(args);
    it('returns a user when authorized', async () => {
      const user = await getUserById({ authUserId: manager.id, id: client.id });
      expect(user).not.toBeNull();
      expect(user).toHaveProperty('id', client.id);
      const user2 = await getUserById({ authUserId: manager.id, id: manager.id });
      expect(user2).not.toBeNull();
      expect(user2).toHaveProperty('id', manager.id);
    });
    it('returns null when unauthorized', async () => {
      const user = await getUserById({ authUserId: manager2.id, id: client.id });
      expect(user).toBeNull();
    });
  });
  describe('find by email and hashed password', () => {
    async function findByPass(email: string, hashedPassword: string) {
      return customUsersRepo.findByEmailAndHashedPassword(email, hashedPassword);
    }
    it('finds client users', async () => {
      const { id, email, hashedPassword } = client;
      const account = await findByPass(email, hashedPassword);
      expect(account).toHaveProperty('id', id);
    });
    it('finds admin users', async () => {
      const { id, email, hashedPassword } = administrator;
      const account = await findByPass(email, hashedPassword);
      expect(account).toHaveProperty('id', id);
    });
    it('finds manager users', async () => {
      const { id, email, hashedPassword } = manager;
      const account = await findByPass(email, hashedPassword);
      expect(account).toHaveProperty('id', id);
    });
    it('does not find unauthorized users', async () => {
      const { email, hashedPassword } = usersRepo.create({
        email: 'notauser@test.sontocoholdings.com',
        hashedPassword: '123abc',
      });
      const account = await findByPass(email, hashedPassword);
      expect(account).toBeUndefined();
      const account4 = await findByPass('', '');
      expect(account4).toBeUndefined();
      const account2 = await findByPass(null, null);
      expect(account2).toBeUndefined();
      const account3 = await findByPass(undefined, undefined);
      expect(account3).toBeUndefined();
    });
    it('does not find deleted users', async () => {
      const { email, hashedPassword } = clientDeleted;
      const account = await findByPass(email, hashedPassword);
      expect(account).toBeUndefined();
    });
    it('does not allow inactive accounts to sign in', async () => {
      const { email, hashedPassword } = clientInactive;
      const account = await findByPass(email, hashedPassword);
      expect(account).toBeUndefined();
    });
  });
  describe('changeEmail', () => {
    const changeEmail = (authUserId: number, accountNumber: string, email: string) => customUsersRepo.doChangeEmail({ authUserId, accountNumber, email });
    it('allows a manager to change an account email address', async () => {
      const authUserId = manager.id;
      const email = 'changedEmail@test.sontocoholdings.com';
      const { accountNumber, email: emailBefore } = await customUsersRepo.getUserById({ authUserId, id: client.id });
      const {
        message, error, oldEmail, newEmail,
      } = await changeEmail(authUserId, accountNumber, email);
      expect(message).toBeTruthy();
      expect(error).toBeUndefined();
      expect(oldEmail).toBe(emailBefore);
      expect(newEmail).toBe(email);
      const changedAccount = await customUsersRepo.getUserById({ authUserId, id: client.id });
      expect(changedAccount.email).toBe(email);
    });
    it('prevents a client from changing an email address', async () => {
      const authUserId = client.id;
      const email = 'changedEmail@test.sontocoholdings.com';
      const { accountNumber, email: emailBefore } = await customUsersRepo.getUserById({ authUserId, id: client.id });
      const { error } = await changeEmail(authUserId, accountNumber, email);
      expect(error).toBeTruthy();
      const changedAccount = await customUsersRepo.getUserById({ authUserId, id: client.id });
      expect(changedAccount.email).toBe(emailBefore);
    });
  });
  describe('editAccount', () => {
    const editAccount = (authUserId: number, id: number, partialAccount: IUserEditable) => customUsersRepo.doEditAccount({ authUserId, id, partialAccount });
    it('allows a manager to change account information', async () => {
      const authUserId = manager.id;
      const { id } = client;
      const clientBefore = await customUsersRepo.getUserById({ authUserId, id });
      expect(clientBefore.name).toBeDefined();
      const partialAccount: IUserEditable = {
        name: 'Test name',
        lastname: 'Test last name',
        email: 'test email',
        businessEntity: 'Test biz entity',
        fmId: manager2.id,
        obMonth: client.obMonth + 1,
        obYear: client.obYear + 1,
        hasAccountsAccess: !client.hasAccountsAccess,
      };
      const {
        message, error,
      } = await editAccount(authUserId, id, partialAccount);
      expect(error).toBeUndefined();
      expect(message).toBeTruthy();
      const updatedClient = await customUsersRepo.getUserById({ authUserId: manager2.id, id });
      expect(updatedClient.name).toBe(partialAccount.name);
      expect(updatedClient.lastname).toBe(partialAccount.lastname);
      expect(updatedClient.email).toBe(partialAccount.email);
      expect(updatedClient.businessEntity).toBe(partialAccount.businessEntity);
      expect(updatedClient.fmId).toBe(partialAccount.fmId);
      expect(updatedClient.hasAccountsAccess).toBe(partialAccount.hasAccountsAccess);
    });
    it('prevents a client from changing account information', async () => {
      const authUserId = client2.id;
      const { id } = client2;
      const partialAccount: IUserEditable = {
        name: 'Test name',
        lastname: 'Test last name',
        email: 'test email',
        businessEntity: 'Test biz entity',
        fmId: manager2.id,
        obMonth: client2.obMonth + 1,
        obYear: client2.obYear + 1,
        hasAccountsAccess: !client.hasAccountsAccess,
      };
      const {
        error,
      } = await editAccount(authUserId, id, partialAccount);
      expect(error).toBeTruthy();
      const unchangedUser = await customUsersRepo.getUserById({ authUserId, id });
      expect(unchangedUser.name).toBe(client2.name);
      expect(unchangedUser.lastname).toBe(client2.lastname);
      expect(unchangedUser.email).toBe(client2.email);
      expect(unchangedUser.businessEntity).toBe(client2.businessEntity);
      expect(unchangedUser.fmId).toBe(client2.fmId);
      expect(unchangedUser.obMonth).toBe(client2.obMonth);
      expect(unchangedUser.obYear).toBe(client2.obYear);
      expect(unchangedUser.hasAccountsAccess).toBe(client2.hasAccountsAccess);
    });
  });
  describe('an admin or director', () => {
    it('can open an account without an application', async () => {
      const newUser: Partial<IUser> = {
        name: 'Bob',
        lastname: 'James',
        businessEntity: 'Bob James LLC',
        email: 'bob.james@sontocoholdings.com',
        fmId: manager.id,
        obMonth: 11,
        obYear: 2021,
      };
      const newAccount = await customUsersRepo.openAccount(
        administrator.id,
        newUser.obMonth,
        newUser.obYear,
        newUser.email,
        newUser.name,
        newUser.lastname,
        newUser.businessEntity,
        newUser.fmId,
      );
      expect(newAccount.id).toBeGreaterThan(0);
      expect(newAccount).toHaveProperty('fmId', manager.id);
      expect(newAccount).toHaveProperty('createdId', administrator.id);
      expect(newAccount).toHaveProperty('name', newUser.name);
      expect(newAccount).toHaveProperty('lastname', newUser.lastname);
      expect(newAccount).toHaveProperty('businessEntity', newUser.businessEntity);
      expect(newAccount).toHaveProperty('email', newUser.email);
      expect(newAccount).toHaveProperty('obMonth', newUser.obMonth);
      expect(newAccount).toHaveProperty('obYear', newUser.obYear);
      expect(newAccount).toHaveProperty('openingBalance', 0);
      expect(newAccount.accountNumber).toBeDefined();
      expect(+newAccount.accountNumber).toBeGreaterThan(0);
      expect(newAccount).toHaveProperty('status', UserAccountStatus.active);
      expect(newAccount).toHaveProperty('role', RoleName.client);
      // typeORM {select: false} the following columns
      // expect(newAccount).toHaveProperty('percentage', 100);
      // expect(newAccount).toHaveProperty('modality', Modality.NoCompounding);
      const query = await usersRepo.createQueryBuilder('user')
        .addSelect('user.created_id', 'user_created_id')
        .addSelect('user.modality')
        .addSelect('user.percentage')
        .whereInIds(newAccount.id);
      const account = await query.getOneOrFail();
      expect(account).toBeTruthy();
      expect(account.id).toBeTruthy();
      expect(account.fmId).toBe(manager.id);
      expect(account.name).toBe(newUser.name);
      expect(account.lastname).toBe(newUser.lastname);
      expect(account.email).toBe(newUser.email);
      expect(account.obMonth).toBe(newUser.obMonth);
      expect(account.obYear).toBe(newUser.obYear);
      expect(account.hasAccountsAccess).toBeTruthy();
      expect(account.status).toBe(UserAccountStatus.active);
      expect(account.openingBalance).toBe(0);
      expect(account.modality).toBe(Modality.NoCompounding);
      expect(account.createdId).toBe(administrator.id);
      expect(account.accountNumber).toBeTruthy();
      expect(account.role).toBe(RoleName.client);
      expect(account.roleId).toBe(RoleId.client);
      expect(account.deleted).toBe(false);
      expect(account.percentage).toBe(100);
    });
  });
});
