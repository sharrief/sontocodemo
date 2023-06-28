/* eslint-disable no-param-reassign */
import { ActionReducerMapBuilder, createAsyncThunk } from '@reduxjs/toolkit';
import CombinedState from '@client/js/store/state';
import { API } from '@api';
import { PromiseValue } from 'type-fest';
import { State } from '../TransferDialog.State';

export const makeRequestRecurring = createAsyncThunk<PromiseValue<ReturnType<typeof API.Requests.MakeRecurring.post>>, Parameters<typeof API.Requests.MakeRecurring.post>[0], { state: CombinedState}>('makeRequestRecurring',
  async (args) => API.Requests.MakeRecurring.post(args));

export const makeRequestRecurringCaseReducer = (builder: ActionReducerMapBuilder<State>) => builder
  .addCase(makeRequestRecurring.pending, (state) => {
    state.saving.request = true;
    state.loading.request = true;
  })
  .addCase(makeRequestRecurring.rejected, (state) => {
    state.saving.request = false;
    state.loading.request = false;
  })
  .addCase(makeRequestRecurring.fulfilled, (state, { payload }) => {
    const { error, request } = payload;
    if (error) state.errors.push(error);
    if (request) {
      state.request = request;
    }
    state.prompts.showMakeRecurringPrompt = false;
    state.saving.request = false;
    state.loading.request = false;
  });
