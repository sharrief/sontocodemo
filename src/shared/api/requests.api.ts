import { fetchRoute } from '@api';
import {
  IBankDatumTrimmed,
  IDocument, IOperation, IRequest, IUser, RequestStatus,
} from '@interfaces';

const path = '/api';
type postRequestResponse = {success?: boolean; request?: IRequest; document?: IDocument; error?: string; message: string }

export const Requests = {
  All: {
    Route: `${path}/allRequests`,
    async get() {
      return await fetchRoute(
        this.Route,
      ) as {
      requests?: IRequest[];
      pageCount?: number;
      totalCount?: number;
      error?: string;
    };
    },
  },
  FindById: {
    Route: `${path}/findRequestById`,
    async post(body: {
      id: IRequest['id'];
    }) {
      return await fetchRoute(this.Route, body) as {
        request?: IRequest;
        error?: string;
      };
    },
  },
  FindActive: {
    Route: `${path}/findActiveRequestsByAccountNumber`,
    async post(body: {
      userId?: IUser['id'];
      countOnly?: boolean;
      accountNumber?: string;
    }) {
      return await fetchRoute(this.Route, body) as {
        requests?: IRequest[];
        counts?: {
          [userId: number]: number;
        };
        error?: string;
      };
    },
  },
  GetCountOfPendingByUser: {
    Route: `${path}/pendingRequestCounts`,
    async get() {
      return await fetchRoute(this.Route) as {
      operationRequestPendingCounts?: {
        count: number;
        id: IRequest['userId'];
        }[];
      error?: string;
      };
    },
  },
  Create: {
    Route: `${path}/newRequest`,
    async post(body: {
      accountNumber: IUser['accountNumber'];
      amount: IRequest['amount'];
      sendEmail: boolean;
      bankUUID?: IBankDatumTrimmed['uuid'];
    }) {
      return await
    fetchRoute(this.Route, body) as postRequestResponse;
    },
  },
  Update: {
    Route: `${path}/updateRequest`,
    async post(body: {
      id: IRequest['id'];
      status?: RequestStatus;
      bankAccountUUID?: IRequest['bankAccountUUID'];
      amount?: number;
      wireConfirmation?: string;
    }) { return await fetchRoute(this.Route, body) as postRequestResponse & {request?: IRequest; savedDocument?: IDocument }; },
  },
  Post: {
    Route: `${path}/postRequest`,
    async post(body: {
      id: IRequest['id'];
      adjustment: number;
      month: number;
      year: number;
      wireConfirmation: string;
      wireAmount: number;
      wireDay: number;
      wireMonth: number;
      wireYear: number;
      bankEndingUUID: string;
      emailMessage?: string;
      sendEmail?: boolean;
      asWire?: boolean;
    }) { return await fetchRoute(this.Route, body) as {operation?: IOperation} & postRequestResponse; },
  },
  UnPost: {
    Route: `${path}/unPostRequest`,
    async post(body: {
      id: IRequest['id'];
    }) { return await fetchRoute(this.Route, body) as { request?: IRequest; message?: string; error?: string }; },
  },
  Cancel: {
    Route: `${path}/cancelRequest`,
    async post(body: {
      id: IRequest['id'];
      sendEmail: boolean;
      emailMessage?: string;
    }) { return await fetchRoute(this.Route, body) as { request?: IRequest; document?: IDocument; message?: string; error?: string }; },
  },
  MakeRecurring: {
    Route: `${path}/makeRequestRecurring`,
    async post(body: {
      id: IRequest['id'];
      sendEmail: boolean;
      monthAndYear?: { month: number; year: number };
    }) { return await fetchRoute(this.Route, body) as { request?: IRequest; document?: IDocument; message?: string; error?: string }; },
  },
};
