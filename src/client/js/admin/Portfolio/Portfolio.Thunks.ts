/* eslint-disable no-param-reassign */
import { DateTime } from 'luxon';
import CombinedState from '@store/state';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PromiseValue } from 'type-fest';
import { API } from '@api';
import { AdminThunk } from '@admin/admin.store';

export const loadManagers = createAsyncThunk<PromiseValue<ReturnType<typeof API.Managers.All.get>>, void, {state: CombinedState}>('loadManagers', () => API.Managers.All.get());

export const loadPortfolioAccounts = createAsyncThunk<PromiseValue<ReturnType<typeof API.Accounts.Find.get>>, void, { state: CombinedState }>('loadPortfolioAccounts',
  () => API.Accounts.Find.get());

export const loadLatestTradeReportDate = createAsyncThunk<PromiseValue<ReturnType<typeof API.Trades.Latest.get>>, void, { state: CombinedState }>('loadLatestTradeReportDate',
  () => API.Trades.Latest.get());

export const loadPortfolioStatements = createAsyncThunk<PromiseValue<ReturnType<typeof API.Statements.All.post>>, void, { state: CombinedState }>('loadPortfolioStatements',
  (_undefined, thunkAPI) => {
    const { getState } = thunkAPI;
    const { filteredMonthIds, selectedAccounts } = getState().portfolioStatementsState;
    const { monthAndYears } = filteredMonthIds.reduce(({ monthAndYears: m }, id) => {
      const { year, month } = DateTime.fromMillis(id);
      return ({ monthAndYears: [...m, { year, month }] });
    }, { monthAndYears: [] } as {monthAndYears: {year: number; month: number}[]});
    return API.Statements.All.post({ userIds: selectedAccounts, monthAndYears });
  });

export const loadPortfolioOperations = createAsyncThunk<PromiseValue<ReturnType<typeof API.Operations.All.post>>, void, { state: CombinedState }>('loadPortfolioOperations',
  (_undefined, thunkAPI) => {
    const { getState } = thunkAPI;
    const { filteredMonthIds } = getState().portfolioStatementsState;
    const { monthAndYears } = filteredMonthIds.reduce(({ monthAndYears: m }, monthId) => {
      const { month, year } = DateTime.fromMillis(monthId);
      return ({ monthAndYears: [...m, { month, year }] });
    }, { monthAndYears: [] } as { monthAndYears: {month: number; year: number}[]});
    return API.Operations.All.post({ monthAndYears });
  });

export const loadPortfolioSummaryData = createAsyncThunk<{
  response: PromiseValue<ReturnType<typeof API.Managers.KPI.get>>;
}, null, {state: CombinedState}>('initPortfolio',
  async () => {
    const response = await API.Managers.KPI.get();
    return { response };
  });

export const getMonthROI = createAsyncThunk<PromiseValue<ReturnType<typeof API.Trades.ROI.get>>, void, { state: CombinedState }>('loadMonthlyROI',
  () => API.Trades.ROI.get());

export const initPortfolioAnalytics: AdminThunk<void> = () => async (dispatch, getState) => {
  const { inited, loading } = getState().portfolioSummaryState;
  const { latestTradeMonth } = getState().portfolioStatementsState.inited;
  if (!inited && !loading) {
    dispatch(loadPortfolioSummaryData());
  }
  if (!latestTradeMonth) {
    dispatch(loadLatestTradeReportDate());
  }
};

export const initPortfolioStatements: AdminThunk<void> = () => async (dispatch, getState) => {
  const {
    accounts: initedAccounts, statements, operations,
  } = getState().portfolioStatementsState.inited;
  if (!initedAccounts) {
    await Promise.all([
      dispatch(loadPortfolioAccounts()),
      dispatch(loadLatestTradeReportDate()),
    ]);
    if (!statements) dispatch(loadPortfolioStatements());
    if (!operations) dispatch(loadPortfolioOperations());
  }
};
