/* eslint-disable class-methods-use-this */
import {
  EntityRepository, AbstractRepository,
} from 'typeorm';
import { TradeModel } from '@entities';
import { RoleName } from '@interfaces';

@EntityRepository(TradeModel)
export class TradeModels extends AbstractRepository<TradeModel> {
  async getTradeModels(authUserRole: RoleName) {
    if (![RoleName.admin, RoleName.seniorTrader].includes(authUserRole)) return [];
    const query = this.createQueryBuilder('tradeModel');
    return query.getMany();
  }
}
