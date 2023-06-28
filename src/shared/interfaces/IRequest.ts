import {
  IBaseEntityRecord, IOperation, IUser, IDocument, OperationType, RequestStatus,
} from '@interfaces';
import { IBankDatum } from './IBankData';

export interface IRequest extends IBaseEntityRecord {
  id: number;

  created: number;

  createdId: number;

  type: OperationType;

  userId: number | null;

  amount: number | null;

  datetime: number | null;

  status: RequestStatus;

  viewed: boolean | null;

  admin: boolean;

  show: boolean;

  wireConfirmation: string | null;

  bankAccountUUID: string | null;

  bankAccount?: IBankDatum;

  user?: IUser;

  operations?: IOperation[];

  documents?: IDocument[];
}

export const DefaultRequest: IRequest = {
  id: 0,
  created: 0,
  createdId: 0,
  type: null,
  userId: null,
  amount: null,
  datetime: null,
  status: null,
  viewed: null,
  admin: false,
  show: false,
  bankAccountUUID: null,
  wireConfirmation: null,
};
