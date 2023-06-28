import { fetchRoute } from '@api';
import { IUser, IUserTrimmed } from '@interfaces';

export const Accounts = {
  UsersAccounts: {
    Route: '/api/accounts/allAccounts',
    async get() {
      return await fetchRoute(this.Route) as {
      accounts?: IUserTrimmed[];
      error?: string;
      };
    },
  },
  Find: {
    Route: '/api/accounts/findAccounts',
    async get() {
      return await fetchRoute(this.Route) as {
      accounts?: IUserTrimmed[];
      error?: string;
    };
    },
  },
  FindById: {
    Route: '/api/accounts/findAccountById',
    async post(body: {
      id: IUser['id'];
    }) {
      return await fetchRoute(this.Route, body) as {
      account?: IUserTrimmed;
      error?: string;
    };
    },
  },
  FindByIds: {
    Route: '/api/accounts/findAccountsByIds',
    async post(body: {
      ids: IUser['id'][];
    }) {
      return await fetchRoute(this.Route, body) as {
      accounts?: IUserTrimmed[];
      error?: string;
    };
    },
  },
  FindByAccountNumber: {
    Route: '/api/findAccountByAccountNumber',
    async post(body: {
      accountNumber: IUserTrimmed['accountNumber'];
    }) {
      return await fetchRoute(this.Route, body) as {
      account?: IUserTrimmed;
      error?: string;
    };
    },
  },
};
