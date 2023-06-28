/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import ReactDOMServer from 'react-dom/server';
import {
  JsonController, Req, Res, Body, Post, UseBefore,
} from 'routing-controllers';
import {
  BankData, Documents, Requests, Users,
} from '@repositories';
import { API } from '@api';
import { AuthMiddleware } from '@middleware/auth';
import { getConnection } from '@lib/db';
import { Emailer } from '@lib/email';
import {
  Request, User,
} from '@entities';
import {
  GetDocumentStatusByStage,
  DocumentStage, OperationType, RequestStatus,
} from '@interfaces';
import { Labels } from '@repositories/labels';
import { creditRequestedEmailTemplate, distributionRequestedEmailTemplate, Labels as EmailLabels } from '@email';
import env from '@server/lib/env';

@JsonController()
@UseBefore(AuthMiddleware)
export class DocumentsController {
  @Post(API.Documents.FindByRequestId.Route)
  async findByRequestId(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Documents.FindByRequestId.post>[0],
  ): ReturnType<typeof API.Documents.FindByRequestId.post> {
    try {
      const { authUser } = req.user;
      const { id } = body;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Documents);
      const [document] = await repo.findByRequestId(
        authUser.id,
        [id],
      );
      if (!document) { return { document: null }; }

      return { document };
    } catch ({ message: err }) {
      res.status(400);
      return { error: `An error ocurred while trying to find the document: ${err}` };
    }
  }

  @Post(API.Documents.FindByRequestIds.Route)
  async findByRequestIds(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Documents.FindByRequestIds.post>[0],
  ): ReturnType<typeof API.Documents.FindByRequestIds.post> {
    try {
      const { authUser } = req.user;
      const { ids } = body;
      if (!ids.length) return { documents: [] };
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Documents);
      const documents = await repo.findByRequestId(
        authUser.id,
        ids,
      );
      if (!documents) { return { documents: null }; }

      return { documents };
    } catch ({ message: err }) {
      res.status(400);
      return { error: `An error ocurred while trying to find the document: ${err}` };
    }
  }

  @Post(API.Documents.Update.Route)
  async updateDocumentRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Documents.Update.post>[0],
  ): ReturnType<typeof API.Documents.Update.post> {
    try {
      const { authUser } = req.user;
      const update = body;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Documents);
      const savedDocument = await repo.update(authUser.id, update);
      return { document: savedDocument, success: true, message: Labels.UpdatedDocument(savedDocument, savedDocument.operationId) };
    } catch ({ message: err }) {
      res.status(400);
      return { error: `An error ocurred while trying to save the document: ${err}` };
    }
  }

  @Post(API.Documents.SetLink.Route)
  async updateLink(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Documents.SetLink.post>[0],
  ): ReturnType<typeof API.Documents.SetLink.post> {
    try {
      const { authUser } = req.user;
      const { id, link } = body;
      if (!id || link == null) { return { error: `Could not update document with id ${id} with link ${link}` }; }
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Documents);
      const document = await repo.setLink(authUser.id, id, link);
      return { document };
    } catch ({ message: err }) {
      res.status(400);
      return { error: `An error ocurred while trying to save the document: ${err}` };
    }
  }

  static async register(authUserId: number, requestId: number, sendEmail: boolean, sendBy: number) {
    const connection = await getConnection();
    const reqs = connection.getCustomRepository(Requests);
    const { requests } = await reqs.find({ authUserId, id: requestId });
    if (!requests?.length) return { message: `Could not locate request #${requestId} when attempting to create the document` };
    const [request] = requests;
    const docs = connection.getCustomRepository(Documents);
    const document = await docs.create(authUserId, { request });
    if (!document) throw new Error(`Failed to create the document for request #${request.id}`);
    let message = `Successfully registered document #${document.id}.`;
    if (sendEmail) {
      try {
        const usersRepo = connection.getCustomRepository(Users);
        const [user] = await usersRepo.accounts({ authUserId, accounts: { ids: [request.userId] }, withManager: true });
        if (!user) throw new Error(' Did not send email because the user could not be loaded.');
        const { manager } = user;
        if (!manager) throw new Error(' Did not send email because the manager could not be loaded.');
        const subject = EmailLabels.getRequestEmailSubject(request);
        const to = `${user.displayName} <${user.email}>`;
        const cc = `${manager.username} <${manager.email}>`;
        let emailTemplate: JSX.Element = null;

        if (request.type === OperationType.Debit) {
          (emailTemplate = distributionRequestedEmailTemplate({ request, siteUrl: env.var.SITE_URL, sendBy }));
        } else {
          (emailTemplate = creditRequestedEmailTemplate(env.var.SITE_URL));
        }
        const Email = new Emailer();
        await Email.sendMail({
          to,
          cc,
          subject,
          emailTemplate,
          sendingFunction: 'DocumentsController.register',
        });
        message += (` Sent registration email for ${request.type} request #${request.id} to ${to} and cc'd ${cc}.`);
      } catch ({ message: error }) {
        return { document, error };
      }
    }
    return { document, message };
  }

  @Post(API.Documents.Register.Route)
  async registerRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Documents.Register.post>[0],
  ): ReturnType<typeof API.Documents.Register.post> {
    try {
      const { authUser: { id: authUserId } } = req.user;
      const {
        requestId, sendEmail, sendBy,
      } = body;
      return DocumentsController.register(authUserId, requestId, sendEmail, sendBy);
    } catch ({ message: err }) {
      res.status(400);
      return { error: `An error ocurred while trying to save the document: ${err}` };
    }
  }

  @Post(API.Documents.Delete.Route)
  async delete(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Documents.Delete.post>[0],
  ): ReturnType<typeof API.Documents.Delete.post> {
    try {
      const { authUser: { id: authUserId } } = req.user;
      const { id } = body;
      const connection = await getConnection();
      const docs = connection.getCustomRepository(Documents);
      const success = await docs.delete(authUserId, id);
      if (success) return { message: `Successfully unregistered document #${id}` };
      return { error: `Unable to unregister document #${id}` };
    } catch ({ message: err }) {
      res.status(400);
      return { error: `An error ocurred while trying to save the document: ${err}` };
    }
  }

  static async updateDocumentByRequest(
    authUserId: User['id'],
    request: Request,
    errorOnNoDoc = false,
  ): ReturnType<typeof API.Documents.Update.post> {
    try {
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Documents);
      const [d] = await repo.findByRequestId(authUserId, [request.id]);
      if (d) {
        if (request.status === RequestStatus.Approved) {
          if (request.type === OperationType.Credit) { d.stage = DocumentStage.Received; } else { d.stage = DocumentStage.Sent; }
        } else if (request.status === RequestStatus.Recurring) { d.stage = DocumentStage.Recurring; }
        const usersRepo = connection.getCustomRepository(Users);
        const [user] = await usersRepo.accounts({ authUserId, accounts: { ids: [d.userId] }, withBankData: true });
        if (!user) throw new Error(`Could not locate user ${request.userId} to update document after post of request ${request.id}`);
        const { bankAccounts } = user;
        const preferredAccount = request.bankAccount || (bankAccounts.length && bankAccounts.reduce((prev, curr) => (curr.preferred ? curr : prev)));
        const { accountEnding } = preferredAccount || {};
        const status = GetDocumentStatusByStage(d.stage, request.type, accountEnding, request.wireConfirmation);
        const savedDocument = await repo.update(authUserId, { id: d.id, status, stage: d.stage });
        return { document: savedDocument };
      }
      if (errorOnNoDoc) {
        throw new Error(`Could not locate the document for request #${request.id}`);
      }
      return { success: true };
    } catch ({ message: err }) {
      return { error: `An error ocurred while trying to save the document: ${err}` };
    }
  }
}
