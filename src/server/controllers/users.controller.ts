/* eslint-disable class-methods-use-this */
import {
  JsonController, Get, Post, Req, Res, UseBefore, Body,
} from 'routing-controllers';
import { Users } from '@repositories';
import { error, info } from '@log';
import { API, endpoints } from '@api';
import {
  getConnection,
} from '@lib/db';
import { AuthMiddleware } from '@middleware/auth';
import { Request, Response } from 'express';
import { Emailer } from '@lib/email';
import {
  getPasswordResetTemplate,
  getPasswordResetCompleteTemplate,
  Labels as EmailLabels,
  GenerateAccountOpenedEmailTemplate,
  getAccountInfoChangedTemplate,
} from '@email';
import env from '@server/lib/env';
import { validatePassword } from '@validation';
import ReactDOMServer from 'react-dom/server';

@JsonController()
export class UsersController {
  @UseBefore(AuthMiddleware)
  @Get(API.Users.SignedInV2.Route)
  async usersRoute(
    @Req() req: Request,
  ): ReturnType<typeof API.Users.SignedInV2.get> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to usersRoute.');
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const [foundUser] = await UsersRepo.accounts({ authUserId, accounts: { ids: [authUserId] } });
      if (foundUser == null || foundUser.id !== authUserId) throw new Error(`Unable to find a user with id ${authUserId}`);
      return { user: foundUser };
    } catch ({ message: err }) {
      error(err);
      return { error: `An error occurred while trying to load users: ${err}` };
    }
  }

  @UseBefore(AuthMiddleware)
  @Post(API.Users.DisableOTP.Route)
  async disableOTP(
    @Req() req: Request,
    @Body() body: Parameters<typeof API.Users.DisableOTP.post>[0],
  ): ReturnType<typeof API.Users.DisableOTP.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error(`The authUser was missing on the request to ${API.Users.DisableOTP.Route}`);
      const { password } = body;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const { success, error } = await UsersRepo.disableOTPRequirements(authUser.id, password);
      return { success, message: error };
    } catch ({ message: err }) {
      error(err);
      return { error: err };
    }
  }

  @UseBefore(AuthMiddleware)
  @Get(API.Users.GenerateTempOTPSecret.Route)
  async generateTempOTPSecret(
    @Req() req: Request,
  ): ReturnType<typeof API.Users.GenerateTempOTPSecret.get> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error(`The authUser was missing on the request to ${API.Users.GenerateTempOTPSecret.Route}`);
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const { tempSecret: secret } = await UsersRepo.createTempOTPSecret(authUser.id);
      return { secret };
    } catch ({ message: err }) {
      error(err);
      return { error: err };
    }
  }

  @UseBefore(AuthMiddleware)
  @Post(API.Users.ValidateTempOTPSecret.Route)
  async validateTempOTPSecret(
    @Req() req: Request,
    @Body() body: Parameters<typeof API.Users.ValidateTempOTPSecret.post>[0],
  ): ReturnType<typeof API.Users.ValidateTempOTPSecret.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error(`The authUser was missing on the request to ${API.Users.ValidateTempOTPSecret.Route}`);
      const authUserId = authUser.id;
      const { code, password } = body;
      if (!code) throw new Error('The code was missing during setup of the security option');
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const isValid = await UsersRepo.validateTempOPTSecret(authUserId, code, password);
      return { success: isValid, message: '' };
    } catch ({ message: err }) {
      error(err);
      return { error: err };
    }
  }

  @UseBefore(AuthMiddleware)
  @Post(API.Users.OpenAccount.Route)
  async openAccount(
    @Req() req: Request,
    @Body() body: Parameters<typeof API.Users.OpenAccount.post>[0],
  ): ReturnType<typeof API.Users.OpenAccount.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error(`The authUser was missing on the request to ${API.Applications.OpenAccount.Route}`);

      const {
        month, year, sendEmail,
        email, name, lastName,
        businessEntity, managerId,
      } = body;
      const connection = await getConnection();
      const usersRepo = connection.getCustomRepository(Users);
      const newAccount = await usersRepo.openAccount(authUser.id, month, year, email, name, lastName, businessEntity, managerId);
      if (!newAccount?.id) throw new Error(`Unable to open the account for ${name} ${lastName} - ${businessEntity}`);
      const manager = await usersRepo.getUserById({ authUserId: authUser.id, id: newAccount.fmId });
      if (!manager) throw new Error(`Unable to locate manager ${managerId}`);
      const messages = [];
      const { account, hash, expiration } = await usersRepo.startPasswordReset({ email: newAccount.email }, false);
      if (!(hash && expiration)) {
        messages.push('Unable to start password reset after opening the account.');
      } else if (sendEmail) {
        const encodedHash = encodeURI(hash);
        const link = `${env.isProduction ? env.var.SITE_HOST : 'http://localhost:8080'}${endpoints.passwordReset}?resetKey=${encodedHash}`;
        const emailTemplate = GenerateAccountOpenedEmailTemplate({
          name: account.name,
          accountNumber: account.accountNumber,
          link,
        });
        const emailer = new Emailer();
        const result = await emailer.sendMail({
          to: account.email,
          cc: manager.email,
          subject: EmailLabels.getAccountOpenedEmailSubject(),
          emailTemplate,
          sendingFunction: 'UsersController.openAccount',
        });
        if (!result) messages.push('Unable to send password initialization email. A manual password reset my be required.');
      }

      return {
        success: true,
        message: messages?.length
          ? messages.join(' ')
          : `Successfully opened account for ${newAccount.businessEntity || `${newAccount.name} ${newAccount.lastname}`} under ${manager.username}. Sign in email: ${newAccount.email}. Account number: ${newAccount.accountNumber}. ${sendEmail ? `Sent password reset email to ${newAccount.email}.` : ''}`,
      };
    } catch ({ message: err }) {
      error(err);
      return { error: err };
    }
  }

  @Post(API.Users.StartPasswordReset.Route)
  async startPasswordResetRoute(
    @Body() body: Parameters<typeof API.Users.StartPasswordReset.post>[0],
  ): ReturnType<typeof API.Users.StartPasswordReset.post> {
    try {
      const { email } = body;
      if (!email) return { message: 'You must specify an email address to reset a password.' };
      info(`Password reset requested for ${email}`);
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const {
        account, hash,
      } = await UsersRepo.startPasswordReset({ email });
      if (account && hash) {
        const encodedHash = encodeURI(hash);
        const emailer = new Emailer();
        const to = account.email;
        const link = `${env.isProduction ? env.var.SITE_HOST : 'http://localhost:8080'}${endpoints.passwordReset}?resetKey=${encodedHash}`;
        const emailTemplate = getPasswordResetTemplate(link, env.var.EMAIL_ADMIN);
        await emailer.sendMail({
          to,
          subject: EmailLabels.getResetPasswordEmailSubject(),
          emailTemplate,
          sendingFunction: 'UsersController.startPasswordResetRoute',
        });
        info(`Password reset email sent to ${email}`);
      }
      return { message: 'If the email address is associated with an account, then we have sent an email with a password reset link. The link expires in approximately an hour.' };
    } catch ({ message: err }) {
      error(err);
      return { message: 'If the email address is associated with an account, then we have sent an email with a password reset link. The link expires in approximately an hour.' };
    }
  }

  @Post(API.Users.DoPasswordReset.Route)
  async doPasswordResetRoute(
    @Res() res: Response,
    @Body() body: Parameters<typeof API.Users.DoPasswordReset.post>[0],
  ): ReturnType<typeof API.Users.DoPasswordReset.post> {
    try {
      const { resetKey, newPassword } = body;
      if (!resetKey) throw new Error('Sorry, it appears that your password reset link is broken. Please start the password reset process over again.');
      if (!newPassword) throw new Error('Sorry, your password cannot be blank. Please enter a new password.');
      const { requirements, valid } = validatePassword(newPassword);
      if (!valid) {
        throw new Error(`Sorry, your password has not met the minimum requirements. The following requirements were not satisfied: ${requirements.join(', ')}.`);
      }
      const decodedKey = decodeURI(resetKey);
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      try {
        const {
          message, email,
        } = await UsersRepo.doPasswordReset({ resetKey: decodedKey, newPassword });
        const emailer = new Emailer();
        const to = email;
        const emailTemplate = getPasswordResetCompleteTemplate(env.var.EMAIL_ADMIN);
        await emailer.sendMail({
          to,
          subject: EmailLabels.getResetPasswordCompleteEmailSubject(),
          emailTemplate,
          sendingFunction: 'UsersController.doPasswordResetRoute',
        });
        return { message: `${message} Please sign in using your new password.` };
      } catch (e) {
        e.message = `Sorry, we were unable to process the password reset. ${e.message}`;
        throw e;
      }
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: err };
    }
  }

  @UseBefore(AuthMiddleware)
  @Post(API.Users.EditAccount.Route)
  async editAccount(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: Parameters<typeof API.Users.EditAccount.post>[0],
  ): ReturnType<typeof API.Users.EditAccount.post> {
    try {
      const { authUser: { id: authUserId } } = req.user;
      const { id, account: partialAccount } = body;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      try {
        const [oldAcconutInfo] = await UsersRepo.accounts({ authUserId, accounts: { ids: [id] }, withManager: true });
        const oldManager = oldAcconutInfo.manager;
        const {
          message, error: err,
        } = await UsersRepo.doEditAccount({ authUserId, id, partialAccount });
        if (err) { return { error: err }; }
        const requestor = await UsersRepo.getUserById({ authUserId, id: authUserId });
        const [newAccountInfo] = await UsersRepo.accounts({ authUserId, accounts: { ids: [id] }, withManager: true });
        const newManager = newAccountInfo.manager;
        const cc = [];
        const { displayName, email: managerEmail } = requestor;
        cc.push(env.var.EMAIL_REPLY_TO);
        const emailer = new Emailer();
        const to = `${displayName} <${managerEmail}>`;
        const emailTemplate = getAccountInfoChangedTemplate(requestor.displayName, oldManager.displayName, newManager.displayName, oldAcconutInfo, newAccountInfo);
        await emailer.sendMail({
          to,
          cc,
          subject: EmailLabels.getAccountInfoChangedEmailSubject(),
          emailTemplate,
          sendingFunction: 'UsersController.editAccount',
        });
        return { message };
      } catch (e) {
        e.message = `Sorry, we were unable to process the changes to the account: ${e.message}`;
        throw e;
      }
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: err };
    }
  }
}
