import { API } from '@api';
import {
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { CombinedState } from '@store/state';
import { data as Data, global } from '@store/reducers';

export const cancelRequest = createAsyncThunk<void, number, { state: CombinedState }>('cancelRequest',
  async (id, thunkAPI) => {
    const { dispatch } = thunkAPI;
    const { error, request } = await API.Requests.Cancel.post({ id, sendEmail: true });
    if (!error) { dispatch(Data.actions.cancelledOperationRequest(request.id)); }
    if (error) { dispatch(global.actions.error(error)); }
  });
