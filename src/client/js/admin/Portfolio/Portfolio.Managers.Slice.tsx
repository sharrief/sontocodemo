/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
import { DefaultManagersState } from '@store/state';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadManagers } from '@admin/Portfolio/Portfolio.Thunks';

export const ManagersSlice = createSlice({
  name: 'Managers',
  initialState: DefaultManagersState,
  reducers: {
    setSelectedManagerIds: (state, { payload }: PayloadAction<number[]>) => {
      state.selectedManagerIds = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadManagers.pending, (state) => {
        state.inited = true;
      })
      .addCase(loadManagers.fulfilled, (state, { payload }) => {
        state.managers = payload.managers;
        state.selectedManagerIds = state.managers.map(({ id }) => id);
      });
  },
});
