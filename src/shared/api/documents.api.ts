import { fetchRoute } from '@api';
import {
  IDocument, IRequest,
} from '@interfaces';

const path = '/api';

export const Documents = {
  FindByRequestId: {
    Route: `${path}/findDocumentByRequestId`,
    async post(body: {
      id: IRequest['id'];
    }) {
      return await fetchRoute(this.Route, body) as {
        document?: IDocument;
        error?: string;
      };
    },
  },
  FindByRequestIds: {
    Route: `${path}/findDocumentByRequestIds`,
    async post(body: {
      ids: IRequest['id'][];
    }) {
      return await fetchRoute(this.Route, body) as {
        documents?: IDocument[];
        error?: string;
      };
    },
  },
  Register: {
    Route: `${path}/registerRequestDocument`,
    async post(body: {
      requestId: IRequest['id'];
      sendEmail?: boolean;
      sendBy?: number;
    }) {
      return await fetchRoute(this.Route, body) as {
        document?: IDocument;
        message?: string;
        error?: string;
      };
    },
  },
  Delete: {
    Route: `${path}/unregisterRequestDocument`,
    async post(body: {
      id: IDocument['id'];
    }) {
      return await fetchRoute(this.Route, body) as {
        message?: string;
        error?: string;
      };
    },
  },
  Update: {
    Route: `${path}/updateDocument`,
    async post(body: {
      id: IDocument['id'];
      stage?: IDocument['stage'];
      status?: IDocument['status'];
      amount?: IDocument['amount'];
      documentLink?: IDocument['documentLink'];
      month?: IDocument['month'];
      year?: IDocument['year'];
    }) {
      return await fetchRoute(this.Route, body) as {
      success?: boolean;
      error?: string;
      message?: string;
      document?: IDocument;
    };
    },
  },
  SetLink: {
    Route: `${path}/setDocumentLink`,
    async post(body: {
      id: IDocument['id'];
      link: string;
    }) {
      return await fetchRoute(this.Route, body) as {
        error?: string;
        document?: IDocument;
      };
    },
  },
};
