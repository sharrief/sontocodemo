import { PromiseValue } from 'type-fest';
import { Map } from 'immutable';
import {
  IOperation, IRequest, RequestStatus, ITrade, IDocument, IBankDatum, IBankDatumTrimmed,
  IStatement, IUserTrimmed, IExpandedStatement, IManager, RoleId,
} from '@interfaces';
import { API } from '@api';
import { State as TransferListState } from '@admin/Transfers/TransferList';
import { State as TransferDialogState } from '../admin/Transfers/TransferList/TransferDialog/TransferDialog.State';

export enum Variant {
    Default = 'default',
    Info ='info',
    Success = 'success',
    Warning= 'warning',
    Danger= 'danger',
    Primary= 'primary',
    Secondary= 'secondary',
    Dark= 'dark',
    Light= 'light',
    Link= 'link',
}

export enum AlertVariant {
    Info ='info',
    Success = 'success',
    Warning= 'warning',
    Danger= 'danger',
    Primary= 'primary',
    Secondary= 'secondary',
    Dark= 'dark',
    Light= 'light',
}

export type AlertType = {
  title?: string;
  message: string;
  type: AlertVariant;
  id: string;
  show: boolean;
}
export type ThemeName = 'sketchy'|'sandstone'|'vapor'|'darkly'
export interface GlobalState {
  error: string;
  theme: ThemeName;
  inited: boolean;
}

export interface DataState {
  loading: {
    userinfo: boolean;
    accounts: boolean;
    managers: boolean;
    currentAccount: boolean;
    statements: boolean;
    statementDetails: boolean;
    requests: boolean;
    operations: boolean;
    trades: boolean;
    operationRequestsPendingCounts: boolean;
    documents: boolean;
    userDocumentData: boolean;
  };
  managers: IManager[];
  currentAccount: IUserTrimmed;
  currentBankAccountPending: string;
  currentBankAccounts: IBankDatumTrimmed[];
  statements: Map<IUserTrimmed['accountNumber'], IExpandedStatement[]>;
  statementDetails: Pick<IStatement, 'userId'|'month'|'year'>;
  requests: IRequest[];
  operationRequestDetails: Pick<IRequest, 'id'|'amount'|'datetime'|'status'|'admin'>;
  operations: IOperation[];
  trades: ITrade[];
  operationRequestPendingCounts: {
    [key: number]: number;
  };
  documents: IDocument[];
  userDocumentData: IBankDatum[];
  ready: boolean;
}
export const DefaultDataState: DataState = {
  loading: {
    userinfo: false,
    accounts: false,
    managers: false,
    currentAccount: false,
    statements: false,
    statementDetails: false,
    requests: false,
    operations: false,
    trades: false,
    operationRequestsPendingCounts: false,
    documents: false,
    userDocumentData: false,
  },
  managers: [],
  currentAccount: {
    name: '',
    lastname: '',
    businessEntity: '',
    id: 0,
    fmId: 0,
    displayName: '',
    accountNumber: '',
    email: '',
    obMonth: 0,
    obYear: 0,
    openingBalance: 0,
    operations: [],
    requests: [],
    documents: [],
    statements: [],
    bankAccounts: [],
    roleId: RoleId.client,
    hasAccountsAccess: false,
  },
  currentBankAccountPending: '',
  currentBankAccounts: [
    // {
    //   ...DefaultBankDatum, uuid: '1', accountEnding: '0987', name: 'Jane', lastName: 'Doe', address: { ...DefaultBankDatum.address, province: 'WA' },
    // },
    // {
    //   ...DefaultBankDatum, uuid: '2', accountEnding: 'AKLJ', name: 'Juan', lastName: 'Don', bankLocation: BankLocation.International, bankCountry: 'GB', address: { ...DefaultBankDatum.address, country: 'GB' },
    // },
    // {
    //   ...DefaultBankDatum, uuid: '3', accountEnding: 'XXBN', name: 'Jose Domingo Trust', accountType: BankAccountType.Business, bankLocation: BankLocation.International, bankCountry: 'CH', useIBAN: true, address: { ...DefaultBankDatum.address, country: 'NZ' },
    // },
    // {
    //   ...DefaultBankDatum, uuid: '4', accountEnding: '4637', name: 'James Dean LLC', accountType: BankAccountType.Business, address: { ...DefaultBankDatum.address, province: 'GA', postal: '30349' },
    // },
  ],
  statements: Map<IUserTrimmed['accountNumber'], IExpandedStatement[]>(),
  statementDetails: {
    userId: 0,
    month: 0,
    year: 0,
  },
  requests: [],
  operationRequestDetails: {
    id: 0,
    amount: 0,
    datetime: 0,
    status: RequestStatus.Voided,
    admin: false,
  },
  operations: [],
  trades: [],
  operationRequestPendingCounts: [],
  documents: [],
  userDocumentData: [],
  ready: false,
};

