/* eslint-disable max-len */
import { createStore, Dispatch } from 'redux';
import {
  getDefaultMiddleware, ThunkAction, Action, compose, applyMiddleware,
} from '@reduxjs/toolkit';
import logger from 'redux-logger';
import CombinedState, { AlertVariant } from '@store/state';
import { endpoints, API } from '@api';
import createRootReducer, {
  admin,
} from '@admin/admin.reducers';
import useSWR, { mutate } from 'swr';
import {
  DefaultDocument,
  DefaultRequest,
  DefaultUser, DocumentStage, IDocument, IExpandedStatement, IOperation, IRequest, IStatement, IUserTrimmed, RoleId,
} from '@interfaces';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { RequestParams } from 'shared/api/admin.api';
import { TransferListRow } from './Transfers/TransferList';
import FetchTransfers from './Transfers/TransferList/TransferList.FetchTransfers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminThunk<ArgsType, ActionType = any> = (args?: ArgsType) => ThunkAction<void, CombinedState, unknown, Action<ActionType>>

export const handleLogOut: AdminThunk<void> = () => () => {
  window.location.href = endpoints.logout;
};

export const clickedTabThunk: AdminThunk<{ tab: CombinedState['admin']['activeTab']; path: string }> = ({ tab }) => (dispatch) => {
  dispatch(admin.actions.clickedTab(tab));
};

export function handleMessageAndError(arg: { message?: string; error?: string; success?: boolean }, dispatch: Dispatch) {
  const { message: msg, error, success } = arg;
  if (!msg && !error) return;
  let type = AlertVariant.Primary;
  if (error) type = AlertVariant.Danger;
  if (success) type = AlertVariant.Success;
  const message = error || msg;
  const show = true;
  const id = v4();
  dispatch(admin.actions.addAlert({
    type,
    message,
    show,
    id,
  }));
}

export function getUserInfo() {
  const { data, error, mutate } = useSWR(
    API.Users.SignedInV2.Route,
    async () => API.Users.SignedInV2.get(),
  );
  return {
    userinfo: data?.user, userinfoLoading: !data && !error, error, mutate,
  };
}

export function useAccessLevelDirector() {
  const { userinfo, userinfoLoading } = getUserInfo();
  return [RoleId.admin, RoleId.director].includes(userinfo.roleId);
}

export function useUser(id: number) {
  const { data, error, isLoading } = useSWR(
    id && [API.Accounts.FindById.Route, id],
    ([_r, a]) => API.Accounts.FindById.post({ id: a }),
  );
  return { account: data?.account || DefaultUser, accountLoading: isLoading, error: error || data?.error };
}

export function useAccounts() {
  const {
    data, error, mutate: refreshAccounts, isLoading,
  } = useSWR(API.Accounts.Find.Route, async () => API.Accounts.Find.get());
  return {
    accounts: data?.accounts?.length ? data.accounts : [DefaultUser],
    accountsLoading: isLoading,
    error: error || data?.error,
    refreshAccounts,
  };
}

export function useAccount(accountNumber: string, dispatch?: Dispatch) {
  const {
    data, error, isLoading, mutate: refreshAccount,
  } = useSWR(
    accountNumber && [API.Accounts.FindByAccountNumber.Route, accountNumber],
    async ([_r, a]) => API.Accounts.FindByAccountNumber.post({ accountNumber: a }),
  );
  if (dispatch && data) handleMessageAndError(data, dispatch);
  return {
    account: data?.account || DefaultUser, accountLoading: isLoading, error: error || data?.error, refreshAccount,
  };
}

export function useBankAccounts(accountNumber: string, dispatch: Dispatch) {
  const {
    data, error, isLoading, mutate: m,
  } = useSWR(
    !!accountNumber && [API.BankData.Find.Route, accountNumber],
    async ([_r, a]) => {
      const b = '\'';
      return API.BankData.Find.post({ accountNumber: a });
    },
  );
  if (data) handleMessageAndError(data, dispatch);
  return {
    bankAccounts: data?.bankAccounts || [], bankAccountsLoading: isLoading, error: error || data?.error, mutate: m,
  };
}

