import { API } from '@api';
import { RequestParams } from 'shared/api/admin.api';
import { mutate } from 'swr';
import { handleMessageAndError } from '@admin/admin.store';
import { Dispatch } from 'redux';
import { mapOperationRequestToTableRow } from './TransferList.Helpers';

export default async function FetchTransfers(requestParameters: RequestParams, dispatch?: Dispatch) {
  try {
    const res = await API.Admin.Requests.get(requestParameters);
    const { requests, error } = res;
    if (error) throw new Error(error);
    const userIds = [];
    const requestIds = [];
    requests.forEach((request) => {
      const { id, userId } = request;
      userIds.push(userId); requestIds.push(id);
      mutate([API.Requests.FindById.Route, id], { request }, false);
    });

    const { managers, error: managersError } = await API.Managers.All.get();
    if (managersError) throw new Error(managersError);
    mutate(API.Managers.All.Route, { managers }, false);

    const { accounts, error: accountsError } = await API.Accounts.FindByIds.post({ ids: userIds });
    if (accountsError) throw new Error(accountsError);
    accounts.forEach((account) => {
      mutate([API.Accounts.FindByAccountNumber.Route, account.accountNumber], { account: accounts?.find(({ accountNumber }) => account?.accountNumber === accountNumber) }, false);
      mutate([API.Managers.FindByAccountNumber.Route, account.accountNumber], { manager: managers?.find(({ id }) => account?.fmId === id) }, false);
      mutate([API.Accounts.FindById.Route, account.id], { account: accounts?.find(({ id }) => id === account?.id) }, false);
    });

    const { documents, error: documentsError } = await API.Documents.FindByRequestIds.post({ ids: requestIds });
    if (documentsError) throw new Error(documentsError);
    const { operations, error: operationsError } = await API.Operations.FindByRequestIds.post({ ids: requestIds });
    if (operationsError) throw new Error(operationsError);

    const transfers = requests
      .map((request) => {
        mutate([API.Operations.FindByRequestId.Route, request.id], { operations: operations?.filter(({ requestId }) => request.id === requestId) }, false);
        mutate([API.Documents.FindByRequestId.Route, request.id], { document: documents?.find(({ operationId }) => request.id === operationId) }, false);

        const { userId } = request;
        const account = accounts?.find(({ id }) => id === userId);
        const manager = managers?.find(({ id }) => account?.fmId === id);
        const document = documents?.find(({ operationId }) => operationId === request.id);
        const requestOperations = operations?.filter(({ requestId: reqId }) => reqId === request.id);
        return mapOperationRequestToTableRow({
          request, account, manager, document, operations: requestOperations, bankAccounts: request?.user?.bankAccounts,
        }, requestParameters);
      });
    return { ...res, transfers };
  } catch (e) {
    const err = `The website ran into an issue while loading transfer list: ${e?.message}`;
    if (dispatch) handleMessageAndError({ error: err }, dispatch);
    return { error: err, transfers: undefined };
  }
}
