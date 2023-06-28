/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import {
  JsonController, Req, Res, Post, Body, UseBefore,
} from 'routing-controllers';
import {
  BankData,
  Documents, Operations, Requests, Users,
} from '@repositories';
import { API } from '@api';
import { AuthMiddleware } from '@middleware/auth';
import { getConnection } from '@lib/db';
import {
  DocumentStage, GetDocumentStatusByStage, RequestStatus, IDocument,
} from '@interfaces';

@JsonController()
@UseBefore(AuthMiddleware)
export class OperationsController {
  @Post(API.Operations.FindByUserId.Route)
  async findByUserOperationsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Operations.FindByUserId.post>[0],
  ): ReturnType<typeof API.Operations.FindByUserId.post> {
    const { userId, monthAndYears } = body;
    try {
      const { authUser } = req.user;
      if (!authUser) throw Error('The user was missing on the request to operationsRoute.');
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Operations);
      const operations = await repo.getOperations(authUser.id, [userId], monthAndYears);
      return { operations };
    } catch ({ message: error }) {
      res.status(400);
      return { error: `An error ocurred while trying to load operations: ${error}` };
    }
  }

  @Post(API.Operations.FindByAccountNumber.Route)
  async findByAccountOperationsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Operations.FindByAccountNumber.post>[0],
  ): ReturnType<typeof API.Operations.FindByAccountNumber.post> {
    const {
      accountNumber, monthAndYears, withRequestsAndBankAccounts, withRequests,
    } = body;
    try {
      const { authUser } = req.user;
      if (!authUser) throw Error('The user was missing on the request to operationsRoute.');
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const usersRepo = connection.getCustomRepository(Users);
      const [account] = await usersRepo.accounts({ authUserId, accounts: { accountNumbers: [accountNumber] } });
      if (!account) throw Error(`Could not locate the account for account number ${accountNumber}`);
      const repo = connection.getCustomRepository(Operations);
      const operations = await repo.getOperations(authUserId, [account.id], monthAndYears);
      if (withRequests || withRequestsAndBankAccounts) {
        const reqRepo = connection.getCustomRepository(Requests);
        const { requests } = await reqRepo.find({ authUserId, ids: operations.map((o) => o.requestId) });
        if (withRequestsAndBankAccounts) {
          const bankRepo = connection.getCustomRepository(BankData);
          let bankData = await bankRepo.findByUserId(authUserId, account.id, false);
          bankData = bankData?.map((b) => {
            const d = { ...b };
            delete d.id; return d;
          });
          return { operations, requests, bankAccounts: bankData };
        }
        return { operations, requests };
      }
      return { operations };
    } catch ({ message: error }) {
      res.status(400);
      return { error: `An error ocurred while trying to load operations: ${error}` };
    }
  }

  @Post(API.Operations.FindByRequestId.Route)
  async findByRequestId(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Operations.FindByRequestId.post>[0],
  ): ReturnType<typeof API.Operations.FindByRequestId.post> {
    const { id } = body;
    try {
      const { authUser } = req.user;
      if (!authUser) throw Error('The user was missing on the request to operationsRoute.');
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Operations);
      const operations = await repo.findByRequestIds(authUser.id, [id]);
      return { operations };
    } catch ({ message: error }) {
      res.status(400);
      return { error: `An error ocurred while trying to find the operation for request #${id}: ${error}` };
    }
  }

  @Post(API.Operations.FindByRequestIds.Route)
  async findByRequestIds(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Operations.FindByRequestIds.post>[0],
  ): ReturnType<typeof API.Operations.FindByRequestIds.post> {
    const { ids } = body;
    if (!ids?.length) return { operations: [] };
    try {
      const { authUser } = req.user;
      if (!authUser) throw Error('The user was missing on the request to operationsRoute.');
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Operations);
      const operations = await repo.findByRequestIds(authUser.id, ids);
      return { operations };
    } catch ({ message: error }) {
      res.status(400);
      return { error: `An error ocurred while trying to find the operation for request #${ids}: ${error}` };
    }
  }

  @Post(API.Operations.FindByMonthAndUserId.Route)
  async findByMonthAndUserId(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Operations.FindByMonthAndUserId.post>[0],
  ): ReturnType<typeof API.Operations.FindByMonthAndUserId.post> {
    const { month, userId } = body;
    try {
      const { authUser } = req.user;
      if (!authUser) throw Error('The user was missing on the request to operationsRoute.');
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Operations);
      const operations = await repo.getOperations(authUser.id, [userId], [month]);
      return { operations };
    } catch ({ message: error }) {
      res.status(400);
      return { error: `An error ocurred while trying to load operations for ${month.month}-${month.year}: ${error}` };
    }
  }

  @Post(API.Operations.All.Route)
  async allOperationsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Operations.All.post>[0],
  ): ReturnType<typeof API.Operations.All.post> {
    const { monthAndYears } = body;
    try {
      const { authUser } = req.user;
      if (!authUser) throw Error('The user was missing on the request to operationsRoute.');
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Operations);
      const operations = await repo.getOperations(authUser.id, undefined, monthAndYears);
      return { operations };
    } catch ({ message: error }) {
      res.status(400);
      return { error: `An error ocurred while trying to load operations for ${monthAndYears.map(({ month, year }) => `${month}-${year}`)}: ${error}` };
    }
  }

  @Post(API.Operations.Delete.Route)
  async deleteOperationRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Operations.Delete.post>[0],
  ): ReturnType<typeof API.Operations.Delete.post> {
    const { ids } = body;
    try {
      const { authUser } = req.user;
      if (!authUser) throw Error('The user was missing on the request to operationsRoute.');
      const authUserId = authUser.id;
      const connection = await getConnection();
      const operationsRepo = connection.getCustomRepository(Operations);
      const { message, operations } = await operationsRepo.setDeleted(authUserId, ids);
      // update related requests
      const requestsRepo = connection.getCustomRepository(Requests);
      let { requests } = await requestsRepo.find({ authUserId, ids: operations.map(({ requestId }) => requestId) });
      const docRepo = connection.getCustomRepository(Documents);
      const docs: IDocument[] = [];
      await Promise.all(requests.map(async (request) => {
        await requestsRepo.handleRequestUpdate({
          authUserId,
          id: request.id,
          status: request.status === RequestStatus.Recurring ? RequestStatus.Recurring : RequestStatus.Pending,
        });
        const [doc] = await docRepo.findByRequestId(authUserId, [request.id]);
        if (doc) {
          const updatedDoc = await docRepo.update(authUserId, {
            id: doc.id,
            stage: DocumentStage.Review,
            status: GetDocumentStatusByStage(DocumentStage.Review),
          });
          docs.push(updatedDoc);
        }
      }));
      ({ requests } = await requestsRepo.find({ authUserId, ids: operations.map(({ requestId }) => requestId) }));

      return {
        message, operations, requests, documents: docs,
      };
    } catch ({ message: error }) {
      res.status(400);
      return { error: `An error ocurred while trying to delete operations ${ids.join(', ')}: ${error}` };
    }
  }
}
