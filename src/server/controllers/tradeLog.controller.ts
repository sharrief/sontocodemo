/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import {
  JsonController, Get, Post, Req, Res, Body, UseBefore,
} from 'routing-controllers';
import { error } from '@log';
import { API } from '@api';
import { AuthMiddleware } from '@middleware/auth';
import { getConnection } from '@lib/db';
import { TradeLog, TradeModels, TradeSymbols } from '@repositories';

@JsonController()
@UseBefore(AuthMiddleware)
export class TradeLogController {
  @Post(API.TradeLog.SaveTradeEntry.Route)
  async saveTrade(
    @Req() req: HTTPRequest,
  @Res() res: HTTPResponse,
  @Body() body: Parameters<typeof API.TradeLog.SaveTradeEntry.post>[0],
  ): ReturnType<typeof API.TradeLog.SaveTradeEntry.post> {
    try {
      const { user } = req;
      if (!user) throw new Error(`The user was missing on the request to ${API.TradeLog.SaveTradeEntry.Route}.`);
      const { tradeEntry: tradeToSave } = body;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(TradeLog);
      const { tradeEntry } = await repo.saveTrade(user.authUser, tradeToSave);
      return { tradeEntry };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to save the trade: ${err}` };
    }
  }

  @Post(API.TradeLog.DeleteTradeEntry.Route)
  async deleteTrade(
    @Req() req: HTTPRequest,
  @Res() res: HTTPResponse,
  @Body() body: Parameters<typeof API.TradeLog.DeleteTradeEntry.post>[0],
  ): ReturnType<typeof API.TradeLog.DeleteTradeEntry.post> {
    try {
      const { user } = req;
      if (!user) throw new Error(`The user was missing on the request to ${API.TradeLog.DeleteTradeEntry.Route}.`);
      const { id } = body;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(TradeLog);
      const { id: deletedId } = await repo.deleteTrade(user.authUser, id);
      return { id: deletedId };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to delete the trade: ${err}` };
    }
  }

  @Get(API.TradeLog.GetBooKNames.Route)
  async getBookNames(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.TradeLog.GetBooKNames.get> {
    try {
      const { user } = req;
      if (!user) throw new Error(`The user was missing on the request to ${API.TradeLog.GetBooKNames.Route}.`);
      const connection = await getConnection();
      const repo = connection.getCustomRepository(TradeLog);
      const uniqueTradeEntryBookNames = await repo.getBookNames(user.authUser.role);
      const bookNames = uniqueTradeEntryBookNames.map(({ bookName }) => bookName);
      return { bookNames };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load the trade book: ${err}` };
    }
  }

  @Post(API.TradeLog.FindBooksByName.Route)
  async getBooks(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.TradeLog.FindBooksByName.post>[0],
  ): ReturnType<typeof API.TradeLog.FindBooksByName.post> {
    try {
      const { user } = req;
      if (!user) throw new Error(`The user was missing on the request to ${API.TradeLog.FindBooksByName.Route}.`);
      const { bookName } = body;
      const connection = await getConnection();
      const repo = connection.getCustomRepository(TradeLog);
      const books = await repo.getBooksByName(user.authUser.role, bookName);
      return { bookTrades: books };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load the trade book: ${err}` };
    }
  }

  @Get(API.TradeLog.GetTradeSymbols.Route)
  async getTradeSymbols(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.TradeLog.GetTradeSymbols.get> {
    try {
      const { user } = req;
      if (!user) throw new Error(`The user was missing on the request to ${API.TradeLog.GetTradeSymbols.Route}.`);
      const connection = await getConnection();
      const repo = connection.getCustomRepository(TradeSymbols);
      const tradeSymbols = await repo.getTradeSymbols(user.authUser.role);
      return { tradeSymbols };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load the trade symbols: ${err}` };
    }
  }

  @Get(API.TradeLog.GetTradeModels.Route)
  async getTradeModels(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.TradeLog.GetTradeModels.get> {
    try {
      const { user } = req;
      if (!user) throw new Error(`The user was missing on the request to ${API.TradeLog.GetTradeModels.Route}.`);
      const connection = await getConnection();
      const repo = connection.getCustomRepository(TradeModels);
      const tradeModels = await repo.getTradeModels(user.authUser.role);
      return { tradeModels };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load the trade symbols: ${err}` };
    }
  }
}
