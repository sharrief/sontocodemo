import 'reflect-metadata';
import {
  IBaseEntityRecord,
} from '@interfaces';

export interface IReceivingBank extends IBaseEntityRecord {
  id: number;

  deleted?: boolean;

  accountName: string;

  accountAddress: string;

  accountNumber: string;

  bankName: string;

  bankAddress: string;

  bankRoutingACH: string;

  bankRoutingWires: string;

  bankSWIFT: string;

  bankExtra: string;
}

export const IRecevingBankLabels: { [key in keyof IReceivingBank]: string } = {
  id: 'Id',
  deleted: 'Deleted',
  accountName: 'Account Name',
  accountAddress: 'Account Address',
  accountNumber: 'Account Number or IBAN',
  bankName: 'Bank Name',
  bankAddress: 'Bank Address',
  bankRoutingACH: 'Bank Routing ACH',
  bankRoutingWires: 'Bank Routing Wires',
  bankSWIFT: 'Bank SWIFT',
  bankExtra: 'Additional Bank Info',
};

export const DefaultReceivingBank: IReceivingBank = {
  id: 0,
  deleted: false,
  accountName: '',
  accountAddress: '',
  accountNumber: '',
  bankName: '',
  bankAddress: '',
  bankRoutingACH: '',
  bankRoutingWires: '',
  bankSWIFT: '',
  bankExtra: '',
};
