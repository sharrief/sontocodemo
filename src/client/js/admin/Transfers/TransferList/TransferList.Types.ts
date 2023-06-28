import {
  IDocument, OperationType, IRequest, IOperation, IUser, IBankDatum, IBankDatumTrimmed,
} from '@interfaces';
import { RequestParams } from 'shared/api/admin.api';

export type TransferListRow =
Pick<IRequest, 'id' | 'amount' | 'datetime' | 'status' | 'wireConfirmation' | 'admin' | 'bankAccountUUID'>
& {
  // These props are calculated and merged/set in the saga
  posted: (Pick<IOperation, 'id' | 'amount' | 'year' | 'month' | 'day' | 'wireConfirmation'|'created'> & {createdBy?: Pick<IUser, 'displayName'>})[];
  effectiveTradeMonth?: { date: string; posted: boolean };
  type: OperationType;
  account?: {
    displayName?: string;
    name?: string;
    accountNumber?: string;
    businessEntity?: string;
    email?: IUser['email'];
    userId?: IUser['id'];
    saved?: string;
    bankAccounts?: IBankDatumTrimmed[];
  } & Pick<IBankDatum, 'DCAF' | 'accountEnding'>;
  document?: {
    id?: IDocument['id'];
    stage?: IDocument['stage'];
    notes?: IDocument['status'];
    link?: IDocument['documentLink'];
    lastUpdated?: IDocument['lastUpdated'];
  };
  manager?: {
    userName?: IUser['username'];
    email?: IUser['email'];
  };
  editing: boolean;
  dirty: boolean;
};
export type TransferListRows = TransferListRow[];

export type State = {
  initialized: boolean;
  busy: boolean;
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  search: string;
  filters: { [key: string]: {type: 'radio'; value: (string)}|{type: 'checkbox'; value: (string)[]} };
  dirtyFilter: boolean;
  requestParams: RequestParams;
}
