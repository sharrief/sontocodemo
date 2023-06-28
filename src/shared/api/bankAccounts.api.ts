import { fetchRoute } from '@api';
import {
  IBankDatumTrimmed, IUser, IReceivingBank,
} from '@interfaces';
import { ValidationError } from 'class-validator/types/validation/ValidationError';

const path = '/api/bankData';

export const BankData = {
  Find: {
    Route: `${path}/findBankDataByAccountNumber`,
    async post(
      body?: {
        accountNumber: IUser['accountNumber'];
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        bankAccounts?: IBankDatumTrimmed[];
        error?: string;
      };
    },
  },
  FindByAccountNumbers: {
    Route: `${path}/findBankDataByAccountNumbers`,
    async post(
      body?: {
        accountNumbers: IUser['accountNumber'][];
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        bankAccounts?: IBankDatumTrimmed[];
        error?: string;
      };
    },
  },
  Create: {
    Route: `${path}/createBankInfo`,
    async post(
      body?: {
        accountNumber: string;
        bankAccount: IBankDatumTrimmed;
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        bankData?: IBankDatumTrimmed;
        validations?: ValidationError[];
        error?: string;
      };
    },
  },
  SetReceivingBank: {
    Route: `${path}/setReceivingBank`,
    async post(
      body?: {
        receivingBankId: IReceivingBank['id'];
        uuid: IBankDatumTrimmed['uuid'];
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        error?: string;
      };
    },
  },
  Validate: {
    Route: `${path}/validateBankInfo`,
    async post(
      body?: {
        uuid: IBankDatumTrimmed['uuid'];
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        error?: string;
      };
    },
  },
  SetDCAFLink: {
    Route: `${path}/setDCAFLink`,
    async post(
      body?: {
        uuid: IBankDatumTrimmed['uuid'];
        DCAF: IBankDatumTrimmed['DCAF'];
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        error?: string;
      };
    },
  },
  Delete: {
    Route: `${path}/deleteBankInfo`,
    async post(
      body?: {
        uuid: IBankDatumTrimmed['uuid'];
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        error?: string;
      };
    },
  },
  WithAccountNumber: {
    Route: `${path}/findBankDataWithAccountNumber`,
    async post(
      body?: {
        uuid: IBankDatumTrimmed['uuid'];
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        bankAccount?: IBankDatumTrimmed;
        error?: string;
      };
    },
  },
  SetPreferredBankAccount: {
    Route: `${path}/setPreferredBankAccount`,
    async post(
      body?: {
        uuid: IBankDatumTrimmed['uuid'];
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        error?: string;
      };
    },
  },
  GetReceivingBanks: {
    Route: `${path}/getReceivingBanks`,
    async get() {
      return await fetchRoute(this.Route) as {
        receivingBanks?: IReceivingBank[];
        error?: string;
      };
    },
  },
  GetReceivingBank: {
    Route: `${path}/getReceivingBank`,
    async post(
      body?: {
        receivingBankId: IReceivingBank['id'];
      },
    ) {
      return await fetchRoute(this.Route, body) as {
        receivingBank?: IReceivingBank;
        error?: string;
      };
    },
  },
};
