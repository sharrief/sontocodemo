/* eslint-disable class-methods-use-this */
import {
  EntityRepository, AbstractRepository, SelectQueryBuilder, Brackets,
} from 'typeorm';
import {
  Application, User,
} from '@entities';
import {
  ApplicantEntityType, DefaultApplication, RoleId, UserAccountStatus,
} from '@interfaces';
import { error } from '@log';
import { floor, random } from '@numbers';
import { Users } from '@repositories';
import { v4 } from 'uuid';

type ManagersLookupQuery =
{authUserId: User['id']; uuid: Application['uuid']; authEmail?: Application['authEmail']; appPIN?: Application['appPIN'] }

type ApplicantsLookupQuery = {authUserId?: User['id']; uuid?: Application['uuid']; authEmail: Application['authEmail']; appPIN: Application['appPIN']}
type LookupQuery = ManagersLookupQuery | ApplicantsLookupQuery;

function AppendApplicationAuthorizationQuery(query: SelectQueryBuilder<Application>, authUserId: User['id'], applicationAlias: string) {
  return query
    .andWhere(`${applicationAlias}.deleted = 0`)
    .andWhere(new Brackets((whereExpression) => {
      whereExpression
        .where(`${applicationAlias}.fmId = :authUserId`)
        .orWhere(`${RoleId.admin} = ${query.subQuery()
          .select('admin.role_id')
          .from(User, 'admin')
          .where('admin.id = :authUserId')
          .andWhere('admin.deleted = 0')
          .getQuery()}`)
        .orWhere(`${applicationAlias}.fm_id IN ${query.subQuery()
          .select('manager.id')
          .from(User, 'manager')
          .leftJoin(User, 'director', 'manager.fm_id = director.id')
          .andWhere('director.id = :authUserId')
          .andWhere('director.deleted = 0')
          .andWhere('director.role_id = :directorRole')
          .andWhere('manager.deleted = 0')
          .getQuery()}`);
    })).setParameters({ authUserId, directorRole: RoleId.director });
}

@EntityRepository(Application)
export class Applications extends AbstractRepository<Application> {
  alias = 'application';

  private getManagerById(authUserId: User['id']) {
    return this.manager.getCustomRepository(Users).getUserById({ authUserId, id: authUserId });
  }

  private getUserById(authUserId: User['id'], id: User['id']) {
    return this.manager.getCustomRepository(Users).getUserById({ authUserId, id });
  }

  async createApplication(managerId: Application['fmId'], authEmail: Application['authEmail'], name?: string) {
    try {
      if (!authEmail) { throw new Error('Cannot create an application without an applicant email address'); }
      const manager = await this.getManagerById(managerId);
      if (!manager) throw new Error('No manager found when trying to create application');
      let appPIN: string;
      let existingApp: Application;
      let maxLoopCount = 10;
      do { // generate a random and unique PIN for the given authEmail
        appPIN = `${(new Array(Application.appPINLength).fill(0).map(() => floor(random(0, 9))).join(''))}`;
        // eslint-disable-next-line no-await-in-loop
        existingApp = await this.findOneOrNull({ appPIN, authEmail });
        maxLoopCount -= 1;
      }
      while (existingApp && maxLoopCount > 0);
      if (existingApp) {
        throw new Error(`Could not generate a unique appPIN for ${authEmail}.`);
      }
      const uuid = v4();
      const newAppSubmission = {
        ...DefaultApplication,
        uuid,
        appPIN,
        manager,
        authEmail,
        managerEmail: manager.email,
        managerName: manager.username,
        dateCreated: Date.now(),
      };
      newAppSubmission.applicantContact.email = authEmail;
      if (name) { [newAppSubmission.applicantContact.name] = name.split(' '); }
      const newApp = this.manager.create(Application, newAppSubmission);
      await this.manager.createQueryBuilder(Application, 'Application').insert().values([newApp]).execute();
      const [app] = await this.manager.find(Application, { id: newApp.id });
      return app || null;
      // eslint-disable-next-line no-console
      // console.log(app);
    } catch (e) {
      error(`Error in application.repository.ts->Applications->createApplication: ${e}`);
      throw e;
    }
  }

  async saveApplication(authEmail: Application['authEmail'], appPIN: Application['appPIN'], updatedApplication: Partial<Application>) {
    try {
      const { id } = await this.findOneOrNull({ authEmail, appPIN }) || {};
      if (!id) {
        throw new Error('The application was not found.');
      }
      const updates = { ...updatedApplication };
      delete updates.id; //*! REMOVED TO PREVENT CHANGING APP ID ON UPDATE
      await this.manager.createQueryBuilder(Application, 'Application').update({ ...updates }).whereInIds([id]).execute();
      const application = await this.findOneOrNull({ authEmail, appPIN });
      return { application };
    } catch (e) {
      error(`Error in application.repository.ts->Applications->saveApplication: ${e}`);
      throw e;
    }
  }

  async getId(uuid: string) {
    try {
      if (!uuid) {
        throw new Error('Could not find the application as no uuid was provided.');
      }
      const app = await this.manager.find(Application, {
        where: [
          { uuid },
        ],
      });
      return app[0]?.id || null;
    } catch (e) {
      error(`Error in application.repository.ts->Application->getId: ${e}`);
      throw e;
    }
  }