export interface AdminSaga {
  updateOperationRequest: Parameters<typeof API.Requests.Update.post>[0];
  updateRequestDocument: Parameters<typeof API.Documents.Update.post>[0];
  postOperationRequest: {rowIndex: number; postData: Parameters<typeof API.Requests.Post.post>[0]};
  voidOperationRequest: IRequest['id'];
}

export interface DataSaga {
  handleAccountChange: IUserTrimmed['id'];
  loadStatements: Parameters<typeof API.Statements.Find.post>[0];
  loadStatementDetails: {
    userId: IUserTrimmed['id'];
    month: IStatement['month'];
    year: IStatement['year'];
  };
  loadOperationRequests:
    {
      userId: IUserTrimmed['id'];
      statuses: IRequest['status'][];
    }
  ;
  loadOperationRequestDetails: IRequest['id'];
  newOperationRequest: Parameters<typeof API.Requests.Create.post>[0];
  loadOperations: IOperation['userId'];
  loadDocuments: {
    userId: IDocument['userId'];
    operationRequestId: IDocument['operationId'];
    month?: IDocument['month'];
    year?: IDocument['year'];
  };
  loadTrades: Parameters<typeof API.Trades.Find.post>[0];
  handleUpdateOperationRequest: Parameters<typeof API.Requests.Update.post>[0];
  handlePostOperationRequest: AdminSaga['postOperationRequest'];
}
export interface DashboardState {
  inited: boolean;
  alerts?: AlertType[];
  welcomeMsgRnd: number;
  welcomeQuoteRnd: number;
}
export const DefaultDashboardState: DashboardState = {
  inited: false,
  alerts: [],
  welcomeMsgRnd: 0,
  welcomeQuoteRnd: 0,
};
export interface AccountStatementsSaga {
  init: IUserTrimmed['accountNumber'];
}
export interface AccountStatementsState {
  inited: boolean;
  initing: boolean;
  open: boolean;
}
export const DefaultAccountStatementsState: AccountStatementsState = {
  inited: false,
  initing: false,
  open: false,
};

export interface StatementDetailsState {
  showing: boolean;
}
export const DefaultStatementDetailsState: StatementDetailsState = {
  showing: false,
};

export interface TransactionsState {
  open: boolean;
  inited: boolean;
  transaction: {id: IRequest['id']};
}
export const DefaultTransactionsState: TransactionsState = {
  open: false,
  inited: false,
  transaction: {
    id: 0,
  },
};

export interface InformationState {
  inited: boolean;
}
export const DefaultInformationState: InformationState = {
  inited: false,
};

export enum AdminTab {
  Transfers = 'transfers',
  Statements = 'statements',
  Analytics = 'analytics',
  Accounts = 'accounts',
  Applications = 'applications',
  Forms = 'forms',
  Trades = 'trades',
}

export type AdminState = {
  alerts?: AlertType[];
  detailsAlert?: AlertType;
  loading: {[key: string]: boolean};
  inited: boolean;
  activeTab: AdminTab;
  managers: DataState['managers'];
  operationRequests: DataState['requests'];
  operationRequestsPageCount: number;
  operationRequestsTotalCount: number;
  documents: DataState['documents'];
  operationRequestId?: IRequest['id'];
  postOperationRequestDialog?: AdminSaga['postOperationRequest'];
  portfolioBalances: PromiseValue<ReturnType<typeof API.Managers.KPI.get>>['portfolioBalances'];
  portfolioInited: boolean;
  portfolioManagerFeeRate: number;
  selectedManagerId: number;
  showOpenAccountDialogForApplicationUUID: string;
 };

export type ManagersState = {
  inited: boolean;
  loading: boolean;
  portfolioSummaryByAccountAndMonth: PromiseValue<ReturnType<typeof API.Managers.KPI.get>>['portfolioBalances'];
  managers: IManager[];
  selectedManagerId: IUserTrimmed['id'];
  selectedManagerIds: IUserTrimmed['id'][];
}

