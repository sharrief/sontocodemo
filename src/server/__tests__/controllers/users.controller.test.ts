/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/first */
jest.mock('nodemailer');
jest.mock('nodemailer/lib/mailer');
import nodemailer, { Transport, SentMessageInfo } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { UsersController } from '@controllers';
import { User } from '@entities';
import * as db from '@lib/db';
import { mocked } from 'ts-jest/utils';
import {
  Connection, ConnectionOptions, createConnection, EntityManager, QueryRunner, Repository,
} from 'typeorm';
import { API, endpoints } from '@api';
import {
  Modality, RoleId, RoleName, UserAccountStatus,
} from '@interfaces';
import { GenerateAccountOpenedEmailTemplate, getPasswordResetCompleteTemplate } from '@email';
import env from '@server/lib/env';
import { createSaveAndGetTestUserData } from '../repositories/sampleData';

let connection: Connection;
let queryRunner: QueryRunner;
let entityManager: EntityManager;

const mockMail = mocked(Mail, true);
mockMail.prototype.sendMail.mockImplementation(async (input: SentMessageInfo) => ({ messageId: `${input.to}` }));
const mockNodemailer = mocked(nodemailer, true);
mockNodemailer.createTransport.mockImplementation((input: Transport) => new Mail(input));

jest.mock('@lib/db');
const { DBConfigTest }: {
  DBConfigTest: typeof db.DBConfigTest;
} = jest.requireActual('@lib/db');
const mockedConnection = mocked(db.getConnection, true);
mockedConnection.mockImplementation(async () => queryRunner.manager as unknown as Connection);
describe('The users controller', () => {
  let usersController: UsersController;
  let usersRepo: Repository<User>;
  let client: User;
  let administrator: User;
  let manager: User;
  async function getUsersRoute(id?: number) {
    const request = { user: { authUser: (id ? { id } : undefined) } };
    return usersController.usersRoute(request as any);
  }
  async function openAccount(body: Parameters<typeof API.Users.OpenAccount.post>[0]) {
    const request = { user: { authUser: administrator } };
    return usersController.openAccount(request as any, body);
  }
  async function completePasswordReset(resetKey: string, newPassword: string) {
    return usersController
      .doPasswordResetRoute({ status: (_status: number) => _status } as any, { resetKey, newPassword });
  }
  try {
    beforeAll(async () => {
      usersController = new UsersController();
      connection = await createConnection(DBConfigTest as ConnectionOptions);
      queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      entityManager = queryRunner.manager;
      usersRepo = entityManager.getRepository(User);
      const userData = await createSaveAndGetTestUserData(usersRepo);
      client = userData.client;
      administrator = userData.administrator;
      manager = userData.manager;
      return true;
    });
    afterAll(async () => {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      if (connection) await connection.close();
    });

    describe('has a route which', () => {
      it('returns an error if user is not in the request object', async () => {
        const { error, user } = await getUsersRoute();
        expect(user).toBeFalsy();
        expect(error).toBe('An error occurred while trying to load users: The user was missing on the request to usersRoute.');
      });
      it('returns an error if the user is not found in the db', async () => {
        const { error, user } = await getUsersRoute(1.1);
        expect(user).toBeFalsy();
        expect(error).toBe('An error occurred while trying to load users: Unable to find a user with id 1.1');
      });
      it('returns a User if there is a user on the request object', async () => {
        const { error, user } = await getUsersRoute(client.id);
        expect(error).toBeFalsy();
        expect(user).not.toBeFalsy();
        expect(user.id).toBe(client.id);
      });
    });
    it('can open an account by name and email', async () => {
      const newUser = {
        name: 'Bob',
        lastName: 'James',
        email: 'bob.james@sontocoholdings.com',
        managerId: manager.id,
        month: 11,
        year: 2021,
        businessEntity: 'Bob James LLC',
        sendEmail: true,
      };
      await openAccount(newUser);

      const query = await usersRepo.createQueryBuilder('user')
        .addSelect('user.created_id', 'user_created_id')
        .addSelect('user.modality')
        .addSelect('user.percentage')
        .addSelect('user.passwordResetHash')
        .addSelect('user.hashedPassword')
        .where('user.email = :userEmail', { userEmail: newUser.email });
      const account = await query.getOneOrFail();

      expect(account).toBeTruthy();
      expect(account.id).toBeTruthy();
      expect(account.fmId).toBe(manager.id);
      expect(account.name).toBe(newUser.name);
      expect(account.lastname).toBe(newUser.lastName);
      expect(account.email).toBe(newUser.email);
      expect(account.obMonth).toBe(newUser.month);
      expect(account.obYear).toBe(newUser.year);
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
      expect(account.passwordResetHash).toBeTruthy();

      const { passwordResetHash } = account;
      const encodedHash = encodeURIComponent(passwordResetHash);
      const link = `http://localhost:8080${endpoints.passwordReset}?resetKey=${encodedHash}`;
      expect(mockMail.prototype.sendMail).toHaveBeenCalledWith({
        from: 'DEV TEST EMAIL <no-reply@sontocoholdings.com>',
        to: account.email,
        replyTo: 'DEV TEST EMAIL <no-reply@sontocoholdings.com>',
        cc: manager.email,
        bcc: undefined,
        subject: 'Your Account is ready!',
        text: GenerateAccountOpenedEmailTemplate({
          name: account.name,
          accountNumber: account.accountNumber,
          link,
        }),
      });
    });
    it('can complete a password reset', async () => {
      const newUser = {
        name: 'Michael',
        lastName: 'Franks',
        email: 'michael.franks@sontocoholdings.com',
        managerId: manager.id,
        month: 11,
        year: 2021,
        businessEntity: 'M.K. Corp',
        sendEmail: false,
      };

      const { success, error: openAccountError } = await openAccount(newUser);
      expect(success).toBeTruthy();
      expect(openAccountError).toBeFalsy();

      const query = await usersRepo.createQueryBuilder('user')
        .addSelect('user.hashedPassword')
        .addSelect('user.passwordResetHash')
        .where('user.email = :userEmail', { userEmail: newUser.email });

      const account = await query.getOneOrFail();

      expect(account.hashedPassword).toBeFalsy();

      const newPassword = 'newPassWord@1!4';
      const { passwordResetHash } = account;
      const encodedHash = encodeURIComponent(passwordResetHash);

      const { error: resetPasswordError } = await completePasswordReset(encodedHash, newPassword);
      expect(resetPasswordError).toBeFalsy();

      expect(mockMail.prototype.sendMail).toHaveBeenCalledWith({
        from: 'DEV TEST EMAIL <no-reply@sontocoholdings.com>',
        to: account.email,
        replyTo: 'DEV TEST EMAIL <no-reply@sontocoholdings.com>',
        cc: undefined,
        bcc: undefined,
        subject: 'Your Account password has been reset',
        text: getPasswordResetCompleteTemplate(env.var.EMAIL_ADMIN),
      });

      const query2 = await usersRepo.createQueryBuilder('user')
        .addSelect('user.hashedPassword')
        .where('user.email = :userEmail', { userEmail: account.email });
      const accountAfterNewPassword = await query2.getOneOrFail();
      expect(accountAfterNewPassword.hashedPassword).toBeTruthy();
    });
  } catch ({ message }) {
    // eslint-disable-next-line no-console
    console.log(`Error when running tests for the Users controller: ${message}`);
  }
});
