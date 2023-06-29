/* eslint-disable class-methods-use-this */
import {
  EntityRepository, AbstractRepository, Brackets,
} from 'typeorm';
import { Trade } from '@entities';
import {
  chain,
} from '@numbers';
import { IUser, NewTrade, RoleName } from '@interfaces';
import { Users } from '@repositories';
import { DateTime } from 'luxon';
import { Statements } from './statements.repository';

type MonthAndYear = { month: number; year: number };

@EntityRepository(Trade)
export class Trades extends AbstractRepository<Trade> {
  async getTradesByMonthAndYears(monthAndYears: MonthAndYear[] = [], unpublished = false) {
    let query = this.createQueryBuilder('trade')
      .where('trade.deleted = 0');
    if (!unpublished) {
      query = query.andWhere('trade.published = 1');
    }
    if (monthAndYears?.length) {
      query = query.andWhere(new Brackets((q) => {
        monthAndYears.reduce((expression, { month, year }, idx) => (
          expression.orWhere(`trade.year = :${year}_${idx} and trade.month = :${month}_${idx}`, { [`${year}_${idx}`]: year, [`${month}_${idx}`]: month })), q);
      }));
    }
    return query.getMany();
  }

  async getDividendByMonthAndYears(monthAndYears: MonthAndYear[]) {
    const trades = await this.getTradesByMonthAndYears(monthAndYears);
    const totals = trades.reduce((total, { month, year, interest }) => {
      const monthYearIndex = `${month}-${year}`;
      return { ...total, [monthYearIndex]: chain(total?.[monthYearIndex] ?? 0).add(interest).done() as number };
    }, {} as {[key: string]: number});
    return totals;
  }

  async getDividends(published = true) {
    let query = this.createQueryBuilder('trade')
      .select('year, month, sum(interest) as interest')
      .where('deleted = 0');
    if (published) query = query.andWhere('published = 1');
    query = query.andWhere('year >= 2017')
      .groupBy('year, month');
    const totals = await query.getRawMany();
    return totals as {year: number; month: number; interest: number}[];
  }

  async getLatestReport() {
    const query = this.createQueryBuilder('trade')
      .where((qb) => `year = ${qb.subQuery()
        .select('max(year)')
        .from(Trade, 'maxYearReport')
        .where('deleted = 0')
        .getQuery()}`)
      .andWhere('trade.deleted = 0')
      .andWhere('trade.published = 1')
      .orderBy('month', 'DESC');
    const { month, year } = await query.getOne();
    return { month, year };
  }

  async allTrades() {
    return this.createQueryBuilder('trade')
      .where('trade.deleted = 0')
      .getMany();
  }

  private async userCanModifyTradeReport(authUserId: IUser['id']) {
    const usersRepo = this.manager.getCustomRepository(Users);
    const user = await usersRepo.getUserById({ authUserId, id: authUserId });
    if (!user) throw new Error('Cannot save trades as no user was found.');
    if ([RoleName.admin, RoleName.seniorTrader].includes(user.role)) return true;
    return false;
  }

  async addUnpublishedTrades(authUserId: IUser['id'], month: number, year: number, newTrades: NewTrade[], day?: number) {
    if (!authUserId) return { trades: [] };
    if (!(await this.userCanModifyTradeReport(authUserId))) return { error: 'Cannot modify the trade report as the user is not authorized.' };
    // check to see if published trades already exist for this month
    const existingTrades = await this.getTradesByMonthAndYears([{ month, year }]);
    if (existingTrades?.length) throw new Error('Cannot add trades to this month as the month is already published');
    if (day != null) {
      // remove existing trades for this day
      await this.manager.createQueryBuilder(Trade, 'trade')
        .update({ deleted: true }).where('month = :month and year = :year and day = :day', { month, year, day })
        .execute();
    }
    if (newTrades.length) {
      // add new trades
      await this.manager.createQueryBuilder(Trade, 'trade').insert().values(newTrades.map((t) => ({
        symbol: t.symbol,
        interest: t.interest,
        month,
        year,
        day: t.day,
        created: DateTime.now().valueOf(),
        createdId: authUserId,
        published: false,
      }))).execute();
    }
    const trades = await this.getTradesByMonthAndYears([{ month, year }], true);
    return { trades };
  }

  async publishMonthlyReport(authUserId: IUser['id'], month: number, year: number) {
    if (!month || !year) throw new Error(`Unable to publish trade report for month ${month} and year ${year}`);
    if (!(await this.userCanModifyTradeReport(authUserId))) throw new Error('Cannot modify the trade report as the user is not authorized.');
    await this.manager.createQueryBuilder(Trade, 'trade')
      .update({ published: true }).where('month = :month and year = :year', { month, year }).execute();
    return true;
  }

  async unpublishMonthlyReport(authUserId: IUser['id'], month: number, year: number) {
    if (!month || !year) throw new Error(`Unable to unpublish trade report for month ${month} and year ${year}`);
    if (!(await this.userCanModifyTradeReport(authUserId))) throw new Error('Cannot modify the trade report as the user is not authorized.');
    const statementsRepo = this.manager.getCustomRepository(Statements);
    const existingStatements = await statementsRepo.find({ authUserId, monthAndYears: [{ month, year }] });
    if (existingStatements?.length) throw new Error(`Could not unpublish the trade report for month ${month} and year ${year} because there are ${existingStatements.length} statements that depend on this trade report.`);
    await this.manager.createQueryBuilder(Trade, 'trade')
      .update({ published: false }).where('month = :month and year = :year and published = true', { month, year }).execute();
    return true;
  }

  async deleteMonthlyReport(authUserId: IUser['id'], month: number, year: number) {
    if (!month || !year) throw new Error(`Unable to delete trade report for month ${month} and year ${year}`);
    if (!(await this.userCanModifyTradeReport(authUserId))) throw new Error('Cannot modify the trade report as the user is not authorized.');
    await this.manager.createQueryBuilder(Trade, 'trade')
      .update({ deleted: true }).where('month = :month and year = :year', { month, year }).execute();
    return true;
  }
}
