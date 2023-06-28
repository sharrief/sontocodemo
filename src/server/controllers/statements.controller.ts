/* eslint-disable no-await-in-loop */
/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import {
  JsonController, Req, Res, Post, Body, UseBefore,
} from 'routing-controllers';
import { info } from '@log';
import {
  FindStatementsArguments, Operations, Statements, Users,
} from '@repositories';
import { API } from '@api';
import { AuthMiddleware } from '@middleware/auth';
import { getConnection } from '@lib/db';

@JsonController()
@UseBefore(AuthMiddleware)
export class StatementsController {
  @Post(API.Statements.Find.Route)
  async findStatementsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Statements.Find.post>[0],
  ): ReturnType<typeof API.Statements.Find.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request.');
      const { accountNumber, withOperations, withTrades } = body;
      const connection = await getConnection();
      const statementsRepo = connection.getCustomRepository(Statements);
      let statements = await statementsRepo.find({
        authUserId: authUser.id, accountNumber,
      });
      if (statements == null) throw new Error(`Unable to load statements for account ${accountNumber}`);
      let operations = [];
      if (withOperations) {
        const usersRepo = connection.getCustomRepository(Users);
        const [account] = await usersRepo.accounts({ authUserId: authUser.id, accounts: { accountNumbers: [accountNumber] } });
        const operationsRepo = connection.getCustomRepository(Operations);
        operations = await operationsRepo.getOperations(authUser.id, [account.id], []);
        statements = statements.map((s) => {
          const operationsForStatement = operations.filter((o) => o.month === s.month && o.year === s.year);
          return { ...s, operations: operationsForStatement };
        });
      }
      const sortedStatements = statements.sort((a, b) => {
        if (a.year < b.year) return 1;
        if (a.year === b.year) return b.month - a.month;
        return -1;
      });
      return { statements: sortedStatements };
    } catch ({ message: error }) {
      res.status(400);
      info(error);
      return { error: `An error ocurred while trying to load statements: ${error} ` };
    }
  }

  private async getStatements(arg: FindStatementsArguments) {
    const connection = await getConnection();
    const statementsRepo = connection.getCustomRepository(Statements);
    const statements = await statementsRepo.find(arg);
    if (statements == null) throw new Error('Unable to load statements');
    const sortedStatements = statements.sort((a, b) => {
      if (a.year < b.year) return 1;
      if (a.year === b.year) return b.month - a.month;
      return -1;
    });
    return sortedStatements;
  }

  @Post(API.Statements.Balances.Route)
  async getLatestBalance(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Statements.Balances.post>[0],
  ): ReturnType<typeof API.Statements.Balances.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request.');
      const { accountNumber, monthAndYears } = body;
      const connection = await getConnection();
      const statementsRepo = connection.getCustomRepository(Statements);
      const statements = await statementsRepo.find({
        authUserId: authUser.id, accountNumber, monthAndYears,
      });
      const statementBalances = statements.map((s) => ({
        month: s.month,
        year: s.year,
        endBalance: s.endBalance,
      }));
      return { statementBalances };
    } catch ({ message: error }) {
      res.status(400);
      info(error);
      return { error: `An error ocurred while trying to load statements: ${error} ` };
    }
  }

  @Post(API.Statements.All.Route)
  async allStatementsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Statements.All.post>[0],
  ): ReturnType<typeof API.Statements.All.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request.');
      const {
        userIds, monthAndYears, withOperations, withTrades, latestOnly,
      } = body;
      const sortedStatements = await this.getStatements({
        authUserId: authUser.id, userIds, monthAndYears,
      });
      return { statements: sortedStatements };
    } catch ({ message: error }) {
      res.status(400);
      info(error);
      return { error: `An error ocurred while trying to load statements: ${error} ` };
    }
  }
}
