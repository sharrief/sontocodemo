import React, { useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  CombinedState,
} from '@store/state';
import Table from '@client/js/components/Table';
import { createSelector } from 'reselect';
import { Activity } from '@client/js/labels';
import { useLocation, useNavigate } from 'react-router-dom';
import GetColumns from './TransferList.Columns';
import '@client/css/Admin.css';
import TransferListTableExport from './TransferList.Table.Export';
import { useRequestQueryContext } from './RequestParameters.Provider';

const selectTransferListState = createSelector([
  (state: CombinedState) => state.transferList.pageIndex,
  (state: CombinedState) => state.transferList.pageSize,
  (state: CombinedState) => state.transferList.requestParams,
  (state: CombinedState) => state.global.theme,
  (state: CombinedState) => state.transferList.dirtyFilter,
], (currentPageIndex, currentPageSize, requestParams, theme, dirtyFilter) => ({
  currentPageIndex, currentPageSize, requestParams, theme, dirtyFilter,
}));

const columns = GetColumns();

const cardHeaderColumns = ['status', 'id', 'amount', 'document'];

export const TransferListTable = React.memo(function TransferListTable() {
  const {
    theme,
  } = useSelector(selectTransferListState);
  const location = useLocation();
  const {
    transfers,
    requestParameters,
    setParameter,
    commitParameters: commit,
    busy: loading,
    meta: {
      pageCount: currentPageCount,
      totalCount,
    },
  } = useRequestQueryContext();
  const { page: currentPageIndex } = requestParameters;
  const currentPageSize = requestParameters.limit || transfers.length;
  const navigate = useNavigate();
  const data = transfers;
  const onPageIndexChange = (newPageIndex: number) => {
    if (newPageIndex >= 0 || newPageIndex < currentPageCount) {
      setParameter('page', newPageIndex);
      commit();
    }
  };
  const onPageSizeChange = (newPageSize: number) => {
    setParameter('limit', newPageSize);
    commit();
  };
  const rowClickHandler = (index: number) => {
    if (data?.length) {
      const { id } = data?.[index];
      navigate(`${location.pathname}/${id}`);
    }
  };
  const [showingExportDialog, showExportDialog] = useState(false);
  const exportDone = () => showExportDialog(false);
  const exportHandler = () => {
    showExportDialog(true);
  };

  return <>
    <Table
      {...{
        id: 'transfersList',
        manualPagination: true,
        itemLabelPlural: Activity.TransferRequests,
        data,
        columns: React.useMemo(() => columns, [columns]),
        cardHeaderColumns,
        cardLabels: true,
        cardLabelSpacing: 'close',
        totalCount,
        currentPageCount,
        currentPageSize,
        currentPageIndex,
        initialPageSize: currentPageSize,
        initialPageIndex: currentPageIndex,
        onPageIndexChange,
        onPageSizeChange,
        loading,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        exportHandler,
        rowClickHandler,
        theme,
      }}
    />
    <TransferListTableExport
      done={exportDone}
      show={showingExportDialog}
    />
  </>;
});
