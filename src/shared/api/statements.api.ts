import { fetchRoute, emit, on } from '@api';
import type { SessionSocket } from '@types';
import { IStatement, IUser } from '@interfaces';
import { off } from './socket.api';

const path = '/api/statements';

export const Statements = {
  Find: {
    Route: `${path}/findStatements`,
    async post(body: {
      accountNumber: IUser['accountNumber'];
      withTrades?: boolean;
      withOperations?: boolean;
    }) {
      return await
      fetchRoute(this.Route, body) as {
        statements?: IStatement[];
        error?: string;
      };
    },
  },
  Balances: {
    Route: `${path}/findStatementBalancesByMonth`,
    async post(body: {
      accountNumber: IUser['accountNumber'];
      monthAndYears?: {
        month: number;
        year: number;
      }[];
    }) {
      return await
      fetchRoute(this.Route, body) as {
        statementBalances?: {month: number; year: number; endBalance: number}[];
        error?: string;
      };
    },
  },
  All: {
    Route: `${path}/allStatements`,
    async post(body: {
      userIds? : number[];
      monthAndYears?: {month: number; year: number}[];
      withTrades?: boolean;
      withOperations?: boolean;
      latestOnly?: boolean;
    }) {
      return await
    fetchRoute(this.Route, body) as {
      statements?: IStatement[];
      error?: string;
    };
    },
  },
  Generate: {
    Route: `${path}/generateStatements`,
    async post(body: {
      monthAndYear?: {month: number; year: number};
      userIds?: number[];
      sendEmails?: boolean;
      emailType?: 'old'|'text';
      ccManager?: boolean;
    }) {
      return await
    fetchRoute(this.Route, body) as {
      statements?: IStatement[];
      results?: (string|boolean)[];
      error?: string;
    };
    },
  },
  Populate: {
    Event: 'populate',
    emit(data: {
      monthAndYear?: {month: number; year: number};
      userIds?: number[];
      sendEmails?: boolean;
      emailType?: 'old'|'text';
      ccManager?: boolean;
    }) { emit(this.Event, data); },
  },
  PopulatedStatement: {
    Event: 'populate:statement',
    serverEmit(socket: SessionSocket, statement: IStatement) {
      socket.emit(this.Event, statement);
    },
    on(ack: (statement: IStatement) => void) {
      on(this.Event, (arg: IStatement) => {
        on('populate:complete', () => off(this.Event));
        ack(arg);
      });
    },
  },
  PopulateStarted: {
    Event: 'populate:started',
    serverEmit(socket: SessionSocket) {
      socket.emit(this.Event);
    },
    on(ack: () => void) {
      on(this.Event, () => {
        on('populate:complete', () => off(this.Event));
        ack();
      });
    },
  },
  PopulateComplete: {
    Event: 'populate:complete',
    serverEmit(socket: SessionSocket) {
      socket.emit(this.Event);
    },
    on(ack: () => void) {
      on(this.Event, () => {
        off(this.Event);
        ack();
      });
    },
  },
  PopulateError: {
    Event: 'populate:error',
    serverEmit(socket: SessionSocket, error: string) {
      socket.emit(this.Event, error);
    },
    on(ack: (error: string) => void) {
      on(this.Event, (error: string) => {
        on('populate:complete', () => off(this.Event));
        ack(error);
      });
    },
  },
  PopulateInfo: {
    Event: 'populate:info',
    serverEmit(socket: SessionSocket, info: string) {
      socket.emit(this.Event, info);
    },
    on(ack: (info: string) => void) {
      on(this.Event, (info: string) => {
        on('populate:complete', () => off(this.Event));
        ack(info);
      });
    },
  },
  EmailProgress: {
    Event: 'email:progress',
    serverEmit(socket: SessionSocket, progressUpdate: { timePassed: number }) {
      socket.emit(this.Event, progressUpdate);
    },
    on(ack: (progressUpdate: { timePassed: number }) => void) {
      on(this.Event, (arg: { timePassed: number }) => {
        on('email:complete', () => off(this.Event));
        ack(arg);
      });
    },
  },
  EmailSent: {
    Event: 'email:sent',
    serverEmit(socket: SessionSocket, emailedClient: { userId: number; emailed: boolean }) {
      socket.emit(this.Event, emailedClient);
    },
    on(ack: (emailedClient: { userId: number; emailed: boolean }) => void) {
      on(this.Event, (arg: { userId: number; emailed: boolean }) => {
        on('email:complete', () => off(this.Event));
        ack(arg);
      });
    },
  },
  EmailStarted: {
    Event: 'email:start',
    serverEmit(socket: SessionSocket, estimates: {
      total: number;
      eachMS: number;
    }) {
      socket.emit(this.Event, estimates);
    },
    on(ack: (estimates: {total: number; eachMS: number}) => void) {
      on(this.Event, (arg: {total: number; eachMS: number}) => {
        on('email:complete', () => off(this.Event));
        ack(arg);
      });
    },
  },
  EmailComplete: {
    Event: 'email:complete',
    serverEmit(socket: SessionSocket) {
      socket.emit(this.Event);
    },
    on(ack: () => void) {
      on(this.Event, () => {
        off(this.Event);
        ack();
      });
    },
  },
};
