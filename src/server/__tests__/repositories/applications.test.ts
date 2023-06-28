/* eslint-disable no-console */
import * as db from '@lib/db';
import {
  Applications,
} from '@repositories';
import {
  User, Application,
} from '@entities';
import {
  Application as ApplicationModel,
} from '@models';
import {
  Connection, ConnectionOptions, createConnection, EntityManager, QueryRunner, Repository,
} from 'typeorm';
import { DateTime } from 'luxon';
import { mocked } from 'ts-jest/utils';
import {
  ApplicantEntityType, AssetType, InvestmentInstrument, Modality, RoleId, RoleName, UserAccountStatus,
} from '@interfaces';
import {
  createSaveAndGetTestUserData, creatSaveAndGetTestApplicationsData, getValidApplication,
} from './sampleData';

jest.setTimeout(30000000);

let connection: Connection;
let entityManager: EntityManager;
let queryRunner: QueryRunner;
jest.mock('@lib/db');
const { DBConfigTest }: {
  DBConfigTest: typeof db.DBConfigTest;
} = jest.requireActual('@lib/db');
const mockedConnection = mocked(db.getConnection, true);
mockedConnection.mockImplementation(async () => entityManager as unknown as Connection);

describe('In the Application repository', () => {
  let usersRepo: Repository<User>;
  let customAppRepo: Applications;
  let appRepo: Repository<Application>;
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
      appRepo = entityManager.getRepository(Application);
      if (!appRepo) throw new Error('Could not create application generic repo when setting up test');
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
  const createApplication = async (fm: User, email: Application['authEmail']) => {
    const newApp = await customAppRepo.createApplication(fm.id, email);
    const savedApp = await customAppRepo.findOneOrNull({ authUserId: fm.id, uuid: newApp.uuid });
    if (!savedApp) throw new Error('Test could not save app');
    applications.push(savedApp);
    return newApp;
  };
  const saveApplication = async (authEmail: Application['authEmail'], appPIN: Application['appPIN'], updatedApplication: Partial<Application>) => {
    const { application } = await customAppRepo.saveApplication(authEmail, appPIN, updatedApplication);
    return application;
  };
  const openAccount = async (authUserId: User['id'], uuid: Application['uuid'], month: number, year: number, managerId?: User['id']) => customAppRepo.openAccount(authUserId, uuid, month, year, managerId);
  const deleteApplication = async (fmId: Application['fmId'], uuid: Application['uuid'], expectSuccess: boolean) => {
    if (expectSuccess) { applications = applications.filter(({ uuid: UUID }) => UUID !== uuid); }
    const result = await customAppRepo.deleteOne(fmId, uuid);
    return result;
  };
  describe('an application', () => {
    describe('that has all default values', () => {
      it('returns validation messages for default root level application fields', async () => {
        const result = await ApplicationModel.getValidationMessages(appForManagerClient);
        const {
          taxCountry, incomeSize, financialCommitments, financialAssets, financialLiabilities,
        } = result;
        expect(taxCountry.message).toBeTruthy();
        expect(incomeSize.message).toBeTruthy();
        expect(financialCommitments.message).toBeTruthy();
        expect(financialAssets.message).toBeTruthy();
        expect(financialLiabilities.message).toBeTruthy();
      });
      it('returns not validation messages for completed root level application fields', async () => {
        const copyOfAppForManagerClient = { ...appForManagerClient };
        const result = await ApplicationModel.getValidationMessages(copyOfAppForManagerClient);
        const {
          taxCountry, incomeSize, financialCommitments, financialAssets, financialLiabilities,
        } = result;
        expect(taxCountry.message).toBeTruthy();
        expect(incomeSize.message).toBeTruthy();
        expect(financialCommitments.message).toBeTruthy();
        expect(financialAssets.message).toBeTruthy();
        expect(financialLiabilities.message).toBeTruthy();
      });
      it('returns validation messages for default individual applicant contact fields', async () => {
        expect(appForManagerClient.entityType).toBe(ApplicantEntityType.Individual);
        const result = await ApplicationModel.getValidationMessages(appForManagerClient);
        const {
          applicantContact: {
            name, lastName, identificationNumber, phone, email,
          },
        } = result;
        expect(name.message).toBeTruthy();
        expect(lastName.message).toBeTruthy();
        expect(identificationNumber.message).toBeTruthy();
        expect(phone.message).toBeTruthy();
        expect(email.message).toBeTruthy();
      });
      it('returns validation messages for an individual representative contact', async () => {
        expect(appForManagerClient.entityType).toBe(ApplicantEntityType.Individual);
        const result = await ApplicationModel.getValidationMessages(appForManagerClient);
        const {
          representativeContact: {
            name, lastName, identificationNumber,
            phone, email,
          },
        } = result;
        expect(name.message).toBeTruthy();
        expect(lastName.message).toBeTruthy();
        expect(identificationNumber.message).toBeTruthy();
        expect(phone.message).toBeTruthy();
        expect(email.message).toBeTruthy();
      });
      it('returns validation messages for the date of birth', async () => {
        const result = await ApplicationModel.getValidationMessages(appForManagerClient);
        const {
          applicantContact: {
            dateOfBirth: {
              day, month, year,
            },
          },
        } = result;
        expect(day.message).toBeTruthy();
        expect(month.message).toBeTruthy();
        expect(year.message).toBeTruthy();
      });
      it('returns validation messages for a corporate applicant contact', async () => {
        expect(appForManager2Client2.entityType).not.toBe(ApplicantEntityType.Individual);
        const result = await ApplicationModel.getValidationMessages(appForManager2Client2);
        const {
          applicantContact: {
            name, lastName, identificationNumber,
            phone, email,
          },
        } = result;
        expect(name.message).toBeTruthy();
        expect(lastName.message).toBeNull(); // lastName not validated for corporate application
        expect(identificationNumber.message).toBeTruthy();
        expect(phone.message).toBeTruthy();
        expect(email.message).toBeTruthy();
      });
      it('returns validation messages for the legal address', async () => {
        const result = await ApplicationModel.getValidationMessages(appForManagerClient);
        const {
          applicantContact: {
            legalAddress: {
              line1, city, country,
            },
          },
        } = result;
        expect(line1.message).toBeTruthy();
        expect(city.message).toBeTruthy();
        expect(country.message).toBeTruthy();
      });
      it('returns validation messages for optional fields that are activated by other fields', async () => {
        const app = { ...appForManager2Client2 };
        app.investmentExperience = [InvestmentInstrument.Other];
        app.assetTypes = [AssetType.Other];
        app.expectedInvestmentLengthInYears = 0;
        app.entityType = ApplicantEntityType.Corporation;
        const result = await ApplicationModel.getValidationMessages(app);
        const {
          investmentExperienceOther, assetTypeOther, expectedInvestmentLengthOther, checkedAuthorizedByEntity,
        } = result;
        expect(investmentExperienceOther.message).toBeTruthy();
        expect(assetTypeOther.message).toBeTruthy();
        expect(expectedInvestmentLengthOther.message).toBeTruthy();
        expect(checkedAuthorizedByEntity.message).toBeTruthy();
      });
    });
    it('can pass validation', async () => {
      const appSubmission = getValidApplication();
      const newApp = await appRepo.save(appSubmission);
      const newApp2 = await customAppRepo.findOneOrNull({ authUserId: newApp.fmId, uuid: newApp.uuid });
      expect(newApp2.applicantContact).toHaveProperty('name', newApp.applicantContact.name);
      expect(newApp.applicantContact.name).toBe(client.name);
      const result2 = await ApplicationModel.getValidationMessages(appSubmission);
      expect(ApplicationModel.NestedValidationIsInvalid(result2)).toBeFalsy();
    });
  });
  describe('a manager', () => {
    it('can create new applications', async () => {
      const newApp = await createApplication(manager, client.email);
      expect(newApp).toHaveProperty('fmId', manager.id);
      expect(newApp.uuid).toBeTruthy();
      const newApp2 = await createApplication(manager, client.email);
      expect(newApp2).toHaveProperty('fmId', manager.id);
      expect(newApp2.uuid).toBeTruthy();
      const managerApps = await customAppRepo.findAllOrNone(manager.id);
      expect(managerApps).toHaveLength(applications.filter(({ fmId }) => fmId === manager.id).length);
    });
    it('gets an error if creating an application without an email', async () => {
      expect.assertions(1);
      await expect(async () => createApplication(manager, null)).rejects.toBeDefined();
    });
    it('can delete an application', async () => {
      jest.setTimeout(100000); // 10 second timeout
      const getManagerAppsCount = async () => (await customAppRepo.findAllOrNone(manager.id)).length;
      const initialAppCount = await getManagerAppsCount();
      const { fmId, uuid } = await createApplication(manager, client.email);
      const appCount = await getManagerAppsCount();
      expect(appCount).toBe(initialAppCount + 1);
      const { success } = await deleteApplication(fmId, uuid, true);
      expect(success).toBe(true);
      const appCountAfterDeletion = await getManagerAppsCount();
      expect(appCountAfterDeletion).toBe(initialAppCount);
    });
    it('returns an error message if the application manager was not found', async () => {
      const { message, success } = await deleteApplication(0, appForManagerClient.uuid, false);
      expect(success).toBe(false);
      expect(message).toBe('Could not delete the application as no lookup values were provided.');
    });
    it('returns an error message if no lookup values are provided', async () => {
      const { message, success } = await deleteApplication(null, null, false);
      expect(success).toBe(false);
      expect(message).toBe('Could not delete the application as no lookup values were provided.');
    });
    it('cannot delete an application for an active user', async () => {
      const app = await createApplication(manager, client.email);
      app.user = client;
      await appRepo.save(app);
      const { success } = await deleteApplication(manager.id, app.uuid, false);
      expect(success).toBe(false);
    });
    it('cannot delete a non-existent application', async () => {
      const { success, message } = await deleteApplication(manager.id, 'ABC', false);
      expect(success).toBe(false);
      expect(message).toBe('Could not locate an application with uuid ABC.');
    });
    it('can access an application belonging to them by ID', async () => {
      const app0 = await customAppRepo.findOneOrNull({ authUserId: manager.id, uuid: appForManagerClient.uuid });
      expect(app0).toHaveProperty('id', appForManagerClient.id);
    });
    it('cannot access an application not belonging to them', async () => {
      const app0 = await customAppRepo.findOneOrNull({ authUserId: manager2.id, uuid: appForManagerClient.uuid });
      expect(app0).toBeNull();
    });
    it('can access all applications belonging to them', async () => {
      const queriedManagerApps = await customAppRepo.findAllOrNone(manager.id);
      const testManagerApps = applications.filter(({ fmId }) => fmId === manager.id);
      expect(queriedManagerApps.length).toBeTruthy();
      expect(queriedManagerApps.reduce((matched, app) => matched && !!testManagerApps.find(({ id }) => id === app.id), true)).toBeTruthy();
    });
    it('cannot access all applications not belonging to them', async () => {
      const queriedManagerApps = await customAppRepo.findAllOrNone(manager.id);
      const testManagerApps = applications.filter(({ fmId }) => fmId === manager2.id);
      expect(queriedManagerApps.length).toBeTruthy();
      expect(testManagerApps.length).toBeTruthy();
      expect(queriedManagerApps.reduce((matched, app) => matched && !!testManagerApps.find(({ id }) => id === app.id), true)).toBeFalsy();
    });
    it('can associate an application with an account', async () => {
      const app = await createApplication(manager, client.email);
      expect(app.userId).not.toBe(client.id);
      const { success } = await customAppRepo.associateUserAccount(manager.id, app.uuid, client.id);
      const savedApp = await customAppRepo.findOneOrNull({ authUserId: manager.id, uuid: app.uuid });
      expect(success).toBe(true);
      expect(savedApp.userId).toBe(client.id);
    });
  });
  describe('a director', () => {
    it('can access an applications belonging to their sub-managers', async () => {
      const app0 = await customAppRepo.findOneOrNull({ authUserId: director.id, uuid: appForManagerClient.uuid });
      expect(app0).toHaveProperty('id', appForManagerClient.id);
    });
    it('cannot access an applications belonging to other directors', async () => {
      const app0 = await customAppRepo.findOneOrNull({ authUserId: director2.id, uuid: appForManagerClient.uuid });
      expect(app0).toBeNull();
    });
    it('can access all applications belonging to their sub-managers', async () => {
      const directorApps = await customAppRepo.findAllOrNone(director.id);
      const managerApps = applications.filter(({ fmId }) => fmId === manager.id);
      expect(directorApps.length).toBeTruthy();
      expect(managerApps.length).toBeTruthy();
      expect(directorApps.reduce((matched, app) => matched && !!managerApps.find(({ id }) => id === app.id), true)).toBeTruthy();
    });
    it('cannot access applications belonging to other sub-managers', async () => {
      const directorApps = await customAppRepo.findAllOrNone(director.id);
      const managerApps = applications.filter(({ fmId }) => fmId === manager2.id);
      expect(managerApps.length).toBeTruthy();
      expect(directorApps.length).toBeTruthy();
      expect(directorApps.reduce((matched, app) => matched && !!managerApps.find(({ id }) => id === app.id), true)).toBeFalsy();
    });
    it('can associate an application with an account', async () => {
      const app = await createApplication(director, client.email);
      expect(app.userId).not.toBe(client.id);
      const { success } = await customAppRepo.associateUserAccount(director.id, app.uuid, client.id);
      const savedApp = await customAppRepo.findOneOrNull({ authUserId: director.id, uuid: app.uuid });
      expect(success).toBe(true);
      expect(savedApp.userId).toBe(client.id);
    });
    it('can open an account from an application', async () => {
      let app = await createApplication(director, applicant1.email);
      app = await saveApplication(app.authEmail, app.appPIN, {
        ...app,
        entityType: ApplicantEntityType.Individual,
        applicantContact: {
          ...app.applicantContact,
          name: applicant1.name,
          lastName: applicant1.lastname,
          email: applicant1.email,
        },
        clickedToSign: true,
        dateEnded: DateTime.now().valueOf(),
      });
      const month = 1;
      const year = 2017;
      const accountId = await openAccount(director.id, app.uuid, month, year);
      const query = await usersRepo.createQueryBuilder('user')
        .addSelect('user.created_id', 'user_created_id')
        .addSelect('user.modality')
        .addSelect('user.percentage')
        .whereInIds(accountId);
      const account = await query.getOneOrFail();
      const openedAccountApp = await appRepo.findOneOrFail(app.id);
      expect(openedAccountApp.userId).toBe(account.id);
      expect(account).toBeTruthy();
      expect(account.id).toBeTruthy();
      expect(account.fmId).toBe(director.id);
      expect(account.name).toBe(applicant1.name);
      expect(account.lastname).toBe(applicant1.lastname);
      expect(account.email).toBe(applicant1.email);
      expect(account.obMonth).toBe(month);
      expect(account.obYear).toBe(year);
      expect(account.hasAccountsAccess).toBeTruthy();
      expect(account.status).toBe(UserAccountStatus.active);
      expect(account.openingBalance).toBe(0);
      expect(account.modality).toBe(Modality.NoCompounding);
      expect(account.createdId).toBe(director.id);
      expect(account.accountNumber).toBeTruthy();
      expect(account.role).toBe(RoleName.client);
      expect(account.roleId).toBe(RoleId.client);
      expect(account.deleted).toBe(false);
      expect(account.percentage).toBe(100);
    });
    it('can open an account for a sub-manager', async () => {
      let app = await createApplication(director, applicant2.email);
      app = await saveApplication(app.authEmail, app.appPIN, {
        ...app,
        entityType: ApplicantEntityType.Individual,
        applicantContact: {
          ...app.applicantContact,
          name: applicant2.name,
          lastName: applicant2.lastname,
          email: applicant2.email,
        },
        clickedToSign: true,
        dateEnded: DateTime.now().valueOf(),
      });
      const month = 1;
      const year = 2017;
      const accountId = await openAccount(director.id, app.uuid, month, year, manager.id);
      const query = await usersRepo.createQueryBuilder('user')
        .addSelect('user.created_id', 'user_created_id')
        .addSelect('user.modality')
        .addSelect('user.percentage')
        .whereInIds(accountId);
      const account = await query.getOneOrFail();
      const openedAccountApp = await appRepo.findOneOrFail(app.id);
      expect(openedAccountApp.userId).toBe(account.id);
      expect(account).toBeTruthy();
      expect(account.id).toBeTruthy();
      expect(account.fmId).toBe(manager.id);
      expect(account.name).toBe(applicant2.name);
      expect(account.lastname).toBe(applicant2.lastname);
      expect(account.email).toBe(applicant2.email);
      expect(account.obMonth).toBe(month);
      expect(account.obYear).toBe(year);
      expect(account.status).toBe(UserAccountStatus.active);
      expect(account.hasAccountsAccess).toBeTruthy();
      expect(account.modality).toBe(Modality.NoCompounding);
      expect(account.openingBalance).toBe(0);
      expect(account.createdId).toBe(director.id);
      expect(account.accountNumber).toBeTruthy();
      expect(account.role).toBe(RoleName.client);
      expect(account.roleId).toBe(RoleId.client);
      expect(account.deleted).toBe(false);
      expect(account.percentage).toBe(100);
    });
  });
});
