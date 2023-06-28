import { fetchRoute } from '@api';
import { ITrade, NewTrade } from '@interfaces';

export const Trades = {
  Find: {
    Route: '/api/findTrades',
    async post(body: {
      year: ITrade['year'];
      month: ITrade['month'];
      unpublished?: boolean;
      }) {
      return await fetchRoute(this.Route, body) as {
        trades?: ITrade[];
        error?: string;
      };
    },
  },

  Latest: {
    Route: '/api/findLatestTrades',
    async get() { return await fetchRoute(this.Route) as { month: number; year: number; error: string }; },
  },

  ROI: {
    Route: '/api/findTradeROIByMonth',
    async get() { return await fetchRoute(this.Route) as { months: { month: number; year: number; interest: number }[]; error: string }; },
  },
  Save: {
    Route: '/api/saveTrades',
    async post(body: {
      day: ITrade['day'];
      month: ITrade['month'];
      year: ITrade['year'];
      trades: NewTrade[];
    }) {
      return await fetchRoute(this.Route, body) as { trades?: ITrade[]; error?: string };
    },
  },
  Publish: {
    Route: '/api/publishTradeReport',
    async post(body: {
      month: ITrade['month'];
      year: ITrade['year'];
    }) {
      return await fetchRoute(this.Route, body) as { success?: boolean; error?: string };
    },
  },
  Unpublish: {
    Route: '/api/unpublishTradeReport',
    async post(body: {
      month: ITrade['month'];
      year: ITrade['year'];
    }) {
      return await fetchRoute(this.Route, body) as { success?: boolean; error?: string };
    },
  },
  Delete: {
    Route: '/api/deleteTradeReport',
    async post(body: {
      month: ITrade['month'];
      year: ITrade['year'];
    }) {
      return await fetchRoute(this.Route, body) as { success?: boolean; error?: string };
    },
  },
};
