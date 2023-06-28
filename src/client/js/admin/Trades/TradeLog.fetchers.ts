import useSWR from 'swr';
import { API } from '@api';

export const useTradeLogBook = (bookName: string) => {
  const {
    data, error, isValidating, mutate,
  } = useSWR(bookName && [API.TradeLog.FindBooksByName.Route, bookName],
    async ([_r, n]) => API.TradeLog.FindBooksByName.post({ bookName: n }));
  return {
    bookTrades: data?.bookTrades || [], error: error || data?.error, booksLoading: (!data && !error) || isValidating, mutate,
  };
};

export const useTradeLogBookNames = () => {
  const { data, error, isValidating } = useSWR(API.TradeLog.GetBooKNames.Route,
    async () => API.TradeLog.GetBooKNames.get());
  return { bookNames: data?.bookNames || [], error: error || data?.error, bookNamesLoading: (!data && !error) || isValidating };
};

export const useTradeSymbols = () => {
  const { data, error, isValidating } = useSWR(API.TradeLog.GetTradeSymbols.Route,
    async () => API.TradeLog.GetTradeSymbols.get());
  return { tradeSymbols: data?.tradeSymbols || [], error: error || data?.error, tradeSymbolsLoading: (!data && !error) || isValidating };
};

export const useTradeModels = () => {
  const { data, error, isValidating } = useSWR(API.TradeLog.GetTradeModels.Route,
    async () => API.TradeLog.GetTradeModels.get());
  return { tradeModels: data?.tradeModels || [], error: error || data?.error, tradeModelsLoading: (!data && !error) || isValidating };
};
