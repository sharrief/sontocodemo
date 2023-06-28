import { fetchRoute } from '@api';
import { IManager, IUser } from '@interfaces';

const path = '/api';

export const Managers = {
  FindByUserId: {
    Route: `${path}/findManagerByUserId`,
    async post(body: {
      id: IUser['id'];
    }) {
      return await fetchRoute(this.Route, body) as {
        manager?: IUser;
        error?: string;
      };
    },
  },
  FindByUserIds: {
    Route: `${path}/findManagerByUserIds`,
    async post(body: {
      ids: IUser['id'][];
    }) {
      return await fetchRoute(this.Route, body) as {
        managers?: IUser[];
        error?: string;
      };
    },
  },
  FindByAccountNumber: {
    Route: `${path}/findManagerByAccountNumber`,
    async post(body: {
      accountNumber: IUser['accountNumber'];
    }) {
      return await fetchRoute(this.Route, body) as {
        manager?: IUser;
        error?: string;
      };
    },
  },
  All: {
    Route: `${path}/allManagers`,
    async get() {
      return await fetchRoute(this.Route) as {
        managers?: IManager[];
        error?: string;
      };
    },
  },
  KPI: {
    Route: `${path}/managerPortfolio`,
    async get() {
      return await fetchRoute(this.Route) as {
      error?: string;
      portfolioBalances?: {
        displayName: IUser['displayName'];
        accountNumber: IUser['accountNumber'];
        userId: IUser['id'];
        fmId: IUser['fmId'];
        month: number;
        year: number;
        endBalance: number;
        gainLoss: number;
        netOperations: number;
      }[];
    };
    },
  },
};
