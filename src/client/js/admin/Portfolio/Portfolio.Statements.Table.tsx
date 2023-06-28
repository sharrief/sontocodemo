/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateTime } from 'luxon';
import CombinedState from '@store/state';
import { currency, percent } from '@helpers';
import Table from '@client/js/components/Table';
import { createSelector } from 'reselect';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { IStatement } from '@interfaces';
import MultiSelector from '@client/js/components/MultiSelector';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import { getMonthROI, loadPortfolioOperations, loadPortfolioStatements } from '@admin/Portfolio/Portfolio.Thunks';
import { PortfolioStatementsSlice } from '@admin/Portfolio/Portfolio.Accounts.Slice';
import { AdminThunk, useAccounts } from '@admin/admin.store';
import { chain } from '@numbers';
import { Portfolio as labels } from '@client/js/labels';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { DashboardTabs } from '@client/js/dashboard/Dashboard';
import FileSaver from 'file-saver';
import { endpoints } from '@api';
import { useNavigate } from 'react-router-dom';

const exportStatements = createAsyncThunk<void, void, {state: CombinedState}>('exportAccountStatements',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_arg, thunkAPI) => {
    const {
      portfolioStatementsState: {
        statements, accounts, operations, selectedAccounts, filteredMonthIds,
      },
    } = thunkAPI.getState();
    const rows: string[] = statements
      .filter(({ userId, month, year }) => selectedAccounts.includes(userId) && filteredMonthIds.includes(DateTime.fromObject({ month, year }).valueOf()))
      .map((statement) => {
        const {
          endBalance, month, year, gainLoss, userId, previousStatement,
        } = statement;
        const account = accounts?.find(({ id }) => userId === id);
        const {
          displayName, accountNumber, openingBalance,
        } = account || {
          displayName: 'NULL', accountNumber: 'NULL', obMonth: null, obYear: null, openingBalance: null,
        };
        const netOperations = operations
          ?.filter(({ month: m, year: y, userId: id }) => m === month && y === year && id === userId)
          ?.reduce((total, op) => total + op.amount, 0) || 0;
        const startBalanceAmount = previousStatement?.endBalance || openingBalance;

        return `${accountNumber ?? ''}, ${displayName.replace(',', '') ?? ''}, ${month}, ${year}, ${startBalanceAmount || 0}, ${gainLoss || 0}, ${netOperations || 0}, ${endBalance || 0}\n`;
      });
    const file = new Blob(['Account number, Account, Month, Year, Start, Net gain/loss, Net transactions, End\n', ...rows], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(file, `statements exported ${DateTime.now().toFormat('DD')}.csv`);
  });

const filterStatements: AdminThunk<number[]> = (monthIds) => (dispatch) => {
  dispatch(PortfolioStatementsSlice.actions.setFilteredMonths(monthIds));
  dispatch(loadPortfolioStatements());
  dispatch(loadPortfolioOperations());
};

const selectPortfolioAccountsState = createSelector([
  (state: CombinedState) => state.portfolioStatementsState.accounts,
  (state: CombinedState) => state.portfolioStatementsState.statements,
  (state: CombinedState) => state.portfolioStatementsState.operations,
  (state: CombinedState) => state.portfolioStatementsState.selectedAccounts,
  (state: CombinedState) => state.managersState.selectedManagerIds,
  (state: CombinedState) => {
    const {
      accounts, statements, monthROI, latestTradeMonth, operations,
    } = state.portfolioStatementsState.loading;
    return accounts || statements || monthROI || latestTradeMonth || operations;
  },
  (state: CombinedState) => state.global.theme,
], (accounts, statements, operations, selectedAccounts, selectedManagerIds, loading, theme) => ({
  accounts, statements, operations, selectedAccounts, selectedManagerIds, loading, theme,
}));

type StatementRow = (Pick<IStatement, 'userId'|'month'|'year'> & { displayName: string; endBalance: string; startBalance: string; gainLoss: string; netOperations: string; accountNumber: string });

