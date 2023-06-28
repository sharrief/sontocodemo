/* eslint-disable no-shadow */
import { Trades } from './trades.api';
import { TradeLog } from './tradeLog.api';
import { Admin } from './admin.api';
import { Users } from './users.api';
import { Managers } from './managers.api';
import { Accounts } from './accounts.api';
import { Applications } from './applications.api';
import { Statements } from './statements.api';
import { Operations } from './operations.api';
import { Requests } from './requests.api';
import { Documents } from './documents.api';
import { BankData } from './bankAccounts.api';
import { Metadata } from './metadata.api';

export const API = {
  Metadata,
  Trades,
  TradeLog,
  Admin,
  Users,
  Managers,
  Accounts,
  Applications,
  Statements,
  Operations,
  Requests,
  Documents,
  BankData,
};

export const endpoints = {
  logout: '/logout',
  api: '/api',
  socket: '/socket',
  passwordReset: '/passwordReset',
  dashboard: '/accounts',
  administration: '/administration',
  application: '/application',
  exitApplication: '/exitApp',
};
