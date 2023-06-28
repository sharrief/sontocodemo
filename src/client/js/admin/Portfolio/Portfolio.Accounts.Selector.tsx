/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CombinedState from '@store/state';
import { Portfolio as labels } from '@client/js/labels';
import { createSelector } from 'reselect';
import MultiSelector from '@client/js/components/MultiSelector';
import { Alert, Spinner } from 'react-bootstrap';
import { PortfolioStatementsSlice } from './Portfolio.Accounts.Slice';
import { AdminThunk } from '../admin.store';
import {
  loadPortfolioStatements, loadPortfolioOperations, loadPortfolioAccounts, loadManagers,
} from './Portfolio.Thunks';

const { actions } = PortfolioStatementsSlice;

const selectPortfolioAccountsState = createSelector([
  (state: CombinedState) => state.portfolioStatementsState.accounts,
  (state: CombinedState) => state.portfolioStatementsState.inited.accounts,
  (state: CombinedState) => state.portfolioStatementsState.loading.accounts,
  (state: CombinedState) => state.managersState,
  (state: CombinedState) => state.portfolioStatementsState.selectedAccounts,
  (state: CombinedState) => state.managersState.selectedManagerIds,
], (accounts, inited, loading, managersState, selectedAccounts, selectedManagerIds) => ({
  accounts, inited, loading, managersState, selectedAccounts, selectedManagerIds,
}));

const filterAccounts: AdminThunk<number[]> = (accountIds) => (dispatch) => {
  dispatch(actions.setSelectedAccounts(accountIds));
  dispatch(loadPortfolioStatements());
  dispatch(loadPortfolioOperations());
};

function PortfolioAccounts({ asDialog }: {asDialog?: boolean}) {
  const {
    accounts,
    loading,
    inited,
    selectedAccounts,
    selectedManagerIds,
    managersState,
  } = useSelector(selectPortfolioAccountsState);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!inited && !loading) {
      dispatch(loadPortfolioAccounts());
    }
    if (!managersState.inited && !managersState.loading) {
      dispatch(loadManagers());
    }
  });

  const setSelectedIds = (ids: number[]) => dispatch(filterAccounts(ids));
  if (loading) { return <Alert variant='secondary'>Loading <Spinner animation='grow' size='sm'/></Alert>; }
  return accounts
    ? <MultiSelector
      asDialog={asDialog ?? true}
      options={accounts
        .filter(({ fmId }) => selectedManagerIds.includes(fmId))
        .map(({ id, displayName }) => ({ id, label: displayName }))}
      selectedIds={selectedAccounts}
      setSelectedIds={setSelectedIds}
      pluralLabel={labels.Accounts}
    /> : null;
}

export default React.memo(PortfolioAccounts);
