/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import {
  createSlice, combineReducers, PayloadAction, isAnyOf, isFulfilled, isRejected,
} from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import {
  DataState,
  DefaultDataState,
  DataSaga,
  AdminState,
  DefaultAdminState,
  AlertType,
  AlertVariant,
  GlobalState,
} from '@store/state';
import {
  Slice as TransferListSlice,
} from '@admin/Transfers/TransferList';
import {
  reducer as TransferDialogReducer,
} from '@admin/Transfers/TransferList/TransferDialog';
import * as Labels from '@labels';
import { ManagersSlice } from '@admin/Portfolio/Portfolio.Managers.Slice';
import PortfolioAnalyticsSlice from '@admin/Portfolio/Portfolio.Analytics.Slice';
import { PortfolioStatementsSlice } from '@admin/Portfolio/Portfolio.Accounts.Slice';
import { loadPortfolioStatements } from '@admin/Portfolio/Portfolio.Thunks';
import {
  IDocument, IExpandedStatement, IRequest, IUser,
} from '@interfaces';
import { dashboardReducers } from '../store/reducers';

function identity<T>(s: T): T { return s; }

export const global = createSlice({
  name: 'global',
  initialState: {
    error: '',
    theme: 'sketchy',
    inited: false,
  },
  reducers: {
    setTheme: (state: GlobalState, { payload }: PayloadAction<GlobalState['theme']>) => {
      state.theme = payload;
    },
    init: (state: GlobalState) => {
      state.inited = true;
    },
  },
});

export const data = createSlice({
  name: 'data',
  initialState: DefaultDataState,
  reducers: {
    // #region User
    // #endregion
    // #region Document
    loadDocuments: (state, _action: PayloadAction<DataSaga['loadDocuments']>) => {
      state.loading.documents = true;
    },
    setDocuments: (state, { payload }: PayloadAction<DataState['documents']>) => {
      state.documents = payload;
      state.loading.documents = false;
    },
    // #endregion
    // #region userDocumentData
    loadUserDocumentData: (state) => { state.loading.userDocumentData = true; },
    setUserDocumentData: (state, { payload }: PayloadAction<DataState['userDocumentData']>) => {
      state.userDocumentData = payload;
      state.loading.userDocumentData = false;
    },
    // #endregion
    setReady: (state, { payload }: PayloadAction<DataState['ready']>) => { state.ready = payload; },
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
    updateDocument: (state, { payload: newDocument }: PayloadAction<IDocument>) => {
      state.documents = state.documents.map((oldDocument) => { if (oldDocument.id === newDocument.id) { return newDocument; } return oldDocument; });
    },
    addedDocument: (state, { payload: newDocument }: PayloadAction<IDocument>) => {
      state.documents.push(newDocument);
    },
    // #endregion
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

const isRejectedAction = isAnyOf(isRejected(loadPortfolioStatements));
const isFulfilledAction = isAnyOf(isFulfilled(loadPortfolioStatements));

const handleAPIMessageAdmin = <T extends {error?: string; message?: string }>(result: T, state: AdminState) => {
  if (!result) return;
  const { error, message } = result;
  if (error || message) {
    state.alerts.push({
      id: uuid(),
      type: (error && AlertVariant.Danger) || (message && AlertVariant.Info) || AlertVariant.Primary,
      message: error ?? message,
      show: true,
    });
  }
};

const handleFetchFailed = (state: AdminState) => {
  state.alerts.push({
    id: uuid(),
    type: AlertVariant.Danger,
    message: Labels.Admin.FetchFailed,
    show: true,
  });
};

export const admin = createSlice({
  name: 'admin',
  initialState: DefaultAdminState,
  reducers: {
    serverResponseNullAndNoError: (state) => {
      state.alerts.push({
        id: uuid(),
        type: AlertVariant.Danger,
        message: `The server did not respond with the expected information.
      Please refresh the page to try again.`,
        show: true,
      });
    },
    addAlert: (state: AdminState, { payload }: PayloadAction<AlertType>) => { state.alerts.push(payload); },
    hideAllAlerts: (state: AdminState) => { state.alerts = state.alerts.map((alert) => ({ ...alert, show: false })); },
    showAllAlerts: (state: AdminState) => { state.alerts = state.alerts.map((alert) => ({ ...alert, show: true })); },
    removeAlert: (state: AdminState, { payload }: PayloadAction<AlertType['id']>) => {
      state.alerts = state.alerts.filter(({ id }) => id !== payload);
    },
    setActiveTab: (state, { payload }: PayloadAction<AdminState['activeTab']>) => {
      state.activeTab = payload;
    },
    setInited: (state: AdminState, { payload }: PayloadAction<AdminState['inited']>) => { state.inited = payload; },
    clickedTab: (state, { payload }: PayloadAction<AdminState['activeTab']>) => {
      state.activeTab = payload;
    },
    initTabFromURL: (state, { payload }: PayloadAction<{tab: AdminState['activeTab']; path?: string}>) => {
      state.activeTab = payload.tab;
      if (payload.path) window.history.pushState({}, '', payload.path);
    },
    setPortfolioBalances: (state: AdminState, { payload }: PayloadAction<AdminState['portfolioBalances']>) => {
      state.loading.portfolioBalances = false;
      state.portfolioBalances = payload;
    },
    setManagerFeeRate: (state: AdminState, { payload }: PayloadAction<AdminState['portfolioManagerFeeRate']>) => {
      state.portfolioManagerFeeRate = payload;
    },
    setSelectedManagerId: (state: AdminState, { payload }: PayloadAction<AdminState['selectedManagerId']>) => {
      state.selectedManagerId = payload;
    },
    showOpenAccountDialogForApplicationUUID: (state: AdminState, { payload }: PayloadAction<AdminState['showOpenAccountDialogForApplicationUUID']>) => {
      state.showOpenAccountDialogForApplicationUUID = payload;
    },
    handleSocketError: (state: AdminState, { payload }: PayloadAction<string>) => {
      handleAPIMessageAdmin({ error: payload }, state);
    },
    handleSocketInfo: (state: AdminState, { payload }: PayloadAction<string>) => {
      handleAPIMessageAdmin({ message: payload }, state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(isRejectedAction, (state) => {
        handleFetchFailed(state);
      })
      .addMatcher(isFulfilledAction, (state, { payload }) => {
        handleAPIMessageAdmin(payload, state);
      });
  },
});

/* the names of the reducers given to combineReducers determines which property on
the store's root "state" holds their state */
const createRootReducer = () => combineReducers({
  global: global.reducer,
  data: data.reducer,
  admin: admin.reducer,
  transferList: TransferListSlice.reducer,
  transferDialog: TransferDialogReducer,
  managersState: ManagersSlice.reducer,
  portfolioSummaryState: PortfolioAnalyticsSlice.reducer,
  portfolioStatementsState: PortfolioStatementsSlice.reducer,
  ...dashboardReducers,
});
export default createRootReducer;
