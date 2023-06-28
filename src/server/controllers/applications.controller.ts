/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import {
  JsonController, Post, Req, Res, UseBefore, Body, Get,
} from 'routing-controllers';
import { error, security } from '@log';
import { getConnection } from '@lib/db';
import { Applications, Users } from '@repositories';
import { Application as ApplicationModel } from '@models';
import { API, endpoints } from '@api';
import { Emailer } from '@lib/email';
import { AuthMiddleware } from '@middleware/auth';
import { AuthenticateApplicant, LoginApplicant } from '@server/middleware/appAuth';
import { classToClass } from 'class-transformer';
import { Application } from '@entities';
import { isEmail } from 'class-validator';
import {
  ApplicantEntityType, DefaultApplicantAddress, DefaultContactInfo, IApplication, RoleId,
} from '@interfaces';
import {
  GenerateApplicationInvitationEmailTemplate, GenerateAccountOpenedEmailTemplate, Labels, GenerateApplicationCompleteEmailTemplate,
  getErrorEmailTemplate,
} from '@email';
import env from '@server/lib/env';

@JsonController()
export class ApplicationsController {
  @UseBefore(AuthMiddleware)
  @Post(API.Applications.Create.Route)
  async create(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Applications.Create.post>[0],
  ): ReturnType<typeof API.Applications.Create.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error(`The authUser was missing on the request to ${API.Applications.Create.Route}`);
      const { id: authUserId } = authUser;
      const { email, name, fmId } = body;
      if (!isEmail(email)) {
        return { error: 'Please enter a valid email address and try again' };
      }
      const connection = await getConnection();
      const usersRepo = connection.getCustomRepository(Users);
      const manager = (await usersRepo
        .accounts({ authUserId, accounts: { roles: [RoleId.manager, RoleId.director, RoleId.admin] } }))
        ?.find((m) => m.id === fmId);
      if (!manager) { throw new Error(`Could not locate manager ${fmId}`); }

