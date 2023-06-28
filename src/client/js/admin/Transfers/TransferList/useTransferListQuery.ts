import { DocumentStage, OperationType, RequestStatus } from '@interfaces';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RequestParams } from 'shared/api/admin.api';

const undefinedRequestParams: RequestParams = {
  page: undefined,
  limit: undefined,
  search: undefined,
  status: undefined,
  type: undefined,
  stage: undefined,
  withUser: undefined,
  withManager: undefined,
  withDocuments: undefined,
  withBankAccounts: undefined,
  withOperations: undefined,
};

export const getQueryParametersFromRequestParameters = (p: RequestParams) => Object.keys(p).reduce((all, key) => {
  if (p[key] == null || p[key] === 0) return all;
  return {
    ...all,
    [key]: key === 'status' ? p[key] : `${p[key]}`,
  };
}, {} as { [key in keyof RequestParams]: string | string[] });

/**
 * @description Parses the URL query parameters
 */
export default function useTransferListQuery() {
  const [queryParams, setQueryParams] = useSearchParams();
  const [pendingChanges, setPendingChanges] = useState(true);
  const [requestParameters, setUnsavedRequestParameters] = useState<RequestParams>(undefinedRequestParams);

  useEffect(() => {
    const initalRequestParams = Object.keys(requestParameters).reduce((all, key) => {
      let value;
      const valueFromKey = queryParams.get(key);
      switch (key) {
        case 'search':
        case 'type':
        case 'stage':
          value = valueFromKey || undefined;
          break;
        case 'page':
        case 'limit':
          value = +valueFromKey;
          break;
        case 'status':
          value = queryParams.getAll(key).length > 0 ? queryParams.getAll(key) : undefined;
          break;
        default:
          value = valueFromKey != null ? !!valueFromKey : undefined;
      }
      if (value) {
        return {
          ...all,
          [key]: value,
        };
      }
      return all;
    }, {} as RequestParams);
    setUnsavedRequestParameters(initalRequestParams);
  }, [queryParams]);

  const updateQueryParams = (p: RequestParams) => {
    const newQueryParams = getQueryParametersFromRequestParameters(p);
    setQueryParams(newQueryParams);
    setPendingChanges(false);
  };

  const setRequestParameter = (key: keyof RequestParams, value: string | string[] | number | boolean, submit = false) => {
    const newParams = { ...requestParameters };
    if (key === 'status') {
      const { status: statuses } = requestParameters;
      const newStatuses = value as string[];
      // All statuses was selected
      if (newStatuses.includes('') && statuses && !statuses.includes('')) {
        newParams[key] = undefined;
      } else {
        const multiSelectStatuses = [RequestStatus.Approved, RequestStatus.Pending, RequestStatus.Recurring, RequestStatus.Declined];
        const statusesToSet = newStatuses.filter((newStatus) => multiSelectStatuses.includes(newStatus as unknown as RequestStatus));
        if (statusesToSet.length > 0) {
          newParams[key] = statusesToSet;
        }
      }
    } else if (key === 'limit' || key === 'page' || key === 'fmId') {
      newParams[key] = +value;
      if (key === 'limit') newParams.page = 0;
    } else if (key === 'search' || key === 'effectiveMonth') {
      newParams[key] = `${value}`;
    } else if (key === 'stage') {
      newParams[key] = value as DocumentStage;
    } else if (key === 'type') {
      newParams[key] = value as OperationType;
    } else {
      newParams[key] = !!value;
    }
    setUnsavedRequestParameters(newParams);
    setPendingChanges(true);
    if (submit) updateQueryParams(newParams);
  };

  return {
    queryParams, pendingChanges, requestParameters, setRequestParameter, updateQueryParams,
  };
}
