/* eslint-disable no-use-before-define */
/* eslint-disable class-methods-use-this */
import {
  EntityRepository, AbstractRepository, Brackets, SelectQueryBuilder,
} from 'typeorm';
import {
  Operation,
  Statement, Trade, User,
} from '@entities';
import {
  chain,
} from '@numbers';
import { IStatement, Modality, RoleId } from '@interfaces';
import { DateTime } from 'luxon';
import _ from 'lodash';
import { AppendAccountAuthorizationFilterQuery, Users } from './users.repository';
import { Trades } from './trades.repository';
import { Operations } from './operations.repository';
import { AUTH_ALLOW_MANAGER } from './auth.repository.helper';

@EntityRepository(Statement)
export class Statements extends AbstractRepository<Statement> {
  find({
    authUserId, accountNumber, userIds, monthAndYears, sinceMonthAndYear,
  }: FindStatementsArguments) {
    let query = this.createQueryBuilder('statement')
      .leftJoin('statement.user', 'user')
      .addSelect('user.accountNumber', 'accountNumber')
      .leftJoinAndMapOne('statement.previousStatement', 'client_report', 'prev', 'prev.user_id = statement.user_id and if(statement.month = 1, prev.month = 12, prev.month = statement.month - 1) and if(statement.month = 1, prev.year = statement.year - 1, prev.year = statement.year) and prev.deleted <> 1');
    query = query.andWhere('statement.deleted <> 1');
    if (accountNumber) {
      query = query.andWhere('user.accountNumber = :accountNumber', { accountNumber });
    }
    if (userIds?.length) {
      query = query.andWhere('statement.user_id in (:userIds)', { userIds });
    }

    if (sinceMonthAndYear) {
      const { month, year } = sinceMonthAndYear;
      query = query
        .andWhere('statement.year >= :sinceYear', { sinceYear: year })
        .andWhere('if (statement.year = :sinceYear, statement.month >= :sinceMonth, true)', { sinceMonth: month, sinceYear: year });
    }

    if (monthAndYears?.length) {
      query = query.andWhere(new Brackets((q) => {
        monthAndYears.reduce((expression, { month, year }, idx) => (
          expression.orWhere(`statement.year = :${year}_${idx} and statement.month = :${month}_${idx}`, { [`${year}_${idx}`]: year, [`${month}_${idx}`]: month })), q);
      }));
    }
    query = AppendAccountAuthorizationFilterQuery(query as unknown as SelectQueryBuilder<User>, authUserId) as unknown as SelectQueryBuilder<Statement>;

    return query.getMany();
  }

