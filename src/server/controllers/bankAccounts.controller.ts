/* eslint-disable class-methods-use-this */
import 'reflect-metadata';
import { Request as HTTPRequest, Response as HTTPResponse } from 'express';
import {
  JsonController, Post, Req, Res, UseBefore, Body, Get,
} from 'routing-controllers';
import { error, security } from '@log';
import { getConnection } from '@lib/db';
import { BankData, ReceivingBanks, Users } from '@repositories';
import { API } from '@api';
import { AuthMiddleware } from '@middleware/auth';
import {
  BankDatumModel, IBankDatum, validateBankDatum,
} from '@interfaces';
import { plainToClass } from 'class-transformer';
import { ReceivingBank } from '@server/entities';

@JsonController()
@UseBefore(AuthMiddleware)
export class BankAccountsController {
  @Post(API.BankData.Find.Route)
  async findBankAccountsRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.Find.post>[0],
  ): ReturnType<typeof API.BankData.Find.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { accountNumber } = body;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const [account] = await UsersRepo.accounts({ authUserId, accounts: { accountNumbers: [accountNumber] } });
      if (!account) { throw Error(`Could not locate an account with account number ${accountNumber}`); }
      const BankDataRepo = connection.getCustomRepository(BankData);
      let bankData = await BankDataRepo.find(authUserId, [account.id]);
      security(`User ${authUser.displayName} accessed bank data ${bankData.map(({ uuid }) => uuid).join(', ')}`);
      bankData = bankData?.map((b) => {
        const d = { ...b };
        delete d.id; return d;
      });
      return { bankAccounts: bankData };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load bank data: ${err}` };
    }
  }

  @Post(API.BankData.FindByAccountNumbers.Route)
  async findBankAccounts(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.FindByAccountNumbers.post>[0],
  ): ReturnType<typeof API.BankData.FindByAccountNumbers.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { accountNumbers } = body;
      const connection = await getConnection();
      const UsersRepo = connection.getCustomRepository(Users);
      const accounts = await UsersRepo.accounts({ authUserId, accounts: { accountNumbers } });
      const userIds = accounts.map(({ id }) => id);
      const BankDataRepo = connection.getCustomRepository(BankData);
      let bankData = await BankDataRepo.find(authUserId, userIds);
      security(`User ${authUser.displayName} accessed bank data ${bankData.map(({ uuid }) => uuid).join(', ')}`);
      bankData = bankData?.map((b) => {
        const d = { ...b };
        delete d.id; return d;
      });
      return { bankAccounts: bankData };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load bank data: ${err}` };
    }
  }

  @Get(API.BankData.GetReceivingBanks.Route)
  async getReceivingBanks(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
  ): ReturnType<typeof API.BankData.GetReceivingBanks.get> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error(`The user was missing on the request to ${API.BankData.GetReceivingBanks.Route}`);
      const connection = await getConnection();
      const receivingBanksRepo = connection.getCustomRepository(ReceivingBanks);
      const receivingBanks = await receivingBanksRepo.find();
      return { receivingBanks };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load receiving banks: ${err}` };
    }
  }

  @Post(API.BankData.GetReceivingBank.Route)
  async getReceivingBank(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.GetReceivingBank.post>[0],
  ): ReturnType<typeof API.BankData.GetReceivingBank.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error(`The user was missing on the request to ${API.BankData.GetReceivingBank.Route}`);
      const { receivingBankId: id } = body;
      if (!id) throw new Error(`The id was missing on the request to ${API.BankData.GetReceivingBank.Route}`);
      const connection = await getConnection();
      const receivingBanksRepo = connection.getCustomRepository(ReceivingBanks);
      const [receivingBank] = await receivingBanksRepo.find(id);
      return { receivingBank };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to load receiving banks: ${err}` };
    }
  }

  @Post(API.BankData.Create.Route)
  async createBankInfoRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.Create.post>[0],
  ): ReturnType<typeof API.BankData.Create.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { bankAccount: inputData, accountNumber } = body;
      const connection = await getConnection();
      const bankRepo = connection.getCustomRepository(BankData);
      const existingBankData = await bankRepo.findByUUID(authUserId, inputData.uuid, false);
      let bankData: IBankDatum = null;
      if (existingBankData) {
        const validations = await validateBankDatum(plainToClass(BankDatumModel, { ...inputData, accountNumber: 'xxxxxx' }));
        if (validations.length) {
          return { validations };
        }
        bankData = await bankRepo.save(authUserId, inputData, accountNumber);
      } else {
        const validations = await validateBankDatum(plainToClass(BankDatumModel, inputData));
        if (validations.length) {
          return { validations };
        }
        bankData = await bankRepo.create(authUserId, inputData, accountNumber);
      }
      delete bankData.id;
      bankData.accountNumber = new Array(bankData.accountNumber?.length).fill('x').join('');
      bankData.iban = new Array(bankData.iban?.length).fill('x').join('');
      return { bankData };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to save bank data: ${err}` };
    }
  }

  @Post(API.BankData.Validate.Route)
  async validateBankData(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.Validate.post>[0],
  ): ReturnType<typeof API.BankData.Validate.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { uuid } = body;
      const connection = await getConnection();
      const bankRepo = connection.getCustomRepository(BankData);
      await bankRepo.validate(authUserId, uuid);
      return { };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to create bank data: ${err}` };
    }
  }

  @Post(API.BankData.SetReceivingBank.Route)
  async setReceivingBank(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.SetReceivingBank.post>[0],
  ): ReturnType<typeof API.BankData.SetReceivingBank.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { receivingBankId, uuid } = body;
      const connection = await getConnection();
      const bankRepo = connection.getCustomRepository(BankData);
      await bankRepo.setReceivingBank(authUserId, uuid, receivingBankId);
      return { };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to create bank data: ${err}` };
    }
  }

  @Post(API.BankData.SetDCAFLink.Route)
  async setDCAFLink(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.SetDCAFLink.post>[0],
  ): ReturnType<typeof API.BankData.SetDCAFLink.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { DCAF, uuid } = body;
      const connection = await getConnection();
      const bankRepo = connection.getCustomRepository(BankData);
      await bankRepo.setDCAFLink(authUserId, uuid, DCAF);
      return { };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to create bank data: ${err}` };
    }
  }

  @Post(API.BankData.Delete.Route)
  async deleteBankInfoRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.Delete.post>[0],
  ): ReturnType<typeof API.BankData.Delete.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { uuid } = body;
      const connection = await getConnection();
      const bankRepo = connection.getCustomRepository(BankData);
      await bankRepo.delete(authUserId, uuid);
      return {};
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to create bank data: ${err}` };
    }
  }

  @Post(API.BankData.WithAccountNumber.Route)
  async getBankInfoWithAccountNumberRoute(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.WithAccountNumber.post>[0],
  ): ReturnType<typeof API.BankData.WithAccountNumber.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { uuid } = body;
      const connection = await getConnection();
      const bankRepo = connection.getCustomRepository(BankData);
      const bankData = await bankRepo.findByUUID(authUserId, uuid, true);
      security(`User ${authUser.displayName} accessed bank account numbers for bank accounts ${bankData.uuid}`);
      delete bankData.id;
      return { bankAccount: bankData };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to get bank data: ${err}` };
    }
  }

  @Post(API.BankData.SetPreferredBankAccount.Route)
  async setPreferredBankAccount(
    @Req() req: HTTPRequest,
    @Res() res: HTTPResponse,
    @Body() body: Parameters<typeof API.BankData.SetPreferredBankAccount.post>[0],
  ): ReturnType<typeof API.BankData.SetPreferredBankAccount.post> {
    try {
      const { authUser } = req.user;
      if (!authUser) throw new Error('The user was missing on the request to accountsRoute');
      const { id: authUserId } = authUser;
      const { uuid } = body;
      const connection = await getConnection();
      const bankRepo = connection.getCustomRepository(BankData);
      await bankRepo.setPreferredBankAccount(authUserId, uuid);
      return { };
    } catch ({ message: err }) {
      error(err);
      res.status(400);
      return { error: `An error occurred while trying to set the preferred bank data: ${err}` };
    }
  }
}
