import { fetchRoute } from '@api';
import {
  IRequest, OperationType, DocumentStage,
} from '@interfaces';

export type RequestParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  fmId?: number;
  effectiveMonth?: string;
  type?: OperationType;
  stage?: DocumentStage;
  withUser?: boolean;
  withManager?: boolean;
  withDocuments?: boolean;
  withBankAccounts?: boolean;
  withOperations?: boolean;
}

export const EffectiveMonthFormat = 'MM-yyyy';

export type RequestParamsQueries = Pick<
  RequestParams,
  'page'|'limit'|'search'|'status'|'type'|'stage'|'fmId'>

export const RequestParamsKeys: (keyof RequestParamsQueries)[] = [
  'page', 'limit', 'search', 'status', 'type', 'stage', 'fmId',
];

export const Admin = {
  Requests: {
    Route: '/api/admin/requests',
    async get(
      params?: RequestParams,
    ) {
      return await fetchRoute(`${this.Route}${params
        ? `?${
          Object.keys(params)
            .map((key) => `${key}=${params[key as keyof RequestParams]}`)
            .join('&')}`
        : ''}`) as {
        requests?: IRequest[];
        pageCount?: number;
        pageIndex?: number;
        totalCount?: number;
        error?: string;
      };
    },
  },
};
