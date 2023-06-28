import 'reflect-metadata';
import {
  IBaseEntityRecord, IUser,
} from '@interfaces';
import { AddressModel } from '@models';
import { plainToClass, Type } from 'class-transformer';
import {
  IsAlphanumeric,
  Length, Matches, validate, ValidateNested, IsBIC, IsISO31661Alpha2, IsIBAN, ValidateIf,
} from 'class-validator';
import { IReceivingBank } from './IReceivingBank';

export enum BankAccountType {
  Personal = 'personal',
  Business = 'business',
}

export enum BankLocation {
  Domestic = 'domestic',
  International = 'international'
}

export enum BankAccountStatus {
  Review = 'In review',
  Validated = 'Validated',
  Invalid = 'Invalid',
}

export const IntraFundTransferUUID = 'xfer';

export interface IBankDatum extends IBaseEntityRecord {
  id: number;

  userId: number;

  accountEnding?: string | null;

  recurring?: boolean | null;

  linkAccount?: string | null;

  linkRecurring?: string | null;

  accountName?: string | null;

  preferred?: boolean | null;

  DCAF?: string | null;

  InBofA?: number;

  deleted?: boolean;

  uuid?: string;

  name: string;

  lastName?: string;

  accountType: BankAccountType;

  bankLocation: BankLocation;

  bankCountry: string;

  bankName: string;

  address: AddressModel;

  accountNumber?: string;

  routingNumber?: string | null;

  swift?: string | null;

  extra?: string | null;

  useIBAN?: boolean;

  iban?: string | null;

  status: BankAccountStatus;

  user?: IUser;

  receivingBankId: IReceivingBank['id'];
}

export type IBankDatumTrimmed = Omit<IBankDatum, 'id'|'linkRecurring'|'linkAccount'>

export const DefaultBankDatum: IBankDatum = {
  id: 0,
  userId: 0,
  name: '',
  lastName: '',
  accountType: BankAccountType.Personal,
  bankLocation: BankLocation.Domestic,
  bankCountry: '',
  bankName: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    postal: '',
    state: '',
    country: '',
    isDomestic: true,
  },
  accountEnding: '',
  preferred: false,
  DCAF: '',
  InBofA: 0,
  deleted: false,
  uuid: '0',
  accountNumber: '',
  routingNumber: '',
  swift: '',
  useIBAN: false,
  status: null,
  iban: '',
  extra: '',
  receivingBankId: 0,
};

export const BankDatumLabels: {[name in keyof IBankDatum]: string } = {
  id: 'ID',
  userId: 'User ID',
  name: 'Account holder name',
  lastName: 'Account holder last name',
  accountEnding: 'Account ending',
  recurring: 'Recurring',
  linkAccount: 'Link to account doc',
  linkRecurring: 'Link to recurring doc',
  accountName: 'Account name',
  preferred: 'Preferred',
  DCAF: 'Distribution and Credit Authorization Form',
  InBofA: 'Saved in BofA',
  deleted: 'Deleted',
  uuid: 'UUID',
  accountType: 'Account type',
  bankLocation: 'US Domestic or International',
  bankCountry: 'Bank country',
  bankName: 'Bank name',
  address: 'Address',
  accountNumber: 'Account number',
  routingNumber: 'Routing number',
  swift: 'SWIFT (BIC) code',
  useIBAN: 'Use IBAN',
  iban: 'International Bank Account Number (IBAN)',
  extra: 'Additional information',
  status: 'Status',
  user: 'User',
  receivingBankId: 'Receiving bank',
};

export class BankDatumModel implements IBankDatum {
  id: number;

  userId: number;

  accountEnding?: string | null;

  recurring?: boolean | null;

  linkAccount?: string | null;

  linkRecurring?: string | null;

  accountName?: string | null;

  preferred?: boolean | null;

  DCAF?: string | null;

  InBofA?: number;

  deleted?: boolean;

  uuid?: string;

  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9.\s-]*[a-zA-Z0-9.]$/, { message: 'The characters may only be letters, numbers, periods or dashes.' })
  @Length(2, 50, { message: 'The name must be between 2 and 50 characters long.' })
    name: string;

  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9.\s-]*[a-zA-Z0-9.]$/, { message: 'The characters may only be letters, numbers, periods or dashes.' })
  @Length(2, 50, { message: 'The name must be between 2 and 50 characters long.' })
  @ValidateIf((data) => data.accountType === BankAccountType.Personal)
    lastName?: string;

  accountType: BankAccountType;

  bankLocation: BankLocation;

  @IsISO31661Alpha2({ message: 'Please select a valid country from the list.' })
    bankCountry: string;

  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9.\s-]*[a-zA-Z0-9.]$/, { message: 'The characters may only be letters, numbers, periods or dashes.' })
  @Length(2, 50, { message: 'The bank name must be between 2 and 50 characters long.' })
    bankName: string;

  @ValidateNested()
  @Type(() => AddressModel)
    address: AddressModel;

  @IsAlphanumeric('en-US', { message: 'Enter only letters and numbers. No dashes or spaces.' })
  @ValidateIf((data: IBankDatum) => !data.useIBAN)
    accountNumber?: string;

  @Matches(/[0-9]{9}/, { message: 'Enter a 9-digit US ABA routing number.' })
  @ValidateIf((data: IBankDatum) => data.bankLocation === BankLocation.Domestic)
    routingNumber?: string | null;

  @IsBIC({ message: 'The code provided does not fit the proper format for a Bank Identifier Code (BIC/SWIFT).' })
  @ValidateIf((data: IBankDatum) => !data.useIBAN && data.bankLocation === BankLocation.International)
    swift?: string | null;

  useIBAN?: boolean;

  @IsIBAN({ message: 'The code provided does not fit the proper format for an International Bank Account Number (IBAN).' })
  @ValidateIf((data: IBankDatum) => data.useIBAN && data.bankLocation === BankLocation.International)
    iban?: string | null;

  extra?: string | null;

  status: BankAccountStatus;

  user?: IUser;

  receivingBankId: IReceivingBank['id'];
}

export const validateBankDatum = async (data: Partial<IBankDatum>) => {
  const copy = { ...data };
  copy.address.isDomestic = data.bankLocation === BankLocation.Domestic;
  const BankDatum = plainToClass(BankDatumModel, copy);
  const validations = await validate(BankDatum);
  return validations;
};
