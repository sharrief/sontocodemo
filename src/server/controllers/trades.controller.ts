/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import {
  JsonController, Post, Req, Res, Body, UseBefore, Get,
} from 'routing-controllers';
import { error } from '@log';
import { API } from '@api';
import { AuthMiddleware } from '@middleware/auth';
import { getConnection } from '@lib/db';
import { Trades } from '@repositories/trades.repository';
import { Emailer } from '@server/lib/email';
import { newTradeReportPublishedEmailTemplate, Labels as EmailLabels } from '@email';
import { DateTime } from 'luxon';
import ReactDOMServer from 'react-dom/server';
import env from '@server/lib/env';

@JsonController()
@UseBefore(AuthMiddleware)
export class TradesController {
  @Post(API.Trades.Find.Route)
  async getTrades(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Trades.Find.post>[0],
  ): ReturnType<typeof API.Trades.Find.post> {
    try {
      const { user } = req;
      if (!user) throw new Error(`The user was missing on the request to ${API.Trades.Find.Route}.`);
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Trades);
      if (body?.year && body?.month) { return { trades: await repo.getTradesByMonthAndYears([{ year: body.year, month: body.month }], body.unpublished) }; }
      return { trades: await repo.getTradesByMonthAndYears([], body.unpublished) };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load trades: ${err}` };
    }
  }

  @Get(API.Trades.ROI.Route)
  async getROI(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.Trades.ROI.get> {
    const { user } = req;
    if (!user) throw new Error(`The user was missing on the request to ${API.Trades.Latest.Route}.`);
    try {
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Trades);
      const months = await repo.getDividends();
      return { months, error: undefined };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { months: undefined, error: `An error occurred while trying to load trades: ${err}` };
    }
  }

  @Get(API.Trades.Latest.Route)
  async getLatestDate(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.Trades.Latest.get> {
    const { user } = req;
    if (!user) throw new Error(`The user was missing on the request to ${API.Trades.Latest.Route}.`);
    try {
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Trades);
      const result = await repo.getLatestReport();
      return { ...result, error: undefined };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { month: undefined, year: undefined, error: `An error occurred while trying to load trades: ${err}` };
    }
  }

  @Post(API.Trades.Save.Route)
  async addUnpublishedTrades(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Trades.Save.post>[0],
  ): ReturnType<typeof API.Trades.Save.post> {
    const { user: { authUser } } = req;
    if (!authUser) throw new Error(`The user was missing on the request to ${API.Trades.Save.Route}.`);
    const {
      day, month, year, trades: newTrades,
    } = body;
    try {
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Trades);
      const { error: err, trades } = await repo.addUnpublishedTrades(authUser.id, month, year, newTrades, day);
      if (err) throw new Error(err);
      return { trades };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: err };
    }
  }

  @Post(API.Trades.Publish.Route)
  async publishTradeReport(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Trades.Publish.post>[0],
  ): ReturnType<typeof API.Trades.Publish.post> {
    const { user: { authUser } } = req;
    if (!authUser) throw new Error(`The user was missing on the request to ${API.Trades.Publish.Route}.`);
    const {
      month, year,
    } = body;
    try {
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Trades);
      const success = await repo.publishMonthlyReport(authUser.id, month, year);
      if (success) {
        const Email = new Emailer();
        const date = DateTime.fromObject({ month, year }).toFormat('MMMM yyyy');
        const emailTemplate = newTradeReportPublishedEmailTemplate({ month, year, user: authUser.displayName });
        await Email.sendMail({
          to: env.var.EMAIL_ADMIN,
          cc: authUser.email,
          subject: EmailLabels.getTradeReportPublishedSubject(date),
          emailTemplate,
          sendingFunction: 'TradesController.publishTradeReport',
        });
      }
      return { success };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: err };
    }
  }

  @Post(API.Trades.Unpublish.Route)
  async unpublishTradeReport(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Trades.Unpublish.post>[0],
  ): ReturnType<typeof API.Trades.Unpublish.post> {
    const { user: { authUser } } = req;
    if (!authUser) throw new Error(`The user was missing on the request to ${API.Trades.Unpublish.Route}.`);
    const {
      month, year,
    } = body;
    try {
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Trades);
      const success = await repo.unpublishMonthlyReport(authUser.id, month, year);
      return { success };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: err };
    }
  }

  @Post(API.Trades.Delete.Route)
  async deleteTradeReport(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.Trades.Delete.post>[0],
  ): ReturnType<typeof API.Trades.Delete.post> {
    const { user: { authUser } } = req;
    if (!authUser) throw new Error(`The user was missing on the request to ${API.Trades.Delete.Route}.`);
    const {
      month, year,
    } = body;
    try {
      const connection = await getConnection();
      const repo = connection.getCustomRepository(Trades);
      const success = await repo.deleteMonthlyReport(authUser.id, month, year);
      return { success };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: err };
    }
  }
}
