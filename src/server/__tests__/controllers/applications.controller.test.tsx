/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/first */
import React from 'react';
import * as db from '@lib/db';
import {
  createConnection, Connection, ConnectionOptions, QueryRunner, Repository, EntityManager,
} from 'typeorm';
import { ApplicationsController } from '@controllers';
import {
  Application, User,
} from '@entities';
import {
  Applications,
} from '@repositories';

import { Emailer } from '@lib/email';
import * as Email from '@email';
import { mocked } from 'ts-jest/utils';
import { Request, Response } from 'express';
import Mail from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer';
import {
  Modality, RoleId, RoleName, UserAccountStatus,
} from '@interfaces';
import { DateTime } from 'luxon';
import {
  createSaveAndGetTestUserData, creatSaveAndGetTestApplicationsData,
} from '../repositories/sampleData';

jest.setTimeout(30000000);

let connection: Connection;
let entityManager: EntityManager;
let queryRunner: QueryRunner;
jest.mock('@lib/db');
const { DBConfigTest }: {
  DBConfigTest: typeof db.DBConfigTest;
} = jest.requireActual('@lib/db');

jest.mock('@lib/email');
const mockEmailer = mocked(Emailer, true);
mockEmailer.prototype.sendMail.mockImplementation(async (input: Mail.Options) => ({ messageId: `${input.to}` }) as SentMessageInfo);
jest.mock('@email');
const mockEmail = mocked(Email, true);
mockEmail.Labels.getApplicationEmailSubject.mockImplementation(() => 'test invitation subject');
mockEmail.Labels.getApplicationCompleteEmailSubject.mockImplementation(() => 'test app complete subject');
mockEmail.Labels.getAccountOpenedEmailSubject.mockImplementation(() => 'test account opening subject');
mockEmail.GenerateApplicationInvitationEmailTemplate.mockImplementation(({
  name, email, manager, PIN,
}) => (<span>
  test invitation text {name} {email} {manager} {PIN}
  </span>
));
mockEmail.GenerateAccountOpenedEmailTemplate.mockImplementation(({
  name, accountNumber, link,
}) => (<span>
  test account opened text {name} {accountNumber} {link}
  </span>
));

mockEmail.GenerateApplicationCompleteEmailTemplate.mockImplementation(({
  name,
}) => (<span>test application complete text {name}</span>));

const mockedConnection = mocked(db.getConnection, true);
mockedConnection.mockImplementation(async () => queryRunner.manager as unknown as Connection);

