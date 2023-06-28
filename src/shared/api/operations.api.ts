import { fetchRoute } from '@api';
import {
  IBankDatumTrimmed,
  IDocument, IOperation, IRequest, IUser,
} from '@interfaces';

const path = '/api/operations';
export const Operations = {
  FindByUserId: {
    Route: `${path}/findOperationsByUserId`,
    async post(body: {
      userId: IUser['id'];
      monthAndYears?: {month: number; year: number}[];
    }) {
      return await fetchRoute(this.Route, body) as {
        operations?: IOperation[];
        error?: string;
      };
    },
  },
  FindByAccountNumber: {
    Route: `${path}/findOperationsByAccountNumber`,
    async post(body: {
      accountNumber: IUser['accountNumber'];
      monthAndYears?: {month: number; year: number}[];
      withRequests?: boolean;
      withRequestsAndBankAccounts?: boolean;
    }) {
      return await fetchRoute(this.Route, body) as {
        operations?: IOperation[];
        requests?: IRequest[];
        bankAccounts?: IBankDatumTrimmed[];
        error?: string;
      };
    },
  },
  FindByRequestId: {
    Route: `${path}/findOperationsByRequestId`,
    async post(body: {
      id: IRequest['id'];
    }) {
      return await fetchRoute(this.Route, body) as {
        operations?: IOperation[];
        error?: string;
      };
    },
  },
  FindByRequestIds: {
    Route: `${path}/findOperationsByRequestIds`,
    async post(body: {
      ids: IRequest['id'][];
    }) {
      return await fetchRoute(this.Route, body) as {
        operations?: IOperation[];
        error?: string;
      };
    },
  },
  FindByMonthAndUserId: {
    Route: `${path}/findOperationsByMonthAndUserId`,
    async post(body: {
      month: {
        month: number;
        year: number;
      };
      userId: IUser['id'];
    }) {
      return await fetchRoute(this.Route, body) as {
        operations?: IOperation[];
        error?: string;
      };
    },
  },
  All: {
    Route: `${path}/allOperations`,
    async post(body: {
      monthAndYears?: {month: number; year: number}[];
    }) {
      return await fetchRoute(this.Route, body) as {
      operations?: IOperation[];
      error?: string;
    };
    },
  },
  Delete: {
    Route: `${path}/deleteOperations`,
    async post(body: {
      ids?: IOperation['id'][];
    }) {
      return await fetchRoute(this.Route, body) as {
      operations?: IOperation[];
      requests?: IRequest[];
      documents?: IDocument[];
      error?: string;
      message?: string;
    };
    },
  },
};