export function useManager(accountNumber: string, dispatch?: Dispatch) {
  const { data, error } = useSWR(
    accountNumber && [API.Managers.FindByAccountNumber.Route, accountNumber],
    async ([_r, a]) => API.Managers.FindByAccountNumber.post({ accountNumber: a }),
  );
  if (dispatch && data) handleMessageAndError(data, dispatch);
  return { manager: data?.manager || DefaultUser, managerLoading: !data && !error, error };
}

export function getManagers() {
  const { data, error, isLoading } = useSWR(API.Managers.All.Route, async () => API.Managers.All.get());
  return { managers: data?.managers || [], managersLoading: isLoading, error };
}

export function useActivityCount() {
  const {
    data, error, isLoading, mutate: refreshActivityCount,
  } = useSWR(
    API.Requests.FindActive.Route,
    async () => API.Requests.FindActive.post({ countOnly: true }),
  );
  return {
    operationRequestPendingCounts: data?.counts, countsLoading: isLoading, error, refreshActivityCount,
  };
}

export function useRequest(requestId: number, dispatch?: Dispatch) {
  const {
    data, error, isLoading, ...rest
  } = useSWR(
    requestId && [API.Requests.FindById.Route, requestId],
    async ([_r, a]) => {
      const res = await API.Requests.FindById.post({ id: a });
      return res;
    },
  );
  if (dispatch && data) handleMessageAndError(data, dispatch);
  return {
    ...rest, request: data?.request || DefaultRequest, requestLoading: isLoading, error: error || data?.error,
  };
}

function handleRequestUpdate(request: IRequest) {
  if (request?.id) {
    mutate([API.Requests.FindById.Route, request?.id], { request }, false);
  }
}

export function useActiveRequests(accountNumber: string) {
  const {
    data, error, isLoading, mutate: refreshActiveRequests,
  } = useSWR(
    accountNumber && [API.Requests.FindActive.Route, accountNumber],
    async ([_r, a]) => API.Requests.FindActive.post({ accountNumber: a }),
  );
  return {
    requests: data?.requests || [], requestsLoading: isLoading, error, refreshActiveRequests,
  };
}

let cachedRequestParams: RequestParams = {};
export function useTransferList(requestParameters: RequestParams, dispatch?: Dispatch) {
  cachedRequestParams = requestParameters;
  const {
    data, error, isLoading, mutate: refreshTransfers,
  } = useSWR(
    [API.Admin.Requests.Route, JSON.stringify(requestParameters)],
    ([_r, q]) => FetchTransfers(JSON.parse(q) as RequestParams, dispatch),
  );

  return {
    refreshTransfers,
    ...data,
    transfers: data?.transfers || [],
    transfersLoading: isLoading,
    error: error || data?.error,
  };
}
function updateTransferListCache(data: { updatedRequest?: IRequest; updatedDocument?: IDocument; deleteDocument?: IRequest['id'] }) {
  const { updatedRequest, updatedDocument, deleteDocument } = data;
  if (updatedRequest || updatedDocument || deleteDocument) {
    mutate([API.Admin.Requests.Route, cachedRequestParams], (cache: { requests: IRequest[]; transfers: TransferListRow[] }) => {
      if (!cache) return undefined;
      const { transfers } = cache;
      const updatedTransfers = transfers.map((transfer) => {
        if (transfer.id === updatedRequest?.id || transfer.id === updatedDocument?.operationId || transfer.id === deleteDocument) {
          const { status } = updatedRequest ?? transfer;
          if (deleteDocument) {
            return {
              ...transfer,
              status,
              document: {
                id: 0,
                stage: DocumentStage.Requested,
                notes: '',
                lastUpdated: 0,
                link: '',
              },
            };
          }
          const {
            id, stage, status: notes, lastUpdated, documentLink: link,
          } = updatedDocument ?? { ...transfer.document, status: transfer.document.notes, documentLink: transfer.document.link };
          return {
            ...transfer,
            status,
            document: {
              id, stage, notes, lastUpdated, link,
            },
          };
        }
        return transfer;
      });
      return { ...cache, transfers: updatedTransfers };
    }, false);
  }
}

