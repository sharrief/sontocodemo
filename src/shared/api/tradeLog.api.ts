import { fetchRoute } from '@api';
import { ITradeEntry, ITradeModel, ITradeSymbol } from '@interfaces';

export const TradeLog = {
  GetBooKNames: {
    Route: '/api/tradeLog/bookNames',
    async get() {
      return await fetchRoute(this.Route) as {
        bookNames?: string[];
        error?: string;
      };
    },
  },
  FindBooksByName: {
    Route: '/api/tradeLog/findBooksByName',
    async post(body: {
      bookName: string;
    }) {
      return await fetchRoute(this.Route, body) as {
        bookTrades?: ITradeEntry[];
        error?: string;
      };
    },
  },
  SaveTradeEntry: {
    Route: '/api/tradeLog/logTradeEntry',
    async post(body: {
      tradeEntry: ITradeEntry;
    }) {
      return await fetchRoute(this.Route, body) as {
        tradeEntry?: ITradeEntry;
        error?: string;
      };
    },
  },
  DeleteTradeEntry: {
    Route: '/api/tradeLog/deleteTradeEntry',
    async post(body: {
      id: number;
    }) { return await fetchRoute(this.Route, body) as { error?: string; id?: number }; },
  },
  GetTradeSymbols: {
    Route: '/api/tradeLog/getTradeSymbols',
    async get() {
      return await fetchRoute(this.Route) as {
        tradeSymbols?: ITradeSymbol[];
        error?: string;
      };
    },
  },
  GetTradeModels: {
    Route: '/api/tradeLog/getTradeModels',
    async get() {
      return await fetchRoute(this.Route) as {
        tradeModels?: ITradeModel[];
        error?: string;
      };
    },
  },
};
