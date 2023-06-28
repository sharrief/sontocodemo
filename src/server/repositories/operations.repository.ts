import {
  Repository,
  EntityRepository,
  Brackets,
} from 'typeorm';
import { Operation, User, Request } from '@entities';
import { AppendAccountAuthorizationFilterQuery } from '@repositories/users.repository';
import { IRequest } from '@interfaces';
import { AUTH_ALLOW_MANAGER } from './auth.repository.helper';

@EntityRepository(Operation)

export class Operations extends Repository<Operation> {
  private static alias = 'operation';

  getOperations(authUserId: User['id'], userIds: User['id'][], monthAndYears: {month: number; year: number}[], requestId?: Request['id']) {
    let query = this.createQueryBuilder('o')
      .where('o.deleted = :deleted', { deleted: 0 })
      .andWhere((qb) => {
        const subQuery = qb.subQuery()
          .select('user.id').from(User, 'user');
        return `o.user_id in ${
          AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
          // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
            .setParameters({ authUserId }).getQuery()
        }`;
      });
    if (userIds.length) query = query.andWhere('o.user_id in (:userIds)', { userIds });
    if (monthAndYears?.length) {
      query = query.andWhere(new Brackets((q) => {
        monthAndYears.reduce((expression, { month, year }, idx) => (
          expression.orWhere(`o.month = :${month}_${idx} and o.year = :${year}_${idx}`, { [`${month}_${idx}`]: month, [`${year}_${idx}`]: year })
        ), q);
      }));
    }
    if (+requestId) query = query.andWhere('o.request_id = :requestId', { requestId: +requestId });
    return query
      .orderBy('o.year', 'ASC')
      .orderBy('o.month', 'ASC')
      .orderBy('o.day', 'ASC')
      .orderBy('o.amount', 'ASC')
      .getMany();
  }

  findByRequestIds(authUserId: User['id'], ids: IRequest['id'][]) {
    if (!ids?.length) return (async () => [] as Operation[])();
    let query = this.createQueryBuilder('operation');
    query = query.where('operation.request_id in (:ids)', { ids })
      .andWhere('operation.deleted <> :opDeleted', { opDeleted: true });
    query = query.andWhere((qb) => {
      const subQuery = qb.subQuery()
        .select('user.id').from(User, 'user');
      return `${Operations.alias}.user_id in ${
        AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
        // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
          .setParameters({ authUserId }).getQuery()
      }`;
    });
    return query.getMany();
  }

  getByIds(authUserId: User['id'], ids: Operation['id'][]) {
    let query = this.createQueryBuilder(Operations.alias);
    query = query.whereInIds(ids);
    query = query.andWhere((qb) => {
      const subQuery = qb.subQuery()
        .select('user.id').from(User, 'user');
      return `${Operations.alias}.user_id in ${
        AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
        // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
          .setParameters({ authUserId }).getQuery()
      }`;
    });
    return query
      .orderBy(`${Operations.alias}.year`, 'ASC')
      .orderBy(`${Operations.alias}.month`, 'ASC')
      .orderBy(`${Operations.alias}.day`, 'ASC')
      .orderBy(`${Operations.alias}.amount`, 'ASC')
      .getMany();
  }

  async setDeleted(authUserId: User['id'], ids: Operation['id'][]) {
    try {
      await AUTH_ALLOW_MANAGER(authUserId, this.manager);
      let query = this.createQueryBuilder(Operations.alias);
      query = query.whereInIds(ids);
      query = query.andWhere((qb) => {
        const subQuery = qb.subQuery()
          .select('user.id').from(User, 'user');
        return `${Operations.alias}.user_id in ${
          AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
          // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
            .setParameters({ authUserId }).getQuery()
        }`;
      });
      let operations = await query.getMany();
      const authorizedIds = operations.map(({ id }) => id);
      if (!authorizedIds?.length) return { message: 'The operations could not be located.' };
      const result = await this.manager.createQueryBuilder(Operation, 'Operation').update({
        deleted: true,
      }).whereInIds(authorizedIds).execute();
      if (!result.affected) return { message: 'No operations were deleted.' };
      operations = await query.getMany();
      return { operations, message: `Deleted operation(s) ${operations.map(({ id }) => id).join(', ')}.` };
    } catch (error) {
      return { message: error };
    }
  }
}