      const appRepo = connection.getCustomRepository(Applications);
      const newApp = await appRepo.createApplication(manager.id, email, name);
      const { appPIN, uuid } = newApp;
      // Email the client if auth
      if (!appPIN || !uuid) throw new Error('Failed to create the application');
      const messages: string[] = [];
      try {
        const emailer = new Emailer();
        const emailTemplate = GenerateApplicationInvitationEmailTemplate({
          name, email, manager: manager.displayName, PIN: appPIN,
        });
        const emailResult = await emailer.sendMail({
          to: email,
          cc: manager.email,
          subject: Labels.getApplicationEmailSubject(),
          emailTemplate,
          sendingFunction: 'ApplicationsController.create',
        });
        if (!emailResult?.messageId) { throw new Error(`Failed to send email to ${email} for application ${uuid}`); }
        messages.push(`Sent application invitation to ${email}, cc ${manager.email}.`);
      } catch (e) {
        messages.push(e.message);
      }
      return { message: messages.join(' ') };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to create the application: ${err}` };
    }
  }

  @UseBefore(AuthMiddleware)
  @Post(API.Applications.Delete.Route)
  async delete(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Applications.Delete.post>[0],
  ): ReturnType<typeof API.Applications.Delete.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error(`The authUser was missing on the request to ${API.Applications.Delete.Route}`);
      const { id: authUserId } = authUser;
      const { uuid } = body;
      const connection = await getConnection();
      const appRepo = connection.getCustomRepository(Applications);
      const { success, message } = await appRepo.deleteOne(authUserId, uuid);
      return { success, message };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { success: false, error: `An error occurred while trying to delete the application: ${err}` };
    }
  }

  @UseBefore(AuthMiddleware)
  @Get(API.Applications.List.Route)
  async list(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.Applications.List.get> {
    try {
      const { authUser: user } = req.user;
      if (!user) throw new Error(`The authUser was missing on the request to ${API.Applications.List.Route}`);
      const connection = await getConnection();
      const appRepo = connection.getCustomRepository(Applications);
      const apps = await appRepo.findAllOrNone(user.id);
      security(`User ${user.displayName} accessed applications ${apps.map(({ uuid }) => uuid).join(', ')}`);

      const applications = apps.map(({
        id, uuid, fmId, authEmail, appPIN, Started, dateCreated, dateEnded, applicantContact: { name }, userId,
      }) => ({
        id, uuid, fmId, authEmail, appPIN, Started, dateCreated, dateEnded, name, userId,
      }));
      return {
        applications,
      };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load applications: ${err}` };
    }
  }

  @UseBefore(AuthMiddleware)
  @Post(API.Applications.View.Route)
  async view(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Applications.View.post>[0],
  ): ReturnType<typeof API.Applications.View.post> {
    try {
      const { authUser: user } = req.user;
      if (!user) throw new Error(`The authUser was missing on the request to ${API.Applications.View.Route}`);
      const { uuid } = body;
      const connection = await getConnection();
      const appRepo = connection.getCustomRepository(Applications);
      const application = await appRepo.findOneOrNull({ authUserId: user.id, uuid });
      security(`User ${user.displayName} accessed application ${application.uuid}`);

      return {
        application,
      };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to view the application: ${err}` };
    }
  }

  @UseBefore(AuthMiddleware)
  @Post(API.Applications.OpenAccount.Route)
  async openAccount(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Applications.OpenAccount.post>[0],
  ): ReturnType<typeof API.Applications.OpenAccount.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error(`The authUser was missing on the request to ${API.Applications.OpenAccount.Route}`);
      const {
        uuid, month, year, managerId,
      } = body;
      const connection = await getConnection();
      const appRepo = connection.getCustomRepository(Applications);
      const newAccountId = await appRepo.openAccount(authUser.id, uuid, month, year, managerId);

      if (!newAccountId) throw new Error(`Unable to open the account with uuid ${uuid}`);
      const usersRepo = connection.getCustomRepository(Users);
      const newAccount = await usersRepo.getUserById({ authUserId: authUser.id, id: newAccountId });
      const manager = await usersRepo.getUserById({ authUserId: authUser.id, id: newAccount.fmId });
      if (!manager) throw new Error(`Unable to locate manager ${managerId}`);
      const messages = [];

      const { account, hash, expiration } = await usersRepo.startPasswordReset({ email: newAccount.email }, false);
      if (!(hash && expiration)) {
        messages.push('Unable to start password reset after opening the account.');
      } else {
        const encodedHash = encodeURIComponent(hash);
        const link = `${env.isProduction ? env.var.SITE_HOST : 'http://localhost:8080'}${endpoints.passwordReset}?resetKey=${encodedHash}`;
        const emailer = new Emailer();
        const emailTemplate = GenerateAccountOpenedEmailTemplate({
          name: account.name,
          accountNumber: account.accountNumber,
          link,
        });
        const result = await emailer.sendMail({
          to: account.email,
          cc: manager.email,
          subject: Labels.getAccountOpenedEmailSubject(),
          emailTemplate,
          sendingFunction: 'ApplicationsController.openAccount',
        });
        if (!result) messages.push('Unable to send password initialization email. A manual password reset my be required.');
      }
      return {
        message: messages?.length
          ? messages.join(' ')
          : `Account opening email has been sent to ${account.email}, cc ${manager.email}. Account number is ${account.accountNumber}.`,
      };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to open the account: ${err}` };
    }
  }

  @UseBefore(LoginApplicant)
  @Post(API.Applications.Load.Route)
  async load(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.Applications.Load.post> {
    try {
      if (!req.user.application) { return { error: 'You must sign in to access that information.' }; }
      const { authEmail, appPIN } = req.user.application;
      const connection = await getConnection();
      const appRepo = connection.getCustomRepository(Applications);
      const application = await appRepo.findOneOrNull({ authEmail, appPIN });
      security(`Applicant ${authEmail} accessed application ${application.uuid}`);
      const validationMessages = await ApplicationModel.getValidationMessages(application, true);
      return { application, validationMessages };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load the application: ${err}` };
    }
  }

  @UseBefore(AuthenticateApplicant)
  @Get(API.Applications.Load.Route)
  async loadFromSession(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.Applications.Load.post> {
    try {
      if (!req.user.application) { return { error: 'You must sign in to access that information.' }; }
      const { authEmail, appPIN } = req.user.application;
      const connection = await getConnection();
      const appRepo = connection.getCustomRepository(Applications);
      const application = await appRepo.findOneOrNull({ authEmail, appPIN });
      security(`Applicant ${authEmail} accessed application ${application.uuid}`);
      const validationMessages = await ApplicationModel.getValidationMessages(application, true);
      return { application, validationMessages };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load the application session: ${err}` };
    }
  }

  @UseBefore(AuthenticateApplicant)
  @Post(API.Applications.Save.Route)
  async save(
    @Req() req: HTTPRequest,
    @Body() body: Parameters<typeof API.Applications.Save.post>[0],
  ): ReturnType<typeof API.Applications.Save.post> {
    try {
      let authEmail;
      let appPIN;
      let authUserId;
      let savedApplication: IApplication;
      if ((!req.user.application?.authEmail || !req.user.application?.appPIN) && !req.user.authUser) {
        throw new Error('Unable to save the application because the user is not authenticated.');
      }
      const connection = await getConnection();
      const appRepo = connection.getCustomRepository(Applications);
      if (req.user.application?.authEmail && req.user.application?.appPIN) {
        ({ authEmail, appPIN } = req.user.application);
        savedApplication = await appRepo.findOneOrNull({ authEmail, appPIN });
      } else {
        authUserId = req.user.authUser.id;
        ({ authEmail, appPIN } = body.application);
        savedApplication = await appRepo.findOneOrNull({ authUserId, uuid: body.application.uuid });
      }
      const { application: userInput } = body;
      if (!savedApplication) throw new Error(`Unable to locate application with email ${authEmail} and PIN ${appPIN}`);
      if (savedApplication.dateEnded) throw new Error('Unable to save application as it has been completed');

      //* remove props applicant should not be able to change
      // TODO saving user input needs security review
      const restrictedFields: (keyof Application)[] = [
        'id', 'deleted', 'appPIN', 'authEmail', 'status', 'note', 'manager',
        'fmId', 'managerEmail', 'managerName', 'user',
        'userId', 'dateCreated', 'dateEnded', 'Started', 'uuid', 'documentLink'];
      restrictedFields.forEach(<K extends keyof Application>(key: K) => {
        delete userInput[key];
      });
      const updatedApplication = classToClass<Application>({ ...savedApplication, ...userInput });

      //* Update information that needs to be computed server-side
      if (!savedApplication.Started) { updatedApplication.Started = Date.now(); }
      if (updatedApplication.entityType === ApplicantEntityType.Individual) {
        const rep = updatedApplication.representativeContact;
        const appl = updatedApplication.applicantContact;
        if (JSON.stringify(rep.mailingAddress) === JSON.stringify(DefaultApplicantAddress)) {
          rep.mailingAddress = appl.legalAddress;
        }
        if (!rep.name) rep.name = appl.name;
        if (!rep.lastName) rep.lastName = appl.lastName;
        if (!rep.identificationNumber) rep.identificationNumber = appl.identificationNumber;
        if (rep.phone === DefaultContactInfo.phone) {
          rep.phone = appl.phone;
        }
        if (rep.email === DefaultContactInfo.email) {
          rep.email = appl.email;
        }
      }
      if (updatedApplication.clickedToSign) { updatedApplication.dateEnded = Date.now(); }

      const validationMessages = await ApplicationModel.getValidationMessages(updatedApplication);
      if (updatedApplication.clickedToSign && !validationMessages) {
        updatedApplication.dateEnded = Date.now();
      }

      const { application } = await appRepo.saveApplication(authEmail, appPIN, updatedApplication);
      if (application.clickedToSign) {
        const emailer = new Emailer();
        try {
          const to = application.authEmail;
          const cc = application.managerEmail;
          const subject = Labels.getApplicationCompleteEmailSubject();
          const emailTemplate = GenerateApplicationCompleteEmailTemplate({ name: application.applicantContact.name });
          const result = await emailer.sendMail({
            to,
            cc,
            subject,
            emailTemplate,
            sendingFunction: 'ApplicationController.appSigned',
          });
          if (!result?.messageId) {
            throw new Error(`Failed to email ${application.authEmail}, cc ${application.managerEmail} for application ${application.uuid}`);
          }
        } catch (e) {
          error(e.message);
          emailer.sendMail({
            to: env.var.EMAIL_DEV,
            subject: e.message,
            emailTemplate: getErrorEmailTemplate(e.message),
            sendingFunction: 'ApplicationController.save',
          });
        }
      }
      return { application, validationMessages };
    } catch ({ message: err }) {
      error(err);
      return { error: `An error occurred while trying to save the application: ${err}` };
    }
  }
}