export function useOperations(accountNumber: string) {
  const {
    data, error, isLoading, ...rest
  } = useSWR(
    !!accountNumber && [API.Operations.FindByAccountNumber.Route, accountNumber],
    async ([_r, a]) => API.Operations.FindByAccountNumber.post({ accountNumber: a }),
  );
  return {
    ...rest, operations: data?.operations || [], operationsLoading: isLoading, error: error || data?.error,
  };
}

export function useOperationsWithRequestsAndBank(accountNumber: string) {
  const {
    data, error, isLoading, ...rest
  } = useSWR(
    !!accountNumber && [API.Operations.FindByAccountNumber.Route, accountNumber, 'withRequestsAndBankAccounts'],
    async ([_r, a]) => API.Operations.FindByAccountNumber.post({ accountNumber: a, withRequestsAndBankAccounts: true }),
  );
  return {
    ...rest, operations: data?.operations || [], requests: data?.requests || [], bankAccounts: data?.bankAccounts || [], dataLoading: isLoading, error: error || data?.error,
  };
}

export function useOperationsByRequest(requestId: number) {
  const {
    data, error, isLoading, ...rest
  } = useSWR(
    requestId && [API.Operations.FindByRequestId.Route, requestId],
    async ([_r, a]) => API.Operations.FindByRequestId.post({ id: a }),
  );
  return {
    ...rest, operations: data?.operations || [], operationsLoading: isLoading, error: error || data?.error,
  };
}

function handleOperationUpdate(operation: IOperation) {
  if (operation?.id && operation?.requestId) {
    mutate([API.Operations.FindByRequestId.Route, operation?.requestId], ((cache: { operations: IOperation[] }) => {
      if (!cache && !operation.deleted) return { operations: [operation] };
      const { operations } = cache;
      let newOperation = true;
      let updatedOperations: IOperation[] = [];
      if (operation.deleted) {
        newOperation = false;
        updatedOperations = operations.filter((op) => {
          if (op.id === operation.id) return false;
          return true;
        });
      } else {
        updatedOperations = operations.map((op) => {
          if (op.id === operation.id) { newOperation = false; return operation; }
          return op;
        });
      }
      if (newOperation) return { ...cache, operations: [...operations, operation] };
      return { ...cache, operations: updatedOperations };
    }), false);
  }
}

export function useDocument(requestId: number, dispatch?: Dispatch) {
  const {
    data, error, isLoading, ...rest
  } = useSWR(
    requestId && [API.Documents.FindByRequestId.Route, requestId],
    async ([_r, id]) => API.Documents.FindByRequestId.post({ id }),
  );
  if (dispatch && data) handleMessageAndError(data, dispatch);
  return {
    ...rest, document: data?.document || DefaultDocument, documentLoading: isLoading, error: error || data?.error,
  };
}

function handleDocumentUpdate(document: IDocument) {
  if (document?.operationId) {
    mutate([API.Documents.FindByRequestId.Route, document.operationId], { document }, false);
  }
}

export function handleDocumentDelete(id: IRequest['id'], response: { error?: string; message?: string; success?: boolean }, dispatch: Dispatch) {
  mutate([API.Documents.FindByRequestId.Route, id], { document: undefined }, false);
  updateTransferListCache({ deleteDocument: id });
  const { error, message, success } = response;
  if (error || message) handleMessageAndError({ error, message, success }, dispatch);
}

