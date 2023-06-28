/* eslint-disable no-param-reassign */
import { DefaultPortfolioStatementsState } from '@store/state';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ManagersSlice } from '@admin/Portfolio/Portfolio.Managers.Slice';
import {
  loadPortfolioAccounts, loadPortfolioStatements, loadPortfolioOperations,
  loadLatestTradeReportDate,
  getMonthROI,
} from '@admin/Portfolio/Portfolio.Thunks';
import { DateTime } from 'luxon';
import { IStatement } from '@interfaces';

export const PortfolioStatementsSlice = createSlice({
  name: 'PortfolioAccounts',
  initialState: DefaultPortfolioStatementsState,
  reducers: {
    setFilteredMonths: (state, { payload }: PayloadAction<number[]>) => {
      state.filteredMonthIds = payload;
    },
    setSelectedAccounts: (state, { payload }: PayloadAction<number[]>) => {
      state.selectedAccounts = payload;
    },
    toggleAccountSelected: (state, { payload }: PayloadAction<number>) => {
      if (state.selectedAccounts.includes(payload)) {
        state.selectedAccounts = state.selectedAccounts.filter((id) => id !== payload);
      } else {
        state.selectedAccounts.push(payload);
      }
    },
    setShowGenDialog: (state, { payload }: PayloadAction<boolean>) => {
      state.showGenDialog = !!payload;
    },
    toggleSendEmails: (state) => {
      state.sendEmails = !state.sendEmails;
      state.ccManager = state.sendEmails;
    },
    setEmailType: (state, { payload }: PayloadAction<'old'|'text'>) => {
      state.emailType = payload;
    },
    toggleCCManager: (state) => {
      state.ccManager = !state.ccManager;
    },
    statementPopulated: (state, { payload }: PayloadAction<IStatement>) => {
      if (payload) {
        const { userId, month, year } = payload;
        const oldStatement = state.statements.find(({ userId: i, month: m, year: y }) => (userId === i && month === m && year === y));
        if (oldStatement) {
          Object.assign(oldStatement, payload);
        } else {
          state.statements.push(payload);
        }
        const date = DateTime.fromObject({ month, year }).valueOf();
        if (!state.filteredMonthIds.includes(date)) { state.filteredMonthIds = [...state.filteredMonthIds, date]; }
        const allOpsWithOldRemoved = state.operations.filter(({ userId: u, month: m, year: y }) => !(userId === u && month === m && year === y));
        state.operations = [...allOpsWithOldRemoved, ...payload?.operations];
      }
    },
    statementPopulationComplete: (state) => {
      state.showGenDialog = false;
      state.loading.statements = false;
    },
    statementPopulationStarted: (state) => {
      state.loading.statements = true;
    },
    statementEmailStarted: (state, { payload }: PayloadAction<{total: number; eachMS: number}>) => {
      state.genEmailsState.countTotal = payload.total;
      state.genEmailsState.countLeft = payload.total;
      state.genEmailsState.timeEach = payload.eachMS;
      state.genEmailsState.timeTotal = (payload?.total || 0) * payload.eachMS;
      state.genEmailsState.timeLeft = (payload?.total || 0) * payload.eachMS;
      state.genEmailsState.inProgress = true;
      state.genEmailsState.showProgress = true;
    },
    statementEmailSent: (state) => {
      state.genEmailsState.countLeft -= 1;
      state.genEmailsState.timeLeft = state.genEmailsState.countLeft * state.genEmailsState.timeEach;
    },
    statementEmailComplete: (state) => {
      state.genEmailsState.inProgress = false;
    },
    statementEmailsHide: (state) => {
      state.genEmailsState.showProgress = false;
      state.genEmailsState = DefaultPortfolioStatementsState.genEmailsState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPortfolioAccounts.pending, (state) => { state.loading.accounts = true; state.inited.accounts = true; })
      .addCase(loadPortfolioStatements.pending, (state) => { state.loading.statements = true; state.inited.statements = true; })
      .addCase(loadPortfolioOperations.pending, (state) => { state.loading.operations = true; state.inited.operations = true; })
      .addCase(getMonthROI.pending, (state) => { state.loading.monthROI = true; state.inited.monthROI = true; })
      .addCase(loadLatestTradeReportDate.pending, (state) => { state.loading.latestTradeMonth = true; state.inited.latestTradeMonth = true; })
      .addCase(loadPortfolioAccounts.rejected, (state) => { state.loading.accounts = false; })
      .addCase(loadPortfolioStatements.rejected, (state) => { state.loading.statements = false; })
      .addCase(getMonthROI.rejected, (state) => { state.loading.monthROI = false; })
      .addCase(loadLatestTradeReportDate.rejected, (state) => { state.loading.latestTradeMonth = false; })
      .addCase(loadPortfolioOperations.rejected, (state) => { state.loading.operations = false; })
      .addCase(loadPortfolioAccounts.fulfilled, (state, { payload }) => {
        if (payload?.accounts) {
          state.accounts = payload.accounts;
          state.selectedAccounts = payload.accounts.map(({ id }) => id);
        }
        state.loading.accounts = false;
      })
      .addCase(loadPortfolioStatements.fulfilled, (state, { payload }) => {
        if (payload?.statements) {
          state.statements = payload.statements;
        }
        state.loading.statements = false;
      })
      .addCase(loadPortfolioOperations.fulfilled, (state, { payload }) => {
        if (payload?.operations) {
          state.operations = payload.operations;
        }
        state.loading.operations = false;
      })
      .addCase(getMonthROI.fulfilled, (state, { payload }) => {
        if (payload?.months) {
          state.monthROI = payload.months;
        }
        state.loading.monthROI = false;
      })
      .addCase(loadLatestTradeReportDate.fulfilled, (state, { payload }) => {
        if (payload?.month && payload?.year) {
          const { month, year } = payload;
          state.latestTradeMonth = ({ month, year });
          state.filteredMonthIds = [DateTime.fromObject({ month, year }).valueOf()];
        }
        state.loading.latestTradeMonth = false;
      })
      // .addCase(generatePortfolioStatements.fulfilled, (state, { payload }) => {
      //   if (payload?.statements) {
      //     payload.statements.forEach((newStatement) => {
      //       const { userId, month, year } = newStatement;
      //       const date = DateTime.fromObject({ month, year }).valueOf();
      //       if (!state.filteredMonthIds.includes(date)) { state.filteredMonthIds = [...state.filteredMonthIds, date]; }
      //       const oldStatement = state.statements.find(({ userId: u, month: m, year: y }) => userId === u && month === m && year === y);
      //       if (oldStatement) { Object.assign(oldStatement, newStatement); } else { state.statements.push(newStatement); }
      //       const allOpsWithOldRemoved = state.operations.filter(({ userId: u, month: m, year: y }) => !(userId === u && month === m && year === y));
      //       state.operations = [...allOpsWithOldRemoved, ...newStatement?.operations];
      //     });
      //   }
      //   state.loading.statements = false;
      //   state.genState = 'done';
      //   state.showGenDialog = false;
      // })
      .addMatcher((action) => action.type === ManagersSlice.actions.setSelectedManagerIds.type, (state, { payload }: PayloadAction<number[]>) => {
        state.selectedAccounts = state.selectedAccounts.filter((userId) => state.accounts.find(({ id, fmId }) => id === userId && payload.includes(fmId)));
      });
  },
});
