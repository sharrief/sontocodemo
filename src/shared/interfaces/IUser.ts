import {
  IBaseEntityRecord, RoleName, Modality, UserAccountStatus, IStatement, IBankDatum, IApplication, IDocument, IOperation, IRequest,
} from '@interfaces';

export interface IUser extends IBaseEntityRecord {

  id: number;

  userId: number ;

  displayName: string;

  role: RoleName;

  username: string | null ;

  hashedPassword: string | null ;

  passwordResetHash: string | null;

  passwordResetExpiration: number | null;

  otpRequired: boolean;

  otpSecret1: string | null;

  otpSecretTemp: string | null;

  roleId: number | null ;

  fmId: number | null ;

  email: string | null ;

  accountNumber: string;

  businessEntity: string;

  name: string | null ;

  lastname: string | null ;

  details: string | null ;

  accessCount: number | null ;

  lastAccess: number | null ;

  modality: Modality | null ;

  created: number | null ;

  modificated: number | null ;

  createdId: number | null ;

  modificatedId: number | null ;

  status: UserAccountStatus;

  deleted: boolean | null ;

  openingBalance: number | null ;

  obMonth: number | null ;

  obYear: number | null ;

  percentage: number;

  oauthProvider: string;

  oauthUid: string;

  rememberDevice: string;

  previousLogin: number;

  closed: boolean;

  hasAccountsAccess: boolean;

  clients?: IUser[];

  manager?: IUser;

  statements: IStatement[];

  operations: IOperation[];

  requests: IRequest[];

  documents: IDocument[];

  bankAccounts: IBankDatum[];

  applications?: IApplication[];

  application?: IApplication;
}

export type IUserTrimmed = Pick<IUser, 'id'|'accountNumber'|'displayName'|'roleId'
|'name'|'lastname'|'businessEntity'|'email'|'fmId'|'obMonth'|'obYear'|'openingBalance'
|'manager'|'statements'|'operations'|'requests'|'documents'|'bankAccounts'|'application'|'applications'|'hasAccountsAccess'>

export type IUserEditable = Pick<IUserTrimmed,
'name'|'lastname'|'businessEntity'|'email'|'fmId'|'obYear'|'obMonth'|'hasAccountsAccess'>;

export const trimAccountProps = (account: IUser): IUserTrimmed => {
  const {
    accountNumber, id, email, fmId, name, lastname, displayName, businessEntity,
    obMonth, obYear, openingBalance,
    manager, statements, operations, requests, documents, bankAccounts, applications, application,
    roleId, hasAccountsAccess,
  } = account;
  return ({
    accountNumber,
    businessEntity,
    id,
    email,
    fmId,
    name,
    lastname,
    displayName,
    obMonth,
    obYear,
    openingBalance,
    manager,
    statements,
    operations,
    requests,
    documents,
    bankAccounts,
    applications,
    application,
    roleId,
    hasAccountsAccess,
  });
};

export const trimAccountsProps = (accounts: IUser[]): IUserTrimmed[] => accounts.map((account) => trimAccountProps(account));

export type IManager = Pick<IUser, 'displayName'|'email'|'id'|'roleId'>;

export const trimManagerProps = (manager: IUser): IManager => {
  const {
    displayName, email, id, roleId,
  } = manager;
  return ({
    displayName, email, id, roleId,
  });
};

export const trimManagersProps = (managers: IUser[]): IManager[] => managers.map((manager) => trimManagerProps(manager));

export const DefaultUser: IUser = {
  id: 0,
  userId: 0,
  displayName: '',
  role: null,
  username: '',
  hashedPassword: null,
  passwordResetHash: null,
  passwordResetExpiration: null,
  otpRequired: false,
  otpSecret1: null,
  otpSecretTemp: null,
  roleId: null,
  fmId: null,
  email: '',
  accountNumber: '',
  businessEntity: '',
  name: '',
  lastname: '',
  details: null,
  accessCount: null,
  lastAccess: null,
  modality: null,
  created: null,
  createdId: null,
  modificated: null,
  modificatedId: null,
  status: null,
  deleted: true,
  openingBalance: null,
  obMonth: null,
  obYear: null,
  percentage: 0,
  oauthProvider: '',
  oauthUid: '',
  rememberDevice: '',
  previousLogin: 0,
  closed: true,
  hasAccountsAccess: false,
  statements: [],
  operations: [],
  requests: [],
  documents: [],
  bankAccounts: [],
};