export function handleTransferUpdate(update: {
  request?: IRequest; document?: IDocument; operation?: IOperation;
  requests?: IRequest[]; documents?: IDocument[]; operations?: IOperation[];
  error?: string; message?: string; success?: boolean;
}, dispatch: Dispatch) {
  const {
    request, document, operation, error, message, success,
    requests, documents, operations,
  } = update;
  if (request) handleRequestUpdate(request);
  if (requests) {
    requests.forEach((r) => {
      handleRequestUpdate(r);
      const d = documents?.find(({ operationId }) => operationId === r.id);
      updateTransferListCache({ updatedRequest: r, updatedDocument: d });
    });
  }
  if (document) handleDocumentUpdate(document);
  if (documents) documents.forEach((d) => handleDocumentUpdate(d));
  if (operation) handleOperationUpdate(operation);
  if (operations) operations.forEach((o) => handleOperationUpdate(o));
  if (request || document) updateTransferListCache({ updatedRequest: request, updatedDocument: document });
  if (error || message) handleMessageAndError({ error, message, success }, dispatch);
}

export function getLatestTradeMonth() {
  const { data, error } = useSWR(API.Trades.Latest.Route, async () => API.Trades.Latest.get());
  return {
    month: data?.month, year: data?.year, latestTradeMonthLoading: !data && !error, error,
  };
}

type StatementsAll = Parameters<typeof API.Statements.All.post>[0];

export function useAllStatements(args: StatementsAll, dispatch: Dispatch) {
  const argsKey = JSON.stringify(args);
  const { data, error, isLoading } = useSWR([API.Statements.All.Route, argsKey], async ([_r, _args]) => API.Statements.All.post(JSON.parse(_args) as Parameters<typeof API.Statements.All.post>[0]));
  handleMessageAndError({ error: error || data?.error }, dispatch);
  return {
    statements: data?.statements, statementsLoading: isLoading, error: error || data?.error,
  };
}

export function useLatestStatements(args: Pick<StatementsAll, 'userIds' | 'withOperations' | 'withTrades'>, dispatch: Dispatch) {
  const { userIds, withOperations, withTrades } = args;
  const {
    data, error, isLoading, mutate: refreshLatestStatements,
  } = useSWR(
    [API.Statements.All.Route, JSON.stringify(userIds), withOperations, withTrades],
    async ([_r, _userIds, _withOperations, _withTrades]) => API.Statements.All.post({
      latestOnly: true,
      userIds: JSON.parse(_userIds),
      withOperations: _withOperations,
      withTrades: _withTrades,
    }),
  );

  handleMessageAndError({ error: error || data?.error }, dispatch);
  return {
    refreshLatestStatements,
    statements: data?.statements,
    statementsLoading: isLoading,
    error: error || data?.error,
  };
}
const expandStatements = (statements: IStatement[], account: IUserTrimmed) => {
  const { obMonth: openMonth, obYear: openYear, openingBalance: accountOpeningBalance } = account;
  return statements.map((statement, _idx, statementArray) => {
    const openingBalance = statementArray.reduce((balance, previousStatement) => {
      if (balance) return balance;
      const currentStatementDate = DateTime.fromFormat(`${statement.year}-${statement.month}`, 'yyyy-M');
      if (currentStatementDate.equals(DateTime.fromFormat(`${openYear}-${openMonth}`, 'yyyy-M'))) return accountOpeningBalance;
      const comparedStatementDate = DateTime.fromFormat(`${previousStatement.year}-${previousStatement.month}`, 'yyyy-M');
      if (currentStatementDate.minus({ month: 1 }).equals(comparedStatementDate)) { return previousStatement.endBalance; }
      return balance;
    }, 0);
    // const netReturn = statement.trades.reduce((total, trade) => total + ((openingBalance || 0) * (trade.interest / 100)), 0);
    const netReturn = statement.gainLoss;
    const grossReturn = netReturn / (1 - (statement.perfFee / 100));
    const feeTotal = grossReturn - netReturn;
    const expandedStatement: IExpandedStatement = {
      ...statement,
      openingBalance,
      netReturn,
      grossReturn,
      feeTotal,
    };
    return expandedStatement;
  });
};