describe('Applications controller', () => {
  let applicationsController: ApplicationsController;
  let customAppRepo: Applications;
  let usersRepo: Repository<User>;
  const allUsers: User[] = [];
  let director: User;
  let director2: User;
  let manager: User;
  let client: User;
  let applicant1: {name: string;lastname: string;email: string};
  let applicant2: {name: string;lastname: string;email: string};
  let manager2: User;
  let applications: Application[];
  let appForManagerClient: Application;
  let appForManager2Client2: Application;
  beforeAll(async () => {
    try {
      applicationsController = new ApplicationsController();
      const config = DBConfigTest;
      connection = await createConnection(config as ConnectionOptions);
      queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      entityManager = queryRunner.manager;
      usersRepo = entityManager.getRepository(User);
      if (!usersRepo) throw new Error('Could not create users custom repo when setting up test');
      const {
        director: d1, director2: d2, manager: m1, manager2: m2, client: c, applicant1: a1, applicant2: a2,
      } = await createSaveAndGetTestUserData(usersRepo);
      director = d1;
      director2 = d2;
      manager = m1;
      manager2 = m2;
      client = c;
      applicant1 = a1;
      applicant2 = a2;
      customAppRepo = entityManager.getCustomRepository(Applications);
      if (!customAppRepo) throw new Error('Could not create application custom repo when setting up test');
      const appRepo = entityManager.getRepository(Application);
      const { applications: apps, appForManagerClient: a, appForManager2Client2: app2 } = await creatSaveAndGetTestApplicationsData(appRepo);
      appForManagerClient = a;
      appForManager2Client2 = app2;
      applications = apps;
      return true;
    } catch (e) {
      console.log(`Error in application.test.ts->beforeAll ${e}`);
      throw e;
    }
  });
  afterAll(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    if (connection) await connection.close();
  });
  describe('create', () => {
    it('creates an application and emails invitation', async () => {
      const { message, error } = await applicationsController.create(
        { user: { authUser: manager } } as Request,
        { status: (code: number) => code } as unknown as Response,
        {
          email: client.email,
          name: client.name,
          fmId: manager.id,
        },
      );
      const { email, name } = client;
      const { displayName } = manager;
      const application = (await customAppRepo.findAllOrNone(manager.id)).find(({ authEmail }) => authEmail === client.email);
      const { appPIN: PIN } = application;
      expect(error).toBeFalsy();
      expect(message).toBeTruthy();
      expect(application).toBeTruthy();
      expect(application.uuid).toBeTruthy();
      expect(application.authEmail).toBe(client.email);
      expect(application.managerEmail).toBe(manager.email);
      expect(application.applicantContact.name).toBe(client.name);
      expect(application.fmId).toBe(manager.id);
      expect(mockEmail.GenerateApplicationInvitationEmailTemplate).toBeCalledWith({
        name, email, manager: displayName, PIN,
      });
      expect(mockEmail.Labels.getApplicationEmailSubject).toBeCalledWith();
      expect(mockEmailer.prototype.sendMail).toHaveBeenCalledWith({
        to: client.email,
        cc: manager.email,
        subject: mockEmail.Labels.getApplicationEmailSubject(),
        text: mockEmail.GenerateApplicationInvitationEmailTemplate({
          name, email, manager: displayName, PIN,
        }),
      });
    });
  });
  describe('openAccount', () => {
    it('opens an account from an application and starts password reset', async () => {
      const month = 1;
      const year = 2017;
      const newApp = await customAppRepo.createApplication(director.id, applicant1.email);

      newApp.applicantContact = {
        ...newApp.applicantContact,
        name: applicant1.name,
        lastName: applicant1.lastname,
        email: applicant1.email,
      };
      newApp.clickedToSign = true;
      newApp.dateEnded = DateTime.now().valueOf();
      const { application: savedApp } = await customAppRepo.saveApplication(newApp.authEmail, newApp.appPIN, newApp);

      const {
        message,
        error,
      } = await applicationsController.openAccount(
        { user: { authUser: director } } as Request,
        { status: (code: number) => code } as unknown as Response,
        {
          uuid: savedApp.uuid,
          month,
          year,
          managerId: manager.id,
        },
      );
      expect(error).toBeFalsy();

      const application = await customAppRepo.findOneOrNull({ authUserId: director.id, uuid: savedApp.uuid });
      const query = await usersRepo.createQueryBuilder('user')
        .addSelect('user.created_id', 'user_created_id')
        .addSelect('user.passResetHash', 'user_passResetHash')
        .addSelect('user.passResetExpire', 'user_passResetExpire')
        .addSelect('user.modality')
        .addSelect('user.percentage')
        .whereInIds(application.userId);
      const account = await query.getOneOrFail();

      expect(account).toBeTruthy();
      expect(message).toBe(`Account opening email has been sent to ${account.email}, cc ${manager.email}. Account number is ${account.accountNumber}.`);
      expect(account.id).toBeTruthy();
      expect(account.fmId).toBe(manager.id);
      expect(account.status).toBe(UserAccountStatus.active);
      expect(account.obMonth).toBe(month);
      expect(account.obYear).toBe(year);
      expect(account.openingBalance).toBe(0);
      expect(account.modality).toBe(Modality.NoCompounding);
      expect(account.createdId).toBe(director.id);
      expect(account.accountNumber).toBeTruthy();
      expect(account.role).toBe(RoleName.client);
      expect(account.roleId).toBe(RoleId.client);
      expect(account.deleted).toBe(false);
      expect(account.percentage).toBe(100);
      expect(account.passwordResetExpiration).toBeTruthy();
      expect(account.passwordResetHash).toBeTruthy();
      expect(account.hashedPassword).toBeFalsy();
      expect(mockEmailer.prototype.sendMail).toHaveBeenCalledWith({
        to: applicant1.email,
        cc: manager.email,
        subject: mockEmail.Labels.getAccountOpenedEmailSubject(),
        emailTemplate: mockEmail.GenerateAccountOpenedEmailTemplate({
          name: applicant1.name, accountNumber: account.accountNumber, link: `http://localhost:8080/passwordReset?resetKey=${encodeURIComponent(account.passwordResetHash)}`,
        }),
      });
    });
    describe('save', () => {
      it('sends an email when the application is complete', async () => {
        const newApp = await customAppRepo.createApplication(director.id, applicant2.email);

        newApp.applicantContact = {
          ...newApp.applicantContact,
          name: applicant2.name,
          lastName: applicant2.lastname,
          email: applicant2.email,
        };
        newApp.clickedToSign = true;
        newApp.dateEnded = DateTime.now().valueOf();
        await applicationsController.save(
          { user: { authUser: director } } as Request,
          {
            application: { ...newApp, clickedToSign: true },
          },
        );
        expect(mockEmailer.prototype.sendMail).toHaveBeenCalledWith({
          to: applicant2.email,
          cc: director.email,
          subject: mockEmail.Labels.getApplicationCompleteEmailSubject(),
          text: mockEmail.GenerateApplicationCompleteEmailTemplate({
            name: applicant2.name,
          }),
        });
      });
    });
  });
});
