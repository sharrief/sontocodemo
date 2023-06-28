/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-unused-expressions */
import { Action, createAsyncThunk } from '@reduxjs/toolkit';
import CombinedState from '@client/js/store/state';
import { API } from '@api';
import { PromiseValue } from 'type-fest';
import { AdminThunk } from '@admin/admin.store';

export const cancelRequest = createAsyncThunk<PromiseValue<ReturnType<typeof API.Requests.Cancel.post>>, Parameters<typeof API.Requests.Cancel.post>[0], { state: CombinedState}>('cancelRequest',
  async (args) => API.Requests.Cancel.post(args));

export const saveManualEditToRequest = createAsyncThunk<PromiseValue<ReturnType<typeof API.Requests.Update.post>>, Parameters<typeof API.Requests.Update.post>[0], { state: CombinedState}>('saveManualEditToRequest',
  async (args) => API.Requests.Update.post(args));

export const saveManualEditToDocument = createAsyncThunk<PromiseValue<ReturnType<typeof API.Documents.Update.post>>, Parameters<typeof API.Documents.Update.post>[0], { state: CombinedState}>('saveManualEditToDocument',
  async (args) => API.Documents.Update.post(args));

export const saveManualEdits: AdminThunk<null, Action<never>> = () => (dispatch, getState) => {
  const { request, document, manualEdit } = getState().transferDialog;
  const {
    status, stage, notes, link,
  } = manualEdit;

  if (request && status) {
    const { id } = request;
    dispatch(saveManualEditToRequest({ id, status }));
  }
  if (document?.id && (stage)) {
    const { id } = document;
    dispatch(saveManualEditToDocument({
      id, stage, status: notes, documentLink: link,
    }));
  }
};

export const createDocumentForRequest = createAsyncThunk<PromiseValue<ReturnType<typeof API.Documents.Register.post>>, boolean, {state: CombinedState}>('registerDocumentForRequest',
  async (sendEmail, thunkAPI) => {
    const { transferDialog: { request } } = thunkAPI.getState();
    return API.Documents.Register.post({ requestId: request.id, sendEmail });
  });

export const deleteDocumentForRequest = createAsyncThunk<PromiseValue<ReturnType<typeof API.Documents.Delete.post>>, never, {state: CombinedState}>('unregisterDocument',
  async (_, thunkAPI) => {
    const { transferDialog: { document } } = thunkAPI.getState();
    return API.Documents.Delete.post({ id: document.id });
  });