export const DefaultManagersState: ManagersState = {
  inited: false,
  loading: false,
  portfolioSummaryByAccountAndMonth: [],
  managers: [],
  selectedManagerId: 0,
  selectedManagerIds: [],
};

export type PortfolioAnalyticsState = {
  feeRate: number;
  inited: boolean;
  loading: boolean;
  totalsByMonth: PromiseValue<ReturnType<typeof API.Managers.KPI.get>>['portfolioBalances'];
}

export type PortfolioStatementsState = {
  loading: {
    accounts: boolean;
    statements: boolean;
    operations: boolean;
    latestTradeMonth: boolean;
    monthROI: boolean;
  };
  inited: {
    accounts: boolean;
    statements: boolean;
    operations: boolean;
    latestTradeMonth: boolean;
    monthROI: boolean;
  };
  accounts: IUserTrimmed[];
  statements: IStatement[];
  operations: IOperation[];
  monthROI: {month: number; year: number; interest: number }[];
  latestTradeMonth: {month: number; year: number};
  filteredMonthIds: number[];
  selectedAccounts: IUserTrimmed['id'][];
  showGenDialog: boolean;
  sendEmails: boolean;
  emailType: 'text'|'old';
  ccManager: boolean;
  genState: 'ready'|'busy'|'done';
  genEmailsState: {
    inProgress: boolean;
    countTotal: number;
    countLeft: number;
    timeTotal: number;
    timeLeft: number;
    timeEach: number;
    showProgress: boolean;
  };
}

export type PortfolioOperationsDialogState = {
  loading: boolean;
  operationsByUserId: {[id: number]: IOperation[]};
  showingOpsFor: {userId: number; month: number; year: number};
}

export const DefaultPortfolioStatementsState: PortfolioStatementsState = {
  loading: {
    accounts: false, statements: false, operations: false, latestTradeMonth: false, monthROI: false,
  },
  inited: {
    accounts: false, statements: false, operations: false, latestTradeMonth: false, monthROI: false,
  },
  accounts: [],
  statements: [],
  operations: [],
  monthROI: [],
  latestTradeMonth: { year: 1970, month: 1 },
  filteredMonthIds: [],
  selectedAccounts: [],
  showGenDialog: false,
  sendEmails: true,
  emailType: 'old',
  ccManager: false,
  genState: 'ready',
  genEmailsState: {
    inProgress: false,
    countTotal: 0,
    countLeft: 0,
    timeTotal: 0,
    timeLeft: 0,
    timeEach: 0,
    showProgress: false,
  },
};

export const DefaultPortfolioOperationsDialogState: PortfolioOperationsDialogState = {
  loading: false,
  operationsByUserId: {},
  showingOpsFor: null,
};

export const DefaultPortfolioAnalyticsState: PortfolioAnalyticsState = {
  feeRate: 5,
  inited: false,
  loading: false,
  totalsByMonth: [],
};

export const DefaultAdminState: AdminState = {
  alerts: [],
  detailsAlert: undefined,
  loading: {
    portfolioBalances: false,
    transfers: false,
  },
  inited: false,
  activeTab: AdminTab.Transfers,
  managers: [], // Need to remove these since they are stored in DataState
  operationRequests: [],
  operationRequestsPageCount: 0,
  operationRequestsTotalCount: 0,
  documents: [],
  operationRequestId: undefined,
  postOperationRequestDialog: undefined,
  portfolioBalances: [],
  portfolioInited: false,
  portfolioManagerFeeRate: 5,
  selectedManagerId: 0,
  showOpenAccountDialogForApplicationUUID: '',
};

export interface CombinedState {
  // router: RouterState;
  global: GlobalState;
  data: DataState;
  dashboard: DashboardState;
  accountStatements: AccountStatementsState;
  statementDetails: StatementDetailsState;
  transactions: TransactionsState;
  information: InformationState;
  admin: AdminState;
  transferList: TransferListState;
  transferDialog: TransferDialogState;
  managersState: ManagersState;
  portfolioSummaryState: PortfolioAnalyticsState;
  portfolioStatementsState: PortfolioStatementsState;
  portfolioOperationsDialogState: PortfolioOperationsDialogState;
}

export default CombinedState;
