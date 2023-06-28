import React, {
  createContext, useContext, useEffect,
} from 'react';
import { RequestParams, RequestParamsKeys, RequestParamsQueries } from 'shared/api/admin.api';
import { useImmerReducer } from 'use-immer';
import { useTransferList } from '@admin/admin.store';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  CommitParametersActionName, requestParametersReducer, SetParameterAction, SetParameterActionName,
} from './RequestParameters.Reducer';
import { TransferListRow } from './TransferList.Types';

const RequestQueryContext = createContext<{
  transfers: TransferListRow[],
  requestParameters: RequestParams;
  pendingChanges: boolean;
  setParameter:(key: SetParameterAction['data']['key'], value: SetParameterAction['data']['value']) => void;
  commitParameters: () => void;
  refresh: () => void;
  busy: boolean;
  meta: {
    pageCount: number,
    totalCount: number,
  }
    }>(null);
export function useRequestQueryContext() {
  return useContext(RequestQueryContext);
}

function getRequestParametersFromSearchParams(searchParams: URLSearchParams) {
  const requestParameters: RequestParams = {};
  searchParams.forEach((value, key) => {
    if (!RequestParamsKeys.includes(key as keyof RequestParamsQueries)) return;
    if (key === 'status') {
      requestParameters[key] = [...requestParameters.status ?? [], value];
    } else {
      requestParameters[key] = value;
    }
  });
  return requestParameters;
}

function getSearchParamsFromRequestParameters(requestParameters: RequestParams) {
  const searchParams = new URLSearchParams();
  RequestParamsKeys.forEach((key) => {
    if (!requestParameters[key]) return;
    if (key === 'page' || key === 'limit' || key === 'fmId') {
      searchParams.set(key, `${requestParameters[key]}`);
    } else if (key === 'status') {
      requestParameters[key].forEach((value) => {
        searchParams.append(key, value);
      });
    } else {
      searchParams.set(key, requestParameters[key]);
    }
  });
  return searchParams;
}

export function RequestQueryProvider({ children }) {
  const reduxDispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams(new URLSearchParams());
  const [{ requestParameters, committedRequestParameters, pendingChanges }, dispatch] = useImmerReducer(requestParametersReducer, {
    requestParameters: getRequestParametersFromSearchParams(searchParams),
    committedRequestParameters: getRequestParametersFromSearchParams(searchParams),
    pendingChanges: false,
  });

  useEffect(() => {
    setSearchParams(getSearchParamsFromRequestParameters(committedRequestParameters));
  }, [committedRequestParameters]);

  const commitChanges = () => {
    dispatch({ type: CommitParametersActionName });
  };
  const setParameter = (key: SetParameterAction['data']['key'], value: SetParameterAction['data']['value']) => {
    dispatch({
      type: SetParameterActionName,
      data: { key, value },
    });
  };

  const {
    transfers, refreshTransfers, transfersLoading, pageCount, totalCount,
  } = useTransferList(committedRequestParameters, reduxDispatch);

  const context = {
    transfers,
    requestParameters,
    setParameter,
    pendingChanges,
    refresh: () => refreshTransfers(),
    commitParameters: commitChanges,
    busy: transfersLoading,
    meta: {
      pageCount,
      totalCount,
    },
  };
  return (
    <RequestQueryContext.Provider value={context}>
      {children}
    </RequestQueryContext.Provider>
  );
}
