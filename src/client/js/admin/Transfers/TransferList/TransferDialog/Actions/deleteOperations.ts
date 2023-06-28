/* eslint-disable no-param-reassign */
import { ActionReducerMapBuilder, createAsyncThunk } from '@reduxjs/toolkit';
import CombinedState from '@client/js/store/state';
import { API } from '@api';
import { PromiseValue } from 'type-fest';
import { State } from '../TransferDialog.State';

export const unPostOperations = createAsyncThunk<PromiseValue<ReturnType<typeof API.Operations.Delete.post>>, never, { state: CombinedState }>('unPostOperations',
  async (_args, thunkAPI) => {
    const { transferDialog: { undoPost: { selectedIds } } } = thunkAPI.getState();
    return API.Operations.Delete.post({ ids: selectedIds });
  });

export const unPostOperationsCaseReducer = (builder: ActionReducerMapBuilder<State>) => builder
  .addCase(unPostOperations.pending, (state) => {
    state.saving.operations = true;
    state.loading.operations = true;
    state.loaded.operations = false;
  })
  .addCase(unPostOperations.fulfilled, (state, { payload }) => {
    const {
      operations: deletedOperations, error, message, requests, documents,
    } = payload;
    const deletedIds = deletedOperations.map(({ id }) => id);
    state.operations = state.operations.filter(({ id }) => !deletedIds.includes(id));
    requests.forEach((request) => {
      let req = state.requests.find(({ id }) => id === request.id);
      if (req) req = request;
    });
    const currentRequest = requests.find(({ id }) => id === state.request.id);
    if (currentRequest) state.request = currentRequest;
    const currentDocument = documents.find(({ id }) => id === state.document.id);
    state.document = currentDocument;
    if (error) { state.errors.push(error); }
    if (message) { state.messages.push(message); }
    state.saving.operations = false;
    state.loading.operations = false;
    state.loaded.operations = true;
    state.prompts.showUndoPost = false;
  })
  .addCase(unPostOperations.rejected, (state) => {
    state.saving.operations = false;
    state.loading.operations = false;
    state.loaded.operations = false;
  });
