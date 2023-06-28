/* eslint-disable class-methods-use-this */
import {
  EntityRepository, AbstractRepository,
} from 'typeorm';
import { TradeSymbol } from '@entities';
import { RoleName } from '@interfaces';

@EntityRepository(TradeSymbol)
export class TradeSymbols extends AbstractRepository<TradeSymbol> {
  async getTradeSymbols(authUserRole: RoleName) {
    if (![RoleName.admin, RoleName.seniorTrader].includes(authUserRole)) return [];
    const query = this.createQueryBuilder('tradeSymbol');
    return query.getMany();
  }
}
