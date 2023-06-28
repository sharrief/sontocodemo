/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import {
  JsonController, Get, Req, Res, UseBefore, Body, Post,
} from 'routing-controllers';
import { error } from '@log';
import { getConnection } from 'typeorm';
import { Users } from '@repositories';
import { API } from '@api';
import { AuthMiddleware } from '@middleware/auth';
import { RoleId, trimAccountProps, trimAccountsProps } from '@interfaces';

@JsonController()
@UseBefore(AuthMiddleware)
export class AccountsController {
  @Get(API.Accounts.Find.Route)
  async accountsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.Accounts.Find.get> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const accounts = await UsersRepo.accounts({ authUserId, accounts: { roles: [RoleId.client] } });
      const sortedAccounts = accounts.sort(({ displayName: a }, { displayName: b }) => (a).localeCompare(b));
      return { accounts: trimAccountsProps(sortedAccounts) };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load accounts: ${err}` };
    }
  }

  @Post(API.Accounts.FindById.Route)
  async findById(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Accounts.FindById.post>[0],
  ): ReturnType<typeof API.Accounts.FindById.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { id } = body;
      if (!id) return { error: 'Cannot load the account as no ID was provided' };
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const [account] = await UsersRepo.accounts({ authUserId, accounts: { ids: [id], roles: [RoleId.client] } });
      return { account: trimAccountProps(account) };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to find an account: ${err}` };
    }
  }

  @Post(API.Accounts.FindByIds.Route)
  async findByIds(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Accounts.FindByIds.post>[0],
  ): ReturnType<typeof API.Accounts.FindByIds.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { ids } = body;
      if (!ids?.length) return { accounts: [] };
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const accounts = await UsersRepo.accounts({ authUserId, accounts: { ids, roles: [RoleId.client] } });
      return { accounts: trimAccountsProps(accounts) };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to find accounts: ${err}` };
    }
  }

  @Post(API.Accounts.FindByAccountNumber.Route)
  async findByAccountNumber(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Accounts.FindByAccountNumber.post>[0],
  ): ReturnType<typeof API.Accounts.FindByAccountNumber.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { accountNumber } = body;
      if (!accountNumber) return { error: 'Cannot load the account as no account number was provided' };
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const [account] = await UsersRepo.accounts({ authUserId, accounts: { accountNumbers: [accountNumber], roles: [RoleId.client] } });
      if (!account) throw new Error(`Unable to find an account with account number ${accountNumber}.`);
      return { account: trimAccountProps(account) };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to locate an account: ${err}` };
    }
  }
}
