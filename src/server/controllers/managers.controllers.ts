/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import {
  JsonController, Get, Req, UseBefore, Post, Res, Body,
} from 'routing-controllers';
import { flatten } from 'array-flatten';
import { error } from '@log';
import { trimManagersProps, RoleId } from '@interfaces';
import { Operations, Statements, Users } from '@repositories';
import { API } from '@api';
import { AuthMiddleware } from '@middleware/auth';
import { getConnection } from '@lib/db';

export const GetOptedOutManagerIds = () => [] as number[];

@JsonController()
@UseBefore(AuthMiddleware)
export class ManagersController {
  @Get(API.Managers.All.Route)
  async managersRoute(
    @Req() req: HTTPRequest,
  ): ReturnType<typeof API.Managers.All.get> {
    try {
      const { authUser } = req.user;
      if (authUser?.id == null) throw new Error('The user was missing on the request to managersRoute');
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const managers = await UsersRepo.accounts({ authUserId, accounts: { roles: [RoleId.manager, RoleId.director] } });
      return { managers: trimManagersProps(managers) };
    } catch ({ message: err }) {
      error(err);
      return { error: `An error occurred while loading managers: ${err}` };
    }
  }

  @Post(API.Managers.FindByUserId.Route)
  async findByUserId(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Managers.FindByUserId.post>[0],
  ): ReturnType<typeof API.Managers.FindByUserId.post> {
    try {
      const { authUser } = req.user;
      if (authUser?.id == null) throw new Error('The user was missing on the request to managersRoute');
      const { id: authUserId } = authUser;
      const { id } = body;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const users = await UsersRepo.accounts({ authUserId, accounts: { roles: [RoleId.client], ids: [id] } });
      const user = users.find(({ id: i }) => i === id);
      if (!user) return { error: `Could not locate user with id ${id}` };
      const { fmId } = user;
      const managers = await UsersRepo.accounts({ authUserId, accounts: { roles: [RoleId.manager, RoleId.director] } });
      const manager = managers.find(({ id: i }) => fmId === i);
      return { manager };
    } catch ({ message: err }) {
      res.status(400);
      error(err);
      return { error: `An error occurred while loading managers: ${err}` };
    }
  }

  @Post(API.Managers.FindByUserIds.Route)
  async findByUserIds(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Managers.FindByUserIds.post>[0],
  ): ReturnType<typeof API.Managers.FindByUserIds.post> {
    try {
      const { authUser } = req.user;
      if (authUser?.id == null) throw new Error('The user was missing on the request to managersRoute');
      const { id: authUserId } = authUser;
      const { ids } = body;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const users = await UsersRepo.accounts({ authUserId, accounts: { roles: [RoleId.client], ids } });
      const fmIds = users.map(({ fmId }) => fmId);
      const managers = await UsersRepo.accounts({ authUserId, accounts: { ids: fmIds, roles: [RoleId.manager, RoleId.director] } });
      return { managers };
    } catch ({ message: err }) {
      res.status(400);
      error(err);
      return { error: `An error occurred while loading managers: ${err}` };
    }
  }

  @Post(API.Managers.FindByAccountNumber.Route)
  async findByAccountNumber(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Managers.FindByAccountNumber.post>[0],
  ): ReturnType<typeof API.Managers.FindByAccountNumber.post> {
    try {
      const { authUser } = req.user;
      if (authUser?.id == null) throw new Error('The user was missing on the request to managersRoute');
      const { id: authUserId } = authUser;
      const { accountNumber } = body;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const users = await UsersRepo.accounts({ authUserId, accounts: { roles: [RoleId.client], accountNumbers: [accountNumber] }, withManager: true });
      const user = users.find(({ accountNumber: i }) => i === accountNumber);
      if (!user) return { error: `Could not locate user with account number ${accountNumber}` };
      const { manager } = user;
      return { manager };
    } catch ({ message: err }) {
      res.status(400);
      error(err);
      return { error: `An error occurred while loading managers: ${err}` };
    }
  }

  @Get(API.Managers.KPI.Route)
  async portfolioBalanceByMonth(
    @Req() req: HTTPRequest,
  ): ReturnType<typeof API.Managers.KPI.get> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to managersRoute');
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const accounts = await UsersRepo.accounts({ authUserId });
      if (!accounts || !accounts.length) return { portfolioBalances: [] };
      const StatementsRepo = connection.getCustomRepository(Statements);
      const statements = await StatementsRepo.find({ authUserId, userIds: accounts.map(({ id }) => id) });
      const accountsMap = accounts.reduce((total, u) => ({
        ...total,
        [u.id]: {
          displayName: u.displayName,
          accountNumber: u.accountNumber,
          fmId: u.fmId,
        },
      }), {} as {[userId: number]: {
        displayName, accountNumber, fmId,
      }});
      const operationRepo = connection.getCustomRepository(Operations);
      const operations = await operationRepo.getOperations(authUserId, accounts.map(({ id }) => id), []);
      const portfolioBalances = statements?.map(({
        userId, month, year, endBalance, gainLoss,
      }) => ({
        displayName: accountsMap[userId].displayName,
        accountNumber: accountsMap[userId].accountNumber,
        userId,
        fmId: accountsMap[userId].fmId,
        month,
        year,
        endBalance,
        gainLoss,
        netOperations: operations
          .filter(({ month: m, year: y, userId: u }) => (userId === u && year === y && month === m))
          .reduce((total, { amount }) => (total + amount), 0),
      }));
      return { portfolioBalances };
    } catch ({ message: err }) {
      error(err);
      return { error: `An error occurred while finding portfolio account statements: ${err}` };
    }
  }
}
