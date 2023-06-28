/* eslint-disable no-param-reassign */
import { DefaultPortfolioAnalyticsState, PortfolioAnalyticsState } from '@store/state';
import { loadPortfolioSummaryData } from '@admin/Portfolio/Portfolio.Thunks';
import {
  createSlice, PayloadAction,
} from '@reduxjs/toolkit';

export default createSlice({
  name: 'PortfolioAnalytics',
  initialState: DefaultPortfolioAnalyticsState,
  reducers: {
    setFeeRate: (state, { payload }: PayloadAction<PortfolioAnalyticsState['feeRate']>) => {
      state.feeRate = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadPortfolioSummaryData.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadPortfolioSummaryData.rejected, (state) => {
      state.loading = false;
      state.inited = true;
    });
    builder.addCase(loadPortfolioSummaryData.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.inited = true;
      const response = payload?.response;
      if (!response?.error && response?.portfolioBalances) {
        ({ portfolioBalances: state.totalsByMonth } = response);
      }
    });
  },
});