  async openAccount(authUserId: User['id'], uuid: Application['uuid'], month: number, year: number, managerId?: User['id']): Promise<User['id']> {
    try {
      if (!uuid) throw new Error('Could not find the application as no uuid was provided.');
      if (!authUserId) throw new Error('Could not open the account as authorization failed.');
      // const app = this.createQueryBuilder('application');
      const usersRepo = this.manager.getCustomRepository(Users);

      const application = await this.findOneOrNull({ authUserId, uuid });
      if (!application.applicantContact.email) {
        throw new Error('Could not open the account because the applicant email address is missing');
      }
      if (!application.clickedToSign) {
        throw new Error('Could not open the account because the application has not been signed.');
      }
      if (!application.dateEnded) {
        throw new Error('Could not open the account because the application has no completed date.');
      }

      if (!application) throw new Error(`Could not locate application with uuid ${uuid}`);
      let name = '';
      let lastName = '';
      const email = application.authEmail;
      let businessEntity = '';
      if (application.entityType === ApplicantEntityType.Individual) {
        name = application.applicantContact.name;
        lastName = application.applicantContact.lastName;
      } else {
        name = application.representativeContact.name;
        lastName = application.representativeContact.lastName;
        businessEntity = application.applicantContact.name;
      }

      const newAccount = await usersRepo.openAccount(authUserId, month, year, email, name, lastName, businessEntity, managerId);
      await this.manager.createQueryBuilder(Application, this.alias).update({ userId: newAccount.id }).whereInIds([application.id]).execute();
      return newAccount.id;
    } catch (e) {
      error(`Error in application.repository.ts->Application->openAccount: ${e}`);
      throw e;
    }
  }

  async findOneOrNull({
    authUserId, authEmail, uuid, appPIN,
  }: LookupQuery) {
    try {
      if ((authUserId != null && uuid == null) || (uuid != null && authUserId == null) || (authEmail != null && appPIN == null) || (appPIN != null && authEmail == null)) {
        throw new Error('Could not find the application as the lookup values were incorrect.');
      }

      const notDeleted = false;
      let query = await this.createQueryBuilder(this.alias)
        .where(new Brackets((whereExpression) => {
          whereExpression
            .where(`${this.alias}.uuid = :uuid and ${this.alias}.deleted = :notDeleted`, { uuid, notDeleted })
            .orWhere(`${this.alias}.authEmail = :authEmail and ${this.alias}.app_pin = :appPIN and ${this.alias}.deleted = :notDeleted`, { authEmail, appPIN, notDeleted });
        }));

      // eslint-disable-next-line no-constant-condition
      // query = false ? AppendApplicationAuthorizationQuery(query, fmId, alias) : query;
      if (authUserId) query = AppendApplicationAuthorizationQuery(query, authUserId, this.alias);
      const app = await query.getOne();
      return app || null;
    } catch (e) {
      error(`Error in application.repository.ts->Application->findOneOrNull: ${e}`);
      throw e;
    }
  }

  async findAllOrNone(authUserId: User['id']) {
    try {
      if (!authUserId) throw new Error('No authorization was provided when trying to query applications');
      let query = await this.createQueryBuilder(this.alias)
        .orderBy('id', 'DESC');
      query = AppendApplicationAuthorizationQuery(query, authUserId, this.alias);
      const apps = await query.getMany();
      return apps || [];
    } catch (e) {
      error(`Error in application.repository.ts->Application->findAllOrNone: ${e}`);
      throw e;
    }
  }

  async associateUserAccount(authUserId: User['id'], uuid: Application['uuid'], userId: Application['user']['id']) {
    try {
      const manager = await this.getManagerById(authUserId);
      if (!manager) throw new Error('No manager found when trying to locate application');
      const account = await this.getUserById(authUserId, userId);
      if (!account) throw new Error(`No user account with ${userId} found when trying to locate application`);
      const app = await this.findOneOrNull({ authUserId, uuid });
      if (!app) throw new Error(`No application with ID ${uuid} was located`);

      let message = `Successfully associated application ID ${app.id} with account ${account.accountNumber}`;
      if (app.user) {
        message = `Successfully moved application ID ${app.id} from account ${app.user.accountNumber} to account ${account.accountNumber}`;
      }
      app.user = account;
      await this.manager.createQueryBuilder(Application, 'Application').update({
        user: app.user,
      }).whereInIds([app.id]).execute();
      return { success: true, message };
    } catch (e) {
      error(`Error in application.repository.ts->Application->associateUserAccount: ${e}`);
      throw e;
    }
  }

  async deleteOne(authUserId: User['id'], uuid: Application['uuid']) {
    try {
      if (!authUserId || !uuid) return { success: false, message: 'Could not delete the application as no lookup values were provided.' };
      const id = await this.getId(uuid);
      if (!id) return { success: false, message: `Could not locate an application with uuid ${uuid}.` };
      const app = await this.findOneOrNull({ authUserId, uuid });
      if (!app) {
        return { success: false, message: `Cannot delete application uuid ${uuid} because the app was not found` };
      }
      const currentAppUser = await this.getUserById(authUserId, app.userId);
      if (currentAppUser?.status === UserAccountStatus.active) {
        return { success: false, message: `Cannot delete application uuid ${uuid} because account ${currentAppUser.accountNumber} is associated with the application` };
      }
      const result = await this.manager.createQueryBuilder(Application, 'application')
        .update({ deleted: true })
        .whereInIds([id]).execute();
      if (result.affected !== 1) {
        throw new Error(`There was an issue deleting the application corrects. ${result.affected} applications were deleted`);
      }
      return { success: true, message: `Successfully deleted application for ${app.authEmail} with PIN ${app.appPIN}` };
    } catch (e) {
      error(`Error in application.repository.ts->Application->deleteOne: ${e.message}`);
      return { success: false, message: e.message };
    }
  }
}
