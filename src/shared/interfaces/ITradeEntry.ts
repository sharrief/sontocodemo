import { IBaseEntityRecord } from '@interfaces';
import { chain } from '@numbers';

export enum TradeSide {
  Long = 'Long',
  Short = 'Short'
}

export interface ITradeEntry extends IBaseEntityRecord{
  createdBy?: number;
  bookName: string;
  tradeNumber: number;
  bookNumber: number;
  date: number;
  symbol: string;
  side: TradeSide;
  model: string;
  entry?: number;
  exits?: number[];
  pips?: number[];
  notes?: string;
  image1?: string;
  image2?: string;
  deleted?: boolean;
}

export interface ITradeSymbol extends IBaseEntityRecord{
  name: string;
}

export interface ITradeModel extends IBaseEntityRecord{
  name: string;
}
const currencyPipFactor: (symbol: string) => number = (symbol) => {
  switch (symbol) {
    case 'USD/JPY':
      return 2;
    default: return 4;
  }
};

export const calcPips = (entry: number, exit: number, side: TradeSide, symbol: string) => {
  const isLong = side === TradeSide.Long;
  if (!exit) return 0;
  return +(isLong ? chain(exit).subtract(entry || 0) : chain(entry || 0).subtract(exit))
    .multiply(10 ** currencyPipFactor(symbol)).round(2)
    .done();
};
