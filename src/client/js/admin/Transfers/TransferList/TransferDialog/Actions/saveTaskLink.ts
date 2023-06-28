/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-unused-expressions */
import { ActionReducerMapBuilder, createAsyncThunk } from '@reduxjs/toolkit';
import CombinedState from '@client/js/store/state';
import { API } from '@api';
import { PromiseValue } from 'type-fest';
import { State } from '../TransferDialog.State';

export const saveTaskLink = createAsyncThunk<PromiseValue<ReturnType<typeof API.Documents.SetLink.post>>, null, { state: CombinedState }>('saveTaskLink',
  async (_, thunkAPI) => {
    const { id } = thunkAPI.getState().transferDialog.document;
    const { newValue: link } = thunkAPI.getState().transferDialog.taskDialog;
    return API.Documents.SetLink.post({
      id, link,
    });
  });

export const saveTaskLinkCaseReducer = (builder: ActionReducerMapBuilder<State>) => builder.addCase(saveTaskLink.pending, (state) => {
  state.saving.document = true;
})
  .addCase(saveTaskLink.rejected, (state) => {
    state.saving.document = false;
  })
  .addCase(saveTaskLink.fulfilled, (state, { payload }) => {
    state.saving.document = false;
    state.prompts.showTaskDialog = false;
    state.document = payload?.document;
  });
