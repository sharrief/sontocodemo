/* eslint-disable max-len */
import { Dispatch } from 'redux';
import { API } from '@api';
import useSWR, { mutate } from 'swr';
import {
  ITrade,
  NewTrade,
} from '@interfaces';
import { handleMessageAndError } from './admin.store';

const refreshTradeData = () => {
  mutate(API.Trades.Find.Route);
  mutate(API.Trades.Latest.Route);
  mutate(API.Trades.ROI.Route);
};

export function useUnpublishedTrades(month?: number, year?: number) {
  const {
    data, error, isValidating, mutate: refreshTrades,
  } = useSWR(API.Trades.Find.Route, async () => API.Trades.Find.post({ month, year, unpublished: true }));
  return {
    trades: data?.trades, tradesLoading: (!data && !error) || isValidating, error: error || data?.error, refreshTrades,
  };
}

export function useTradesROI() {
  const { data, error, isValidating } = useSWR(API.Trades.ROI.Route, async () => API.Trades.ROI.get());
  return {
    tradeMonths: data?.months, tradeMonthsLoading: (!data && !error) || isValidating, error: error || data?.error,
  };
}

export function useTradesByMonth(month?: number, year?: number) {
  const { data, error, isValidating } = useSWR([API.Trades.Find.Route, month, year], async () => API.Trades.Find.post({ month, year }));
  return { trades: data?.trades, tradesLoading: (!data && !error) || isValidating, error: error || data?.error };
}

export const SaveNewReportTrade = async (year: number, month: number, day: number, trades: NewTrade[], dispatch: Dispatch) => {
  const { error, trades: t } = await API.Trades.Save.post({
    year, month, day, trades,
  });
  if (error) handleMessageAndError({ error }, dispatch);
  if (!error) {
    mutate(API.Trades.Find.Route, ({ trades: existing }: { trades: ITrade[]}) => ({ error, trades: [...existing.filter((i) => !(i.month === month && i.year === year)), ...t] }), false);
  }
  return !error;
};

export const PublishTradeReport = async (month: number, year: number, dispatch: Dispatch) => {
  const { success, error } = await API.Trades.Publish.post({
    year, month,
  });
  if (error) handleMessageAndError({ error }, dispatch);
  if (success) {
    refreshTradeData();
  }
  return success;
};

export const UnpublishTradeReport = async (month: number, year: number, dispatch: Dispatch) => {
  const { success, error } = await API.Trades.Unpublish.post({
    year, month,
  });
  if (error) handleMessageAndError({ error }, dispatch);
  if (success) {
    refreshTradeData();
  }
  return success;
};

export const DeleteTradeReport = async (month: number, year: number, dispatch: Dispatch) => {
  const { success, error } = await API.Trades.Delete.post({
    year, month,
  });
  if (error) handleMessageAndError({ error }, dispatch);
  if (success) {
    refreshTradeData();
  }
  return success;
};
