import { fetchRoute } from '@api';
import { IUser, IUserEditable, IUserTrimmed } from '@interfaces';

export const Users = {
  Login: {
    Route: '/login',
    async post(body: {
      email: string;
      password: string;
      link?: string;
      otp?: string;
    }) {
      return await fetchRoute(this.Route, body) as Response & {
        success?: boolean;
        link?: string;
        message?: string;
        error?: string;
        otpRequired?: boolean;
      };
    },
  },
  GenerateTempOTPSecret: {
    Route: '/api/generateTempOTPSecret',
    async get() {
      return await fetchRoute(this.Route) as { message?: string; error?: string; secret?: string };
    },
  },
  ValidateTempOTPSecret: {
    Route: '/api/validateTempOTPSecret',
    async post(body: {
      code: string
      password: string
    }) {
      return await fetchRoute(this.Route, body) as { message?: string; error?: string; success?: boolean };
    },
  },
  DisableOTP: {
    Route: '/api/disableOTP',
    async post(body: {
      password: string
    }) {
      return await fetchRoute(this.Route, body) as { message?: string; error?: string; success?: boolean };
    },
  },
  SignedIn: {
    Route: '/api/currentUser',
    async get() {
      return await
      fetchRoute(this.Route) as { user?: IUserTrimmed; error?: string};
    },
  },
  SignedInV2: {
    Route: '/api/users/signedin',
    async get() {
      return await
      fetchRoute(this.Route) as { user?: IUser; error?: string};
    },
  },
  OpenAccount: {
    Route: '/api/openUserAccount',
    async post(body: {
      month: number;
      year: number;
      email: string;
      name: string;
      lastName: string;
      businessEntity: string;
      managerId?: number;
      sendEmail: boolean;
    }) {
      return await fetchRoute(this.Route, body) as { success?: boolean; message?: string; error?: string };
    },
  },
  StartPasswordReset: {
    Route: '/api/startPasswordReset',
    async post(body: { email: string }) {
      return await fetchRoute(this.Route, body) as { message?: string; error?: string };
    },
  },
  DoPasswordReset: {
    Route: '/api/doPasswordReset',
    async post(body: { resetKey: string; newPassword: string }) {
      return await fetchRoute(this.Route, body) as { message?: string; error?: string };
    },
  },
  EditAccount: {
    Route: '/api/editAccountInfo',
    async post(body: {
      id: number;
      account: IUserEditable;
    }) {
      return await fetchRoute(this.Route, body) as { message?: string; error?: string };
    },
  },
};
