/* eslint-disable no-param-reassign */
import { DocumentStage, OperationType, RequestStatus } from '@interfaces';
import { RequestParams } from 'shared/api/admin.api';

export type SetParameterAction = {
  type: 'ACTION.SetParameter',
  data: { key: keyof RequestParams, value: string | string[] | number | boolean }
}
export const SetParameterActionName: SetParameterAction['type'] = 'ACTION.SetParameter';

type CommitParameters = {
  type: 'ACTION.CommitParameters',
}
export const CommitParametersActionName: CommitParameters['type'] = 'ACTION.CommitParameters';

export function requestParametersReducer(
  state: {
    requestParameters: RequestParams,
    committedRequestParameters: RequestParams,
    pendingChanges: boolean,
  },
  action: SetParameterAction|CommitParameters,
) {
  switch (action.type) {
    case SetParameterActionName: {
      const { key, value } = action.data;
      const { requestParameters } = state;
      if (key === 'status') {
        const { status: statuses } = requestParameters;
        const newStatuses = value as string[];
        // All statuses was selected
        if (newStatuses.includes('') && statuses && !statuses.includes('')) {
          requestParameters[key] = undefined;
        } else {
          const multiSelectStatuses = [RequestStatus.Approved, RequestStatus.Pending, RequestStatus.Recurring, RequestStatus.Declined];
          const statusesToSet = newStatuses.filter((newStatus) => multiSelectStatuses.includes(newStatus as unknown as RequestStatus));
          if (statusesToSet.length > 0) {
            requestParameters[key] = statusesToSet;
          }
        }
      } else if (key === 'limit' || key === 'page' || key === 'fmId') {
        requestParameters[key] = +value;
        if (key === 'limit') requestParameters.page = 0;
      } else if (key === 'search' || key === 'effectiveMonth') {
        requestParameters[key] = `${value}`;
      } else if (key === 'stage') {
        requestParameters[key] = value as DocumentStage;
      } else if (key === 'type') {
        requestParameters[key] = value as OperationType;
      } else {
        requestParameters[key] = !!value;
      }
      state.pendingChanges = true;
      break;
    }
    case CommitParametersActionName: {
      state.committedRequestParameters = state.requestParameters;
      state.pendingChanges = false;
      break;
    }
    default: { break; }
  }
  return state;
}
