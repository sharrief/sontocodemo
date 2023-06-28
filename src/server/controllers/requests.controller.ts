/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import ReactDOMServer from 'react-dom/server';
import {
  JsonController, Body, Get, Post, Req, Res, UseBefore, QueryParams,
} from 'routing-controllers';
import { flatten } from 'array-flatten';
import env from '@lib/env';
import { error as logError } from '@log';
import {
  BankAccountStatus,
  OperationType, RequestStatus,
} from '@interfaces';
import { API } from '@api';
import { AuthMiddleware } from '@middleware/auth';
import { getConnection } from '@lib/db';
import { Emailer } from '@lib/email';
import {
  creditPostedEmailTemplate, distributionPostedEmailTemplate, generateDistributionRequestMadeRecurringTemplate,
  generateDistributionRequestCancelTemplate,
  Labels as EmailLabels,
} from '@email';

import { GetOptedOutManagerIds, DocumentsController } from '@controllers';
import {
  BankData, Documents, Requests, Statements, Users,
} from '@repositories';
import { Labels } from '@repositories/labels';
import { DateTime } from 'luxon';
import { EffectiveMonthFormat } from 'shared/api/admin.api';
import Brand from '@brand/brandLabels';

// TODO: Use path (@Param()) and query params (@Params()) for Read operations, instead of @Body
@JsonController()
@UseBefore(AuthMiddleware)
export class RequestsController {
  @Get(API.Admin.Requests.Route)
  async adminRequestsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @QueryParams() params: Parameters<typeof API.Admin.Requests.get>[0],
  ): ReturnType<typeof API.Admin.Requests.get> {
    try {
      const { authUser } = req.user;
      if (authUser == null) throw new Error('The user was missing on the request.');
      // if (authUser)'
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Requests);
      const { status, effectiveMonth } = params;
      const { month, year } = effectiveMonth ? DateTime.fromFormat(effectiveMonth, EffectiveMonthFormat) : { month: undefined, year: undefined };
      let limit = +params.limit;
      if (!limit) limit = 10;
      const { requests, count, page } = await repo.find({
        authUserId, ...params, month, year, limit, statuses: ((status as unknown as string)?.split(',') as RequestStatus[]),
      });
      const sortedRequests = flatten(requests)
        .sort(({ id: a }, { id: b }) => b - a);
      return {
        requests: sortedRequests,
        pageCount: (limit) > count ? 1 : Math.ceil(count / (limit || 1)),
        totalCount: count,
        pageIndex: page,
      };
    } catch ({ message: error }) {
      res.status(400);
      logError(error);
      return { error };
    }
  }

  @Post(API.Requests.FindById.Route)
  async findById(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Requests.FindById.post>[0],
  ): ReturnType<typeof API.Requests.FindById.post> {
    try {
      const { authUser } = req.user;
      if (authUser == null) throw new Error('The user was missing on the request.');
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Requests);
      const { id } = body;
      if (!id) return { error: `Could not locate a request because an id was not provided (${id}).` };
      const { requests } = await repo.find({ authUserId, id });
      const request = requests.find(({ id: i }) => i === id);
      return { request };
    } catch ({ message: error }) {
      logError(error);
      res.status(400);
      return {
        error: `An error ocurred while trying to find the operation request: ${error}.`,
      };
    }
  }

  @Post(API.Requests.FindActive.Route)
  async findActiveRequestsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Requests.FindActive.post>[0],
  ): ReturnType<typeof API.Requests.FindActive.post> {
    try {
      const { authUser } = req.user;
      if (authUser == null) throw new Error('The user was missing on the request.');
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Requests);
      const { countOnly, accountNumber } = body;
      let { userId } = body;
      if (accountNumber) {
        const usersRepo = connection.getCustomRepository(Users);
        const [account] = await usersRepo.accounts({ authUserId, accounts: { accountNumbers: [accountNumber] } });
        if (!account) throw new Error('The account could not be loaded.');
        ({ id: userId } = account);
      }
      const { requests } = await repo.find({
        authUserId, userId, statuses: [RequestStatus.Pending, RequestStatus.Recurring, RequestStatus.Approved], withDocuments: true, withOperations: true,
      });
      const statementsRepo = connection.getCustomRepository(Statements);
      const statements = await statementsRepo.find({ authUserId, accountNumber });
      const pendingRequests = requests.filter(({ status }) => [RequestStatus.Pending, RequestStatus.Recurring].includes(status));
      const approvedRequestsWithoutStatement = requests
        .filter(({ status }) => status === RequestStatus.Approved)
        .filter(({ operations }) => operations?.find(({ month, year }) => !statements?.find(({ month: sm, year: sy }) => sm === month && sy === year)));
      const activeRequests = [...pendingRequests, ...approvedRequestsWithoutStatement];
      if (countOnly) {
        return {
          counts: activeRequests.reduce((counts, { userId: id }) => ({ ...counts, [id]: (counts[id] || 0) + 1 }), {} as { [key: number]: number}),
        };
      }
      return { requests: activeRequests };
    } catch ({ message: error }) {
      logError(error);
      res.status(400);
      return {
        error: `An error ocurred while trying to find the operation request: ${error}.`,
      };
    }
  }

  @Get(API.Requests.GetCountOfPendingByUser.Route)
  async countPendingOperationRequestsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.Requests.GetCountOfPendingByUser.get> {
    try {
      const { authUser } = req.user;
      if (authUser == null) throw new Error('The user was missing on the request.');
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Users);
      const operationRequestPendingCounts = await repo.getCountOfPendingRequests({ authUserId });
      return { operationRequestPendingCounts };
    } catch ({ message: error }) {
      logError(error);
      res.status(400);
      return { error };
    }
  }

  @Post(API.Requests.Create.Route)
  async newRequestRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Requests.Create.post>[0],
  ): ReturnType<typeof API.Requests.Create.post> {
    try {
      const { authUser } = req.user;
      if (authUser == null) throw new Error('The user was missing on the request.');
      if (env.var.NEW_REQUESTS_DISABLED === true) throw new Error('New requests are currently disabled');
      const { id: authUserId } = authUser;
      const {
        accountNumber, amount, sendEmail, bankUUID,
      } = body;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Requests);
      const { request } = await repo.handleRequestSubmission({
        authUserId,
        accountNumber,
        amount,
        bankUUID,
      });
      if (!request) {
        throw new Error('The server was unable to create the request.');
      } else {
        let message = Labels.CreatedRequest(request);
        const sendBy = DateTime.fromMillis(request.datetime).plus({ month: 1 }).valueOf();
        const result = await DocumentsController.register(authUserId, request.id, sendEmail, sendBy);
        if (result?.message) { message += ` ${result.message}`; }
        return { request, message, success: true };
      }
    } catch ({ message: error }) {
      logError(error);
      res.status(400);
      const message = `An error ocurred while trying to create the operation request: ${error}.`;
      return { error: message, message, success: false };
    }
  }

  @Post(API.Requests.Update.Route)
  async updateRequestRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Requests.Update.post>[0],
  ): ReturnType<typeof API.Requests.Update.post> {
    try {
      const { authUser } = req.user;
      if (authUser == null) throw new Error('The user was missing on the request.');
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Requests);
      const {
        id, amount, status, bankAccountUUID, wireConfirmation,
      } = body;
      const { error, request, message } = await repo.handleRequestUpdate({
        authUserId, id, amount, status, bankAccountUUID, wireConfirmation,
      });
      if (error) {
        return { error, message: error, success: false };
      }
      if (!request) {
        if (message) {
          return { message, success: false };
        }
        throw new Error('The attempt to update the request failed.');
      }
      return { request, message, success: true };
    } catch ({ message: error }) {
      res.status(400);
      return { error, message: error, success: false };
    }
  }

  @Post(API.Requests.Post.Route)
  async postOperationRequest(
    @Req() req: HTTPRequest,
    @Body() body: Parameters<typeof API.Requests.Post.post>[0],
  ): ReturnType<typeof API.Requests.Post.post> {
    const {
      id, adjustment,
      month,
      year,
      wireConfirmation,
      wireAmount,
      wireDay,
      wireMonth,
      wireYear,
      bankEndingUUID,
      emailMessage,
      sendEmail,
    } = body;
    try {
      const messages = [];
      const { authUser } = req.user;
      if (authUser == null) throw new Error('The user was missing on the request.');
      const { id: authUserId } = authUser;
      if (!(id && year && month && id && wireDay && wireMonth && wireYear)) {
        throw new Error(Labels.CannotPostBecauseMissing(id));
      }
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Requests);
      const { request, operation, error } = await repo.handleRequestPost({
        authUserId, id, wireAmount, adjustment, month, year, wireConfirmation,
      });
      if (error) { throw new Error(error); }
      messages.push(`Posted request ${request.id} as operation ${operation.id}.`);
      if (!operation.id) {
        throw new Error('The post was not fully successful. An operation ID was not provided after the attempt to post the request.');
      } else {
        const { user } = request;
        if (!user) messages.push(`Could not locate user with ID ${request.userId} to email.`);

        const { manager } = user;
        if (!manager) messages.push(`Could not locate manager ${user.fmId} to email.`);

        // Update the document
        const { error: docSaveError, document: savedDocument } = await DocumentsController.updateDocumentByRequest(authUser.id, request);
        if (docSaveError) {
          messages.push(`Could not update the document after posting the operation because: ${docSaveError || 'no error message provided'}.`);
        }

        if (sendEmail) {
          const managerHasOptedOutOfEmails = GetOptedOutManagerIds().includes(manager.id);
          let mailResult = { messageId: null as string };
          const to = `${user.displayName} <${user.email}>`;
          const cc = `${manager.username} <${manager.email}>`;
          const bcc = env.var.EMAIL_ADMIN;
          let emailTemplate: JSX.Element = null;

          const Email = new Emailer();
          if (request.type === OperationType.Credit) {
            emailTemplate = creditPostedEmailTemplate({
              requestId: request.id,
              displayName: authUser.displayName,
              ps: emailMessage,
              siteUrl: env.var.SITE_URL,
            });
            if (managerHasOptedOutOfEmails) {
              messages.push(`Did not send email because: ${managerHasOptedOutOfEmails ? ' Manager has opted out of emails.' : ''}`);
            } else {
              mailResult = await Email.sendMail({
                to,
                cc,
                bcc,
                subject: EmailLabels.getRequestEmailSubject(request),
                emailTemplate,
                sendingFunction: 'RequestsController.postOperationRequest(credit)',
              });
              messages.push(`Sent email to ${to} and cc'd ${cc}.`);
            }
          } else if (request.type === OperationType.Debit) {
            emailTemplate = distributionPostedEmailTemplate({
              requestId: request.id,
              siteUrl: env.var.SITE_URL,
              displayName: authUser.displayName,
              ps: emailMessage,
            });
            const bankAccountRepo = connection.getCustomRepository(BankData);
            const bankAccounts = await bankAccountRepo.find(authUserId, [user.id]);
            const bankAccount = bankAccounts.find(({ uuid }) => uuid === bankEndingUUID);
            if (!bankAccount) messages.push(`Could not locate the saved bank information for account ${user.accountNumber}.`);
            const { DCAF, status } = bankAccount;
            const accountHasDCAF = bankAccount && DCAF && DCAF.startsWith(env.var.SITE_FILE_HOST);
            if (managerHasOptedOutOfEmails || (!accountHasDCAF && status !== BankAccountStatus.Validated)) {
              messages.push(`Did not send email because: ${managerHasOptedOutOfEmails ? ' Manager has opted out of emails.' : ''}${accountHasDCAF ? '' : ' Account does not have a DCAF on file.'}${status !== BankAccountStatus.Validated ? '' : ' The bank account info has not been validated.'}`);
            } else {
              mailResult = await Email.sendMail({
                to,
                cc,
                bcc,
                subject: `${env.isDevelopment ? 'DEV TEST: ' : ''}${Brand.ShortName} ${request.type} request #${request.id}`,
                emailTemplate,
                sendingFunction: 'RequestsController.postOperationRequest(debit)',
              });
              if (!mailResult || !mailResult.messageId) {
                messages.push(`Failed to send the email to ${to} and ${cc} for some reason.`);
              } else {
                messages.push(` Sent email to ${to} and cc'd ${cc}`);
              }
            }
          }
        }
        return {
          request, operation, message: messages.join(' '), document: savedDocument, success: true,
        };
      }
    } catch ({ message: error }) {
      logError(error);
      return { error, message: '', success: false };
    }
  }

  @Post(API.Requests.MakeRecurring.Route)
  async recurOperationRequest(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Requests.MakeRecurring.post>[0],
  ): ReturnType<typeof API.Requests.MakeRecurring.post> {
    try {
      const { authUser } = req.user;
      if (authUser == null) throw new Error('The user was missing on the request.');
      const { id, sendEmail, monthAndYear } = body;
      let month;
      let year;
      if (monthAndYear) {
        ({ month, year } = monthAndYear);
      } else {
        month = DateTime.now().month;
        year = DateTime.now().year;
      }
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Requests);
      const { request, error } = await repo.makeRequestRecurring({ authUserId, id });
      if (error) {
        throw new Error(`The server was unable to make the request recurring: ${error}.`);
      }
      const { error: docSaveError, document: savedDocument } = await DocumentsController.updateDocumentByRequest(authUser.id, request);
      if (docSaveError) throw new Error(docSaveError);
      let message = Labels.MadeRequestRecurring(request);
      if (sendEmail) {
        const usersRepo = connection.getCustomRepository(Users);
        const [client] = await usersRepo.accounts({ authUserId, accounts: { ids: [request.userId] }, withManager: true });
        const { manager } = client;
        if (!client || !manager) {
          message += ' We were unable to email the client and manager because one of their accounts could not be located.';
        } else {
          const bankRepo = connection.getCustomRepository(BankData);
          const bankAccounts = await bankRepo.find(authUserId, [client.id]);
          const preferredAccount = bankAccounts?.find(({ DCAF, preferred }) => DCAF && preferred);
          const to = `${client.name} ${client.lastname} <${client.email}>`;
          const cc = `${manager.username} <${manager.email}>`;
          message = Labels.MadeRequestRecurring(request, {
            client: to,
            manager: cc,
          });
          const emailTemplate = generateDistributionRequestMadeRecurringTemplate(request, env.var.SITE_URL, DateTime.fromObject({ month, year }));
          const emailer = new Emailer();
          emailer.sendMail({
            to,
            cc,
            subject: EmailLabels.getRequestEmailSubject(request),
            emailTemplate,
            sendingFunction: 'RequestsController.recurOperationRequest',
          });
        }
      }
      return { request, document: savedDocument, message };
    } catch ({ message: error }) {
      res.status(400);
      logError(error);
      return { error };
    }
  }

  @Post(API.Requests.Cancel.Route)
  async cancelOperationRequest(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Requests.Cancel.post>[0],
  ): ReturnType<typeof API.Requests.Cancel.post> {
    try {
      const { authUser } = req.user;
      if (authUser == null) throw new Error('The user was missing on the request.');
      const { id, sendEmail, emailMessage } = body;
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Requests);
      const { request, error } = await repo.cancelRequest({ authUserId, id });
      if (error) {
        throw new Error(`The server was unable to cancel the request: ${error}.`);
      }
      let message = Labels.CancelledRequest(request);

      if (request.status !== RequestStatus.Voided) {
        message = Labels.CouldNotCancelledRequest(request);
        return { request, message };
      }
      const docs = connection.getCustomRepository(Documents);
      let [document] = await docs.findByRequestId(authUserId, [request.id]);
      if (document) {
        document = await docs.cancel(authUserId, document.id);
      }
      if (sendEmail) {
        const usersRepo = connection.getCustomRepository(Users);
        const [client] = await usersRepo.accounts({ authUserId, accounts: { ids: [request.userId] }, withManager: true });
        const { manager } = client;
        if (!client || !manager) {
          message += ' We were unable to email the client and manager because one of their accounts could not be located.';
        } else {
          const to = `${client.name} ${client.lastname} <${client.email}>`;
          const cc = `${manager.username} <${manager.email}>`;
          message = Labels.CancelledRequest(request, {
            client: to,
            manager: cc,
          });
          const emailTemplate = generateDistributionRequestCancelTemplate(request, env.var.SITE_URL, manager.username, emailMessage, authUser.displayName);
          const emailer = new Emailer();
          emailer.sendMail({
            to,
            cc,
            subject: EmailLabels.getRequestEmailSubject(request),
            emailTemplate,
            sendingFunction: 'RequestsController.cancelOperationRequest',
          });
        }
      }
      return { request, message, document };
    } catch ({ message: error }) {
      res.status(400);
      logError(error);
      return { error };
    }
  }
}
