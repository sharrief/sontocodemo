import { IBaseEntityRecord } from '@interfaces';

export interface ITrade extends IBaseEntityRecord {
  id: number;

  symbol: string | null;

  day: number | null;

  interest: number | null;

  month: number | null;

  year: number | null;

  created: number | null;

  createdId: number | null;

  deleted: boolean | null;

  published: boolean | null;
}

export type NewTrade = Pick<ITrade, 'symbol'|'day'|'interest'>

export enum AssetSymbol {
  ABCDE = 'ABCDE',
  BCDEF = 'BCDEF',
  CDEFG = 'CDEFG',
  DEFGH = 'DEFGH',
  EFGHI = 'EFGHI',
  FGHIJ = 'FGHIJ',
  GHIJK = 'GHIJK'
}

export enum TradeModel {
  A = 1,
  B = 2,
  C = 2.1,
  D = 3,
  E = 4,
  F = 4.1,
  G = 5,
  H = 6,
  I = 7
}
