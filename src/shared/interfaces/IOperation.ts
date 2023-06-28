import {
  IBaseEntityRecord, IUser, IRequest, OperationType,
} from '@interfaces';

export interface IOperation extends IBaseEntityRecord {
  type: OperationType;

  id: number;

  userId?: number | null;

  amount: number | null;

  created: number | null;

  createdBy?: IUser;

  createdId: number | null;

  day: number | null;

  month: number | null;

  year: number | null;

  deleted: boolean | null;

  requestId: number;

  wireConfirmation: string | null;

  user: IUser;

  request?: IRequest;
}

export const DefaultOperation: IOperation = {
  type: null,
  id: 0,
  userId: null,
  amount: null,
  created: null,
  createdId: null,
  day: null,
  month: null,
  year: null,
  deleted: null,
  requestId: null,
  wireConfirmation: null,
  user: null,
};