export function useStatements(accountNumber: string) {
  const {
    data: accountData, error: accountError, isLoading: validatingAccounts,
  } = useSWR(
    accountNumber && [API.Accounts.FindByAccountNumber.Route, accountNumber],
    async ([_r, a]) => API.Accounts.FindByAccountNumber.post({ accountNumber: a }),
  );

  // Fetch and transform IStatement[] into IExpandedStatement
  const {
    data, error, isLoading: validatingStatements, mutate: refreshStatements,
  } = useSWR(
    accountData && [API.Statements.Find.Route, accountNumber],
    async ([_r, a]) => {
      const { statements: s, error: e } = await API.Statements.Find.post({ accountNumber: a, withOperations: true });
      const statements = expandStatements(s, accountData.account);
      return { statements, error: e };
    },
  );

  return {
    statements: data?.statements || [], statementsLoading: (!data && !error) || validatingAccounts || validatingStatements, error: accountError || error, refreshStatements,
  };
}

export function useStatementsByAccountNumbers(accounts: IUserTrimmed[]) {
  const { data, error, isLoading: validatingStatements } = useSWR(
    accounts && [API.Statements.All.Route, ...accounts.map(({ id }) => id)],
    async ([_r, ...userIds]) => API.Statements.All.post({ userIds, latestOnly: true }),
  );

  return { statements: data?.statements || [], statementsLoading: (!data && !error) || validatingStatements, error: data.error || error };
}

export function useStatementBalances(accountNumber: string) {
  const { data, error, isLoading } = useSWR(
    accountNumber && [API.Statements.Balances.Route, accountNumber],
    async ([_r, a]) => API.Statements.Balances.post({ accountNumber: a }),
  );
  return { statementBalances: data?.statementBalances || [], statementBalancesLoading: isLoading, error: error && data?.error };
}

export async function submitCreditRequest(amount: number, accountNumber: string, sendEmail: boolean) {
  const { message, error } = await API.Requests.Create.post({ amount, accountNumber, sendEmail });
  mutate([API.Requests.FindActive.Route, accountNumber]);
  mutate(API.Requests.FindActive.Route);
  mutate(API.Requests.FindActive.Route);
  return { message, error };
}

export async function submitDistributionRequest(amount: number, accountNumber: string, bankUUID: string, sendEmail: boolean) {
  const { message, error } = await API.Requests.Create.post({
    amount: -1 * Math.abs(amount), accountNumber, sendEmail, bankUUID,
  });
  mutate([API.Requests.FindActive.Route, accountNumber]);
  mutate(API.Requests.FindActive.Route);
  return { message, error };
}

export async function makeRecurringRequest(id: number, accountNumber: string) {
  const { message, error } = await API.Requests.MakeRecurring.post({ id, sendEmail: true });
  mutate([API.Requests.FindActive.Route, accountNumber]);
  mutate(API.Requests.FindActive.Route);
  return { message, error };
}

export async function cancelRequest(id: number, accountNumber: string) {
  const { message, error } = await API.Requests.Cancel.post({ id, sendEmail: true });
  mutate([API.Requests.FindActive.Route, accountNumber]);
  mutate(API.Requests.FindActive.Route);
  return { message, error };
}

function ToDate(input: string) {
  return DateTime.fromFormat(input, 'M-yyyy');
}

export type StatementChartBalances = {
  displayName: string;
  accountNumber: string;
  month: number;
  year: number;
  endBalance: number;
  gainLoss: number;
  netOps: number;
}[]

export type AccumulatedOperations = {
  monthYear: string;
  total: number;
}[]

