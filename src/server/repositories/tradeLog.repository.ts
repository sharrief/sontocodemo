/* eslint-disable class-methods-use-this */
import {
  EntityRepository, AbstractRepository,
} from 'typeorm';
import { TradeEntry } from '@entities';
import { ITradeEntry, IUser, RoleName } from '@interfaces';

@EntityRepository(TradeEntry)
export class TradeLog extends AbstractRepository<TradeEntry> {
  async getBooksByName(authUserRole: RoleName, bookName: string) {
    if (![RoleName.admin, RoleName.seniorTrader].includes(authUserRole)) return [];
    const query = this.createQueryBuilder('tradeEntry')
      .where('tradeEntry.bookName = :bookName', { bookName })
      .andWhere('tradeEntry.deleted = :tradeDeleted', { tradeDeleted: false });
    return query.getMany();
  }

  async getBookNames(authUserRole: RoleName) {
    if (![RoleName.admin, RoleName.seniorTrader].includes(authUserRole)) return [];
    const query = this.createQueryBuilder('tradeEntry')
      .select('DISTINCT tradeEntry.bookName');
    return query.getRawMany() as Promise<{bookName: string}[]>;
  }

  async saveTrade(authUser: IUser, tradeEntry: ITradeEntry) {
    if (![RoleName.admin, RoleName.seniorTrader].includes(authUser.role)) throw new Error('You do not have the role needed to save trades.');
    const {
      id, bookName, tradeNumber, bookNumber, date, symbol, side, model, entry, exits, pips, notes, image1, image2,
    } = tradeEntry;

    const existingTradeEntries = await this.createQueryBuilder('tradeEntry').whereInIds([id]).getMany();
    if (existingTradeEntries?.length) {
      const saveResult = await this.createQueryBuilder('tradeEntry')
        .update({
          bookName, tradeNumber, bookNumber, date, symbol, side, model, entry, exits, pips, notes, image1, image2,
        }).whereInIds([id]).execute();
      const [savedTrade] = await this.createQueryBuilder('tradeEntry').whereInIds([id]).getMany();
      if (saveResult?.affected) return { tradeEntry: savedTrade };
      throw new Error(`Unable to locate saved trade ${id} after attempting the save.`);
    }

    const insertResult = await this.createQueryBuilder('tradeEntry')
      .insert().values({
        createdBy: authUser.id, bookName, tradeNumber, bookNumber, date, symbol, side, model, entry, exits, pips, notes, image1, image2,
      }).execute();
    if (insertResult?.identifiers?.length) {
      const [savedTrade] = await this.createQueryBuilder('tradeEntry').whereInIds([insertResult.identifiers[0].id]).getMany();
      return { tradeEntry: savedTrade };
    }
    throw new Error('Unable to save the trade for some reason.');
  }

  async deleteTrade(authUser: IUser, id: number) {
    if (![RoleName.admin, RoleName.seniorTrader].includes(authUser.role)) throw new Error('You do not have the role needed to delete trades.');

    const existingTradeEntry = await this.createQueryBuilder('tradeEntry').whereInIds([id]).getMany();
    if (existingTradeEntry?.length) {
      const saveResult = await this.createQueryBuilder('tradeEntry')
        .update({
          deleted: true,
        }).whereInIds([id]).execute();
      const [savedTrade] = await this.createQueryBuilder('tradeEntry').whereInIds([id]).getMany();
      if (saveResult?.affected && savedTrade.deleted) return { id: savedTrade.id };
      throw new Error(`Unable to delete trade ${id}.`);
    }
    throw new Error(`Unable to locate trade ${id} to delete.`);
  }
}