  async generate({
    authUserId, userIds, monthAndYear, onEachStatement, onEachStatementError,
  }: GenerateStatementsArguments) {
    try {
      await AUTH_ALLOW_MANAGER(authUserId, this.manager);

      const findStatements = (ids: number[]) => this.find({
        authUserId, userIds: ids, sinceMonthAndYear: monthAndYear,
      });

      const customUsersRepo = this.manager.getCustomRepository(Users);
      const customTradesRepo = this.manager.getCustomRepository(Trades);
      const customOpsRepo = this.manager.getCustomRepository(Operations);

      //* loop through accounts in parallel
      const statementsByAccount = await Promise.all((userIds.map(async (userId) => {
        //* delete old statements for account
        try {
          const oldStatements = await findStatements([userId]);
          await this.manager.createQueryBuilder(Statement, 'statement')
            .update({ deleted: true })
            .whereInIds(oldStatements.map(({ id }) => id))
            .execute();
        } catch ({ message }) {
          if (onEachStatementError) onEachStatementError(`while deleting statements for ${userId}: ${message}`);
          return [];
        }
        //* determine the range of months in which to generate statements
        const account = await customUsersRepo.getUserById({ authUserId, id: userId });
        const allOps = await customOpsRepo.getOperations(authUserId, [userId], []);
        const { obMonth, obYear, displayName } = account;
        //* earliest statement possible is the account opening month
        const fromDate = DateTime.fromMillis(Math.max(DateTime.fromObject({
          month: obMonth,
          year: obYear,
        }).valueOf(),
        DateTime.fromObject({
          month: monthAndYear.month,
          year: monthAndYear.year,
        }).valueOf()));
        //* latest statement possible is the latest trade report
        const toDate = DateTime.fromObject(await customTradesRepo.getLatestReport());
        const previousStatements: IStatement[] = [];
        //* loop through months and generate statements sequentially
        for (let date = fromDate; date <= toDate; date = date.plus({ month: 1 })) {
          try {
            const { month, year } = date;

            //* initialize statement fields
            let openingBalance = 0;
            let perfFee = 30;
            let fmFee = 25;
            let percentage = 100;
            let modality = Modality.NoCompounding;

            //* find the opening balance (and copy statement fields from the previous statement)
            if ((month === obMonth && obYear === year)) {
              ({ openingBalance, modality } = account);
            } else {
              // eslint-disable-next-line no-await-in-loop
              // const previousStatement = await this.createQueryBuilder('s')
              //   .where('s.user_id = :userId', { userId })
              //   .andWhere('if (:month = 1, s.year = :year - 1 and s.month = 12, s.year = :year and s.month = :month - 1)', { month, year })
              //   .andWhere('s.deleted <> 1')
              //   .getOne();
              const previousStatement = previousStatements.find(({ month: m, year: y }) => {
                if (month === 1) return y === year - 1 && m === 12;
                return y === year && m === month - 1;
              });
              if (previousStatement) {
                ({
                  endBalance: openingBalance, perfFee, fmFee, percentage,
                } = previousStatement);
              } else {
                throw new Error('Could not calculate the opening balance. Ensure previous month statement is populated.');
              }
            }

            //* calculate the gainLoss for this statement
            // eslint-disable-next-line no-await-in-loop
            const reports = await customTradesRepo.getDividendByMonthAndYears([{ month, year }]);
            const { [`${month}-${year}`]: monthlyDividend } = reports;
            if (monthlyDividend == null) throw new Error('Could not calculate the end balance for statement because the dividend was not available.');
            const gainLoss = chain(monthlyDividend).divide(100).multiply(openingBalance).round(2)
              .done();

            //* calculate the net transactions for this statement
            // eslint-disable-next-line no-await-in-loop
            const thisMonthOps = allOps.filter(({ month: m, year: y }) => m === month && y === year);
            const opsTotal = thisMonthOps?.reduce((total, { amount }) => chain(total).add(amount).round(2).done(), 0) || 0;

            //* calculate statement balance, create and save statement
            const endBalance = chain(openingBalance).add(gainLoss).add(opsTotal).round(2)
              .done();
            const newStatement = this.repository.create({
              createdId: authUserId,
              created: Date.now(),
              userId,
              month,
              year,
              perfFee,
              fmFee,
              percentage,
              modality,
              deleted: false,
              endBalance,
              gainLoss,
              monthlyDividend,
            });
            // eslint-disable-next-line no-console
            // console.log(this.createQueryBuilder('s').insert().values([newStatement]).getQueryAndParameters());
            // eslint-disable-next-line no-await-in-loop
            // await this.createQueryBuilder('s').insert().values([newStatement]).execute();
            previousStatements.push(newStatement);
            if (onEachStatement) onEachStatement({ ...newStatement, operations: thisMonthOps });
          } catch ({ message }) {
            if (onEachStatementError) onEachStatementError(`While creating statement for ${displayName} and month ${date?.toFormat('MMMM yyyy')}: ${message}`);
          }
        }
        await this.createQueryBuilder('s').insert().values(previousStatements).execute();
        return findStatements([userId]);
      })));
      const statements = _.flatten(statementsByAccount);

      return { statements };
    } catch ({ message }) {
      if (onEachStatementError) onEachStatementError(message);
      return { error: message };
    }
  }
}

export type FindStatementsArguments = {
  authUserId: User['id'];
  monthAndYears?: {year: number; month: number}[];
  accountNumber?: User['accountNumber'];
  sinceMonthAndYear?: {year: number; month: number};
  userIds?: User['id'][];
}

export type GenerateStatementsArguments = {
  authUserId: User['id'];
  userIds: User['id'][];
  monthAndYear: {year: number; month: number};
  onEachStatement?: (statement: IStatement) => void;
  onEachStatementError?: (error: string) => void;
}