export function getStatementChartStatements(
  currentAccount: Pick<IUserTrimmed, 'displayName' | 'accountNumber' | 'obMonth' | 'obYear' | 'openingBalance'>,
  statements: IExpandedStatement[],
  operations: IOperation[],
) {
  const balances = statements.map((s) => {
    const {
      month, year, endBalance, gainLoss,
    } = s;
    const {
      displayName, accountNumber,
    } = currentAccount;
    const netOps = operations
      .filter(({ month: m, year: y }) => month === m && year === y)
      .reduce((t, { amount }) => t + amount, 0);
    return {
      displayName,
      accountNumber,
      month,
      year,
      endBalance,
      gainLoss,
      netOps,
    };
  })
    .sort(({ month: mA, year: yA }, { month: mB, year: yB }) => {
      const dateA = ToDate(`${mA}-${yA}`);
      const dateB = ToDate(`${mB}-${yB}`);
      return (dateA > dateB ? -1 : 1);
    });

  const { obMonth, obYear, openingBalance } = currentAccount;

  const operationsAccumulatedByMonth = operations.slice()
    .reduce((totals, op) => {
      const monthTotal = totals.find(({ monthYear: m }) => m === `${op.month}-${op.year}`);
      if (monthTotal) {
        monthTotal.total += op.amount;
        return totals;
      }
      return [...totals, { monthYear: `${op.month}-${op.year}`, total: op.amount }];
    }, [{ monthYear: `${obMonth}-${obYear}`, total: openingBalance }] as { monthYear: string; total: number }[]);

  const accumulatedOperations = balances
    .map(({ month, year }) => {
      const previousMonths = operationsAccumulatedByMonth.filter(({ monthYear }) => ToDate(monthYear).valueOf() <= DateTime.fromObject({ month, year }).valueOf());
      const previousMonthsAccumulated = previousMonths.reduce((t, m) => t + m.total, 0);
      return { monthYear: `${month}-${year}`, total: previousMonthsAccumulated };
    })
    .sort(({ monthYear: mA }, { monthYear: mB }) => {
      const dateA = ToDate(`${mA}`);
      const dateB = ToDate(`${mB}`);
      return (dateA > dateB ? -1 : 1);
    });

  return { balances, accumulatedOperations };
}

export function useApplications(dispatch: Dispatch) {
  const doFetch = async () => {
    const res = await API.Applications.List.get();
    return res;
  };
  const { data, error, isLoading } = useSWR(
    API.Applications.List.Route,
    doFetch,
  );
  handleMessageAndError({ error: error || data?.error }, dispatch);
  return { applications: data?.applications || [], error, loading: isLoading };
}

export function useApplication(dispatch: Dispatch, uuid: string) {
  const doFetch = async () => {
    const res = await API.Applications.View.post({
      uuid,
    });
    return res;
  };
  const { data, error, isLoading } = useSWR(
    (uuid) && API.Applications.View.Route,
    doFetch,
  );
  handleMessageAndError({ error: error || data?.error }, dispatch);
  return { application: data?.application || null, error, loading: isLoading };
}

export async function createApplication(args: Parameters<typeof API.Applications.Create.post>[0], dispatch: Dispatch) {
  const res = await API.Applications.Create.post(args);
  mutate(API.Applications.List.Route);
  handleMessageAndError(res, dispatch);
}

export async function openAccount(args: { uuid: string; month: number; year: number; managerId: number }, dispatch: Dispatch) {
  const res = await API.Applications.OpenAccount.post(args);
  mutate(API.Accounts.Find.Route);
  handleMessageAndError(res, dispatch);
}

export async function newAccount(args: Parameters<typeof API.Users.OpenAccount.post>[0], dispatch: Dispatch) {
  const res = await API.Users.OpenAccount.post(args);
  handleMessageAndError(res, dispatch);
}

export async function deleteApplication(uuid: string, dispatch: Dispatch) {
  const result = await API.Applications.Delete.post({ uuid });
  mutate(API.Applications.List.Route);
  handleMessageAndError(result, dispatch);
  return result;
}

export async function editAccount(id: number, account: Parameters<typeof API.Users.EditAccount.post>[0]['account'], dispatch: Dispatch) {
  if (id && account) {
    const result = await API.Users.EditAccount.post({ id, account });
    handleMessageAndError(result, dispatch);
  }
}

const store = createStore(
  createRootReducer(),
  compose(
    applyMiddleware(
      ...getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
      logger,
    ),
  ),
);

export type StoreDispatch = typeof store;
export default store;
