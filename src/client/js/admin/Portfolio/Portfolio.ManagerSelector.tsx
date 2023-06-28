/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CombinedState from '@store/state';
import { createSelector } from 'reselect';
import MultiSelector from '@components/MultiSelector';
import { ManagersSlice } from '@admin/Portfolio/Portfolio.Managers.Slice';
import { Portfolio as labels } from '@labels';
import { RoleId, RoleName } from '@interfaces';
import { loadManagers } from '@admin/Portfolio/Portfolio.Thunks';
import { getUserInfo } from '../admin.store';

const selectPortfolioState = createSelector([
  (state: CombinedState) => state.managersState.inited,
  (state: CombinedState) => state.managersState.loading,
  (state: CombinedState) => state.managersState.selectedManagerIds,
  (state: CombinedState) => state.managersState.managers,
], (inited, loading, selectedManagerIds, managers) => ({
  inited, loading, selectedManagerIds, managers,
}));

function portfolio({ asDialog }: { asDialog?: boolean }) {
  const {
    inited, loading,
    selectedManagerIds,
    managers,
  } = useSelector(selectPortfolioState);
  const dispatch = useDispatch();
  const { userinfo } = getUserInfo();
  const { role } = userinfo || { role: null };
  useEffect(() => {
    if (!inited && !loading) {
      dispatch(loadManagers());
    }
  });

  const setSelectedIds = (ids: number[]) => dispatch(ManagersSlice.actions.setSelectedManagerIds(ids));
  if (![RoleName.admin, RoleName.director].includes(role)) return null;
  return (
    <MultiSelector
      options={managers.filter(({ roleId }) => roleId !== RoleId.admin).map(({ id, displayName }) => ({ id, label: displayName }))}
      selectedIds={selectedManagerIds}
      setSelectedIds={setSelectedIds}
      pluralLabel={labels.Managers}
      asDialog={asDialog ?? true}
    />
  );
}

export default React.memo(portfolio);
