/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import {
  createSlice, combineReducers, PayloadAction,
} from '@reduxjs/toolkit';
import {
  IRequest, IDocument, IUser, IExpandedStatement,
} from '@interfaces';
import {
  GlobalState,
  DataState,
  DefaultDataState,
  DataSaga,
  DashboardState,
  DefaultDashboardState,
  AccountStatementsState,
  DefaultAccountStatementsState,
  StatementDetailsState,
  DefaultStatementDetailsState,
  TransactionsState,
  DefaultTransactionsState,
  AccountStatementsSaga,
  InformationState,
  DefaultInformationState,
  AlertType,
} from './state';

function identity<T>(s: T): T { return s; }

export const global = createSlice({
  name: 'global',
  initialState: { error: '' },
  reducers: {
    error: (state: GlobalState, { payload }: PayloadAction<GlobalState['error']>) => { state.error = payload; },
    handleLogOut: identity,
  },
});

export const data = createSlice({
  name: 'data',
  initialState: DefaultDataState,
  reducers: {
    // #region User
    loadUserInfo: (state) => { state.loading.userinfo = true; }, /* saga */
    setCurrentAccount: (state, { payload }: PayloadAction<DataState['currentAccount']>) => { state.currentAccount = payload; state.loading.currentAccount = false; },
    loadManagers: (state) => { state.loading.managers = true; }, /* saga */
    setManagers: (state, { payload }: PayloadAction<DataState['managers']>) => { state.managers = payload; state.loading.managers = false; },
    // #endregion
    // #region Statement
    loadStatements: (state, _action: PayloadAction<DataSaga['loadStatements']>) => {
      state.loading.statements = true;
    },
    setAccountStatements: (state, { payload }: PayloadAction<{accountNumber: IUser['accountNumber']; statements: IExpandedStatement[]}>) => {
      if (payload === null) {
        state.statements.clear();
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.statements = state.statements.set(payload.accountNumber, payload.statements);
      state.loading.statements = false;
    },
    loadStatementDetails: (state, _action: PayloadAction<DataSaga['loadStatementDetails']>) => {
      state.loading.statementDetails = true;
    },
    setStatementDetails: (state, { payload }: PayloadAction<DataState['statementDetails']>) => {
      state.statementDetails = payload;
      state.loading.statementDetails = false;
    },
    // #endregion
    // #region Trade
    loadTrades: (state, _action: PayloadAction<DataSaga['loadTrades']>) => {
      state.loading.trades = true;
    },
    setTrades: (state, { payload }: PayloadAction<DataState['trades']>) => {
      state.trades = payload;
      state.loading.trades = false;
    },
    // #endregion
    // #region Request
    loadAllOperationRequests: identity,
    loadOperationRequests: (state, _action: PayloadAction<DataSaga['loadOperationRequests']>) => {
      state.loading.requests = true;
    },
    setOperationRequests: (state, { payload }: PayloadAction<DataState['requests']>) => {
      state.requests = payload;
      state.loading.requests = false;
    },
    newOperationRequest: (state, _action: PayloadAction<DataSaga['newOperationRequest']>) => state,
    updateOperationRequest: (state, { payload: newRequest }: PayloadAction<IRequest>) => {
      state.requests = state.requests.map((oldRequest) => { if (oldRequest.id === newRequest.id) { return newRequest; } return oldRequest; });
    },
    addedOperationRequest: (state, { payload: newRequest }: PayloadAction<IRequest>) => {
      state.requests.push(newRequest);
    },
    cancelledOperationRequest: (state, { payload: requestId }: PayloadAction<number>) => {
      state.requests = state.requests.filter(({ id }) => id !== requestId);
    },
    // #endregion
    // #region Operation
    loadOperationRequestPendingCounts: (state) => {
      state.loading.operationRequestsPendingCounts = true;
    },
    setOperationRequestPendingCounts: (state, { payload }: PayloadAction<DataState['operationRequestPendingCounts']>) => {
      state.operationRequestPendingCounts = payload;
      state.loading.operationRequestsPendingCounts = false;
    },
    // #endregion
    // #region Document
    loadDocuments: (state, _action: PayloadAction<DataSaga['loadDocuments']>) => {
      state.loading.documents = true;
    },
    setDocuments: (state, { payload }: PayloadAction<DataState['documents']>) => {
      state.documents = payload;
      state.loading.documents = false;
    },
    updateDocument: (state, { payload: newDocument }: PayloadAction<IDocument>) => {
      state.documents = state.documents.map((oldDocument) => { if (oldDocument.id === newDocument.id) { return newDocument; } return oldDocument; });
    },
    addedDocument: (state, { payload: newDocument }: PayloadAction<IDocument>) => {
      state.documents.push(newDocument);
    },
    // #endregion
    setReady: (state, { payload }: PayloadAction<DataState['ready']>) => { state.ready = payload; },
    addTempBankAccount: (state, { payload }: PayloadAction<DataState['currentBankAccounts'][0]>) => {
      if (!state.currentBankAccountPending) {
        state.currentBankAccounts.push(payload);
        state.currentBankAccountPending = payload.uuid;
      }
    },
    loadUserAccounts: identity,
    resetStatementsAndOperations: identity,
  },
});

export const dashboard = createSlice({
  name: 'dashboard',
  initialState: DefaultDashboardState,
  reducers: {
    init: identity,
    removeAlert: (state: DashboardState, { payload: alertId }: PayloadAction<AlertType['id']>) => {
      state.alerts = state.alerts.map((alert) => {
        if (alert.id !== alertId) return alert;
        return { ...alert, show: false };
      });
    },
    addAlert: (state: DashboardState, { payload }: PayloadAction<AlertType>) => { state.alerts.push(payload); },
    setInited: (state: DashboardState, { payload }: PayloadAction<DashboardState['inited']>) => { state.inited = payload; },
  },
});

export const accountStatements = createSlice({
  name: 'accountStatements',
  initialState: DefaultAccountStatementsState,
  reducers: {
    init: (state: AccountStatementsState, _action: PayloadAction<AccountStatementsSaga['init']>) => state,
    initing: (state: AccountStatementsState, { payload: initing }: PayloadAction<AccountStatementsState['initing']>) => { state.initing = initing; },
    toggleOpen: (state: AccountStatementsState) => { state.open = !state.open; },
    setInited: (state: AccountStatementsState, { payload }: PayloadAction<AccountStatementsState['inited']>) => { state.inited = payload; },
  },
});

export const statementDetails = createSlice({
  name: 'statementDetails',
  initialState: DefaultStatementDetailsState,
  reducers: {
    setShowing: (state: StatementDetailsState, { payload }: PayloadAction<StatementDetailsState['showing']>) => { state.showing = payload; },
  },
});

export const transactions = createSlice({
  name: 'transactions',
  initialState: DefaultTransactionsState,
  reducers: {
    init: (identity),
    toggleOpen: (state: TransactionsState) => { state.open = !state.open; },
    setInited: (state: TransactionsState, { payload }: PayloadAction<TransactionsState['inited']>) => { state.inited = payload; },
  },
});

export const information = createSlice({
  name: 'information',
  initialState: DefaultInformationState,
  reducers: {
    init: (state: InformationState) => { state.inited = true; },
  },
});

/* the names of the reducers given to combineReducers determines which property on
the store's root "state" holds their state */
const rootReducer = combineReducers({
  data: data.reducer,
  dashboard: dashboard.reducer,
  accountStatements: accountStatements.reducer,
  transactions: transactions.reducer,
  information: information.reducer,
  statementDetails: statementDetails.reducer,
});
export const dashboardReducers = {
  dashboard: dashboard.reducer,
  accountStatements: accountStatements.reducer,
  transactions: transactions.reducer,
  information: information.reducer,
  statementDetails: statementDetails.reducer,
};
export default rootReducer;
