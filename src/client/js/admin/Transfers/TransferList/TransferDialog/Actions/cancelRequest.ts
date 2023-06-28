/* eslint-disable no-param-reassign */
import { ActionReducerMapBuilder, createAsyncThunk } from '@reduxjs/toolkit';
import CombinedState from '@client/js/store/state';
import { API } from '@api';
import { PromiseValue } from 'type-fest';
import { State } from '../TransferDialog.State';

export const cancelRequest = createAsyncThunk<PromiseValue<ReturnType<typeof API.Requests.Cancel.post>>, Parameters<typeof API.Requests.Cancel.post>[0], { state: CombinedState}>('cancelRequest',
  async (args) => API.Requests.Cancel.post(args));

export const cancelRequestCaseReducer = (builder: ActionReducerMapBuilder<State>) => builder
  .addCase(cancelRequest.pending, (state) => {
    state.saving.request = true;
    state.loading.request = true;
  })
  .addCase(cancelRequest.rejected, (state) => {
    state.saving.request = false;
    state.loading.request = false;
  })
  .addCase(cancelRequest.fulfilled, (state, { payload }) => {
    const {
      error, request, document, message,
    } = payload;
    if (error) state.errors.push(error);
    if (request) {
      state.request = request;
    }
    if (document) {
      state.document = document;
    }
    if (message) {
      state.messages.push(message);
    }
    state.prompts.showCancelPrompt = false;
    state.saving.request = false;
    state.loading.request = false;
  });
