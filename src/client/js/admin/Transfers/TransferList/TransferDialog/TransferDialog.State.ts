/* eslint-disable no-param-reassign */
import {
  DocumentStage,
  IBankDatumTrimmed, IDocument, IOperation, IRequest, IUser, OperationType, RequestStatus,
} from '@interfaces';

export type State = {
  inited: boolean;
  messages: string[];
  errors: string[];
  request: IRequest;
  requests: IRequest[];
  document: IDocument;
  operations: IOperation[];
  statementBalances: { month: number; year: number; endBalance: number}[];
  latestStatementBalance: { month: number; year: number; endBalance: number};
  earliestStatementBalance: { month: number; year: number; endBalance: number};
  account: IUser;
  manager: IUser;
  bankAccounts: IBankDatumTrimmed[];
  loading: {
    request: boolean;
    requests: boolean;
    document: boolean;
    operations: boolean;
    statementBalances: boolean;
    account: boolean;
    manager: boolean;
    bankAccounts: boolean;
  };
  loaded: {
    request: boolean;
    requests: boolean;
    document: boolean;
    operations: boolean;
    statementBalances: boolean;
    account: boolean;
    manager: boolean;
    bankAccounts: boolean;
  };
  prompts: {
    showMakeRecurringPrompt?: boolean;
    showCancelPrompt?: boolean;
    showPostPrompt?: boolean;
    showManualEdit?: boolean;
    showUndoPost?: boolean;
    showTaskDialog?: boolean;
    showRegisterDialog?: boolean;
  };
  manualEdit: {
    status?: RequestStatus;
    stage?: DocumentStage;
    notes?: string;
    link?: string;
  };
  undoPost: {
    selectedIds: number[];
  };
  saving: {
    request: boolean;
    document: boolean;
    operations: boolean;
  };
  transferConfirmation: {
    loading: boolean;
    ready: boolean;
    inited: boolean;
    loadingError?: boolean;
    adjustment: number;
    month: number;
    year: number;
    wireConfirmation: string;
    wireAmount: number;
    wireDay: number;
    wireMonth: number;
    wireYear: number;
    bankEndingUUID: string;
  };
  taskDialog: {
    newValue: string;
  };
  emailPreview: {
    emailMessage: string;
    requestAmount: number;
    requestType: OperationType;
    canEmail: boolean;
    sendEmail: boolean;
  };
  balancePreview: {
    ready: boolean;
    lastFetchedAccountNumber: string;
  };
  bankData: {
    inited: boolean;
    accounts: IBankDatumTrimmed[];
  };
  processing: {
    loadingBankData: boolean;
  };
};