function portfolioStatementsTable() {
  const {
    statements,
    operations,
    selectedAccounts,
    selectedManagerIds,
    loading,
    theme,
  } = useSelector(selectPortfolioAccountsState);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  let tableData: StatementRow[] = [];
  const { accounts } = useAccounts();

  if (statements.length && accounts?.length) {
    const statementsSortedByBalance = statements.slice()
      .filter(({ userId }) => {
        const accountsFilteredByManager = accounts?.filter(({ fmId }) => (selectedManagerIds.length === 0 || selectedManagerIds.includes(fmId)));
        const accountsFilteredByUser = accountsFilteredByManager.filter(({ id }) => (selectedAccounts.includes(id)));
        return accountsFilteredByUser?.find(({ id }) => id === userId);
      })
      .sort(({ month: ma, year: ya, endBalance: a }, { month: mb, year: yb, endBalance: b }) => {
        if (DateTime.fromObject({ month: ma, year: ya }) < DateTime.fromObject({ month: mb, year: yb })) {
          return 1;
        }
        if (DateTime.fromObject({ month: ma, year: ya }) > DateTime.fromObject({ month: mb, year: yb })) {
          return -1;
        }
        return (a < b ? 1 : -1);
      });

    tableData = statementsSortedByBalance
      .map(({
        endBalance, month, year, gainLoss, userId, previousStatement, created,
      }) => {
        const account = accounts?.find(({ id }) => userId === id);
        const {
          displayName, accountNumber,
        } = account || {
          displayName: 'NULL', accountNumber: 'NULL', obMonth: null, obYear: null,
        };
        const netOperations = operations
          ?.filter(({ month: m, year: y, userId: id }) => m === month && y === year && id === userId)
          ?.reduce((total, op) => total + op.amount, 0) || 0;
        const startBalanceAmount = previousStatement?.endBalance || 0;
        const error = chain(endBalance)
          .subtract(netOperations)
          .subtract(gainLoss)
          .subtract(startBalanceAmount)
          .done();
        const errorOverlay = <OverlayTrigger
        overlay={<Tooltip id={`errorTooltip-${accountNumber}-${year}-${month}`}>This balance is off by {currency(error)}. You can update the statement to remove this rounding error.</Tooltip>}
        >
          <span className='text-danger'><ErrorOutline /></span>
        </OverlayTrigger>;
        const endBalanceWithError = <div className='d-flex align-items-center'>{currency(endBalance)} {Math.abs(error) >= 0.01 && errorOverlay}</div>;
        return ({
          userId,
          startBalance: currency(startBalanceAmount),
          accountNumber,
          displayName: `${displayName} | ${accountNumber}`,
          endBalance: currency(endBalance),
          endBalanceWithError,
          month,
          year,
          monthName: DateTime.fromFormat(`${year}-${month}`, 'yyyy-M').toFormat('MMM yyyy'),
          gainLoss: `${currency(gainLoss)} (${percent(chain(gainLoss).divide(startBalanceAmount).done() || 0)})`,
          netOperations: currency(netOperations),
          created: DateTime.fromMillis(created).toLocaleString(DateTime.DATETIME_MED),
        });
      });
  }
  const tableColumns = [
    {
      Header: '',
      accessor: 'userId',
      disableFilters: true,
    }, {
      Header: '',
      accessor: 'month',
      disableFilters: true,
    }, {
      Header: '',
      accessor: 'year',
      disableFilters: true,
    }, {
      Header: labels.StatementsTableHeaders.Account,
      accessor: 'displayName',
      disableFilters: true,
    }, {
      Header: labels.StatementsTableHeaders.Month,
      accessor: 'monthName',
      disableFilters: true,
    }, {
      Header: labels.StatementsTableHeaders.StartBalance,
      accessor: 'startBalance',
      disableFilters: true,
    }, {
      Header: labels.StatementsTableHeaders.NetGainLoss,
      accessor: 'gainLoss',
      disableFilters: true,
    }, {
      Header: labels.StatementsTableHeaders.NetTransactions,
      accessor: 'netOperations',
      disableFilters: true,
    }, {
      Header: labels.StatementsTableHeaders.EndBalance,
      accessor: 'endBalanceWithError',
      disableFilters: true,
    }, {
      Header: labels.StatementsTableHeaders.Generated,
      accessor: 'created',
      disableFilters: true,
    },
  ];

  const navigateToAccountStatements = (index: number) => {
    const statementUserId = tableData?.[index]?.userId;
    const account = accounts.find(({ id }) => id === statementUserId);
    navigate(`${endpoints.dashboard}/${account.accountNumber}/${DashboardTabs.statements}`);
  };

  return <Table
    id='portfolioStatements'
    rowClickHandler={navigateToAccountStatements}
    manualPagination={false}
    disableSearch={true}
    cardHeaderColumns={['displayName']}
    hiddenColumnAccessors={['userId', 'month', 'year']}
    cardLabels={true}
    loading={loading}
    data={tableData}
    columns={React.useMemo(() => tableColumns, [tableColumns])}
    itemLabelPlural={labels.Statements}
    exportHandler={() => dispatch(exportStatements())}
    theme={theme}
  />;
}

const selectFilteredMonths = createSelector([
  (state: CombinedState) => state.portfolioStatementsState.filteredMonthIds,
  (state: CombinedState) => state.portfolioStatementsState.monthROI,
  (state: CombinedState) => state.portfolioStatementsState.inited.monthROI,
  (state: CombinedState) => state.portfolioStatementsState.loading.monthROI,
  (state: CombinedState) => state.portfolioStatementsState.latestTradeMonth,
],
(filteredMonthIds, ROI, inited, loading, latestTradeMonth) => ({ filteredMonthIds, monthROI: { ROI, inited, loading }, latestTradeMonth }));

function portfolioStatementMonthFilter({ asDialog }: {asDialog?: boolean}) {
  const { filteredMonthIds, monthROI, latestTradeMonth } = useSelector(selectFilteredMonths);
  const dispatch = useDispatch();
  const applyFilter = (monthIds: number[]) => monthIds?.length && dispatch(filterStatements(monthIds));
  const { ROI, inited, loading } = monthROI;
  useEffect(() => {
    if (!inited) dispatch(getMonthROI());
  }, [loading]);

  const monthFilters = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((monthsBack) => {
    const date = DateTime.fromObject(latestTradeMonth).startOf('month').minus({ month: monthsBack });
    const percentROI = `(${percent(ROI.find(({ month, year }) => month === date.month && year === date.year)?.interest / 100)})`;
    const label = `${date.toFormat('MMMM yyyy')} ${!loading ? percentROI : ''}`;
    const id = date.valueOf();
    return ({ label, id });
  });

  return <MultiSelector
    asDialog={asDialog ?? true}
    options={monthFilters}
    selectedIds={filteredMonthIds}
    setSelectedIds={applyFilter}
    pluralLabel={labels.StatementMonths}
    hideFilter
  />;
}

export const PortfolioStatementsFilter = React.memo(portfolioStatementMonthFilter);
export const PortfolioStatementsTable = React.memo(portfolioStatementsTable);
