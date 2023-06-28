import {
  IBaseEntityRecord, IUser, ITrade, Modality, IOperation,
} from '@interfaces';

export interface IStatement extends IBaseEntityRecord {
  id: number;

  userId: number;

  year: number;

  month: number;

  gainLoss: number;

  perfFee: number;

  fmFee: number;

  monthlyDividend: number;

  previousStatement?: IStatement;

  endBalance: number;

  modality: Modality | null;

  created: number | null;

  createdId: number | null;

  deleted: boolean | null;

  percentage: number;

  user: IUser;

  trades?: ITrade[];

  operations?: IOperation[];
}

export interface IExpandedStatement extends IStatement {
  openingBalance: number;
  netReturn: number;
  grossReturn: number;
  feeTotal: number;
}
