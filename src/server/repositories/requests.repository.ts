/* eslint-disable class-methods-use-this */
import {
  Brackets,
  EntityRepository, AbstractRepository,
} from 'typeorm';
import {
  BankDatum,
  Document,
  Operation, Request, User,
} from '@entities';
import {
  DocumentStage,
  OperationType,
  RequestStatus, RoleName,
} from '@interfaces';
import { Users, AppendAccountAuthorizationFilterQuery, Operations } from '@repositories';
import { DateTime } from 'luxon';
import { trimSearch } from '@util';
import { Labels } from './labels';
import { BankData } from './bankData.repository';
import { AUTH_ALLOW_MANAGER } from './auth.repository.helper';

export type RequestSubmission = {
  authUserId: User['id'];
  accountNumber: User['accountNumber'];
  amount: Request['amount'];
  recurring?: boolean;
  bankUUID?: BankDatum['uuid'];
};

export type RequestUpdate = {
  authUserId: User['id'];
  id: Request['id'];
  amount?: Request['amount'];
  wireConfirmation?: Request['wireConfirmation'];
  status?: Request['status'];
  bankAccountUUID?: Request['bankAccountUUID'];
};

export type RequestPost = {
  authUserId: User['id'];
  id: Request['id'];
  wireAmount: number;
  adjustment: number;
  year: Operation['year'];
  month: Operation['month'];
  wireConfirmation?: Request['wireConfirmation'];
}

export type VoidRequest = {
  authUserId: User['id'];
  id: Request['id'];
}

export type RecurRequest = VoidRequest;
export type CancelRequest = VoidRequest;

export type RequestFindParameters = {
  authUserId: User['id'];
  search?: string;
  statuses?: RequestStatus[];
  type?: OperationType;
  stage?: DocumentStage;
  id?: Request['id'];
  ids?: Request['id'][];
  fmId?: User['fmId'];
  userId?: User['id'];
  month?: Document['month'];
  year?: Document['year'];
  withUser?: boolean;
  withBankAccounts?: boolean;
  withBankAccountNumbers?: boolean;
  withManager?: boolean;
  withDocuments?: boolean;
  withOperations?: boolean;
  page?: number;
  limit?: number;
}

@EntityRepository(Request)
export class Requests extends AbstractRepository<Request> {
  requestAlias = 'request';

  async find({
    authUserId, search, statuses, type, stage, id, ids, userId, fmId, month, year,
    withUser, withBankAccounts, withBankAccountNumbers, withManager, withDocuments, withOperations,
    page, limit,
  }: RequestFindParameters) {
    const queryParams: {[key: string]: string} = {};
    const requestAlias = 'request';
    const userAlias = 'user';
    const managerAlias = 'manager';
    const operationAlias = 'operation';
    const documentAlias = 'document';

    let query = this.createQueryBuilder(requestAlias)
      .where(new Brackets((expression) => {
        let ex = expression;
        ex = ex.where(`${requestAlias}.status <> :requestDeleted`, { requestDeleted: RequestStatus.Deleted });
        if (statuses) {
          ex = ex.andWhere(`${requestAlias}.status IN (:requestStatus)`, { requestStatus: statuses });
        }
        if (type === OperationType.Credit) {
          ex = ex.andWhere(`${requestAlias}.amount >= 0`);
        }
        if (type === OperationType.Debit) {
          ex = ex.andWhere(`${requestAlias}.amount < 0`);
        }
        if (stage) {
          ex = ex.andWhere(`${documentAlias}.stage = :documentStage`, { documentStage: stage });
        }
        if (month && year) {
          ex = ex.andWhere(new Brackets((myqb) => {
            myqb.orWhere(`${requestAlias}.status = :pending and ${documentAlias}.month = :month and ${documentAlias}.year = :year`, { month, year, pending: RequestStatus.Pending });
            myqb.orWhere(`${requestAlias}.status = :voided and ${documentAlias}.month = :month and ${documentAlias}.year = :year`, { month, year, voided: RequestStatus.Voided });
            myqb.orWhere(`${requestAlias}.status = :approved and ${operationAlias}.month = :month and ${operationAlias}.year = :year`, { month, year, approved: RequestStatus.Approved });
            myqb.orWhere(`${requestAlias}.status = :recurring and (
              ${operationAlias}.month = :month and ${operationAlias}.year = :year
              or 
              ${documentAlias}.month = :month and ${documentAlias}.year = :year
              )`, { month, year, recurring: RequestStatus.Recurring });
          }));
        }
        // TODO also show orWhere approved and operation posted with no statement for same period
        return ex;
      }));

    if (id) query = query.andWhere(`${requestAlias}.id = :id`, { id });
    if (ids) query = query.andWhere(`${requestAlias}.id in (:ids)`, { ids });
    if (userId) query = query.andWhere(`${requestAlias}.id_client = :userId`, { userId });
    if (search || (withUser || fmId) || withManager || withBankAccounts) {
      query = query.leftJoinAndSelect(`${requestAlias}.user`, userAlias, `${userAlias}.deleted = 0`);
      if (fmId) query = query.andWhere(`${userAlias}.fmId = :fmId`, { fmId });
      if (withManager) {
        query = query.leftJoinAndSelect(`${userAlias}.manager`, managerAlias, `${managerAlias}.deleted = 0`);
      }
      if (withBankAccounts) {
        query = query.leftJoinAndSelect('user.bankAccounts', 'bankAccounts', 'bankAccounts.deleted = 0');
        if (withBankAccountNumbers) query.addSelect('bankAccounts.accountNumber');
      }
      if (search) {
        const trimmedSearch = trimSearch(search);
        const orTerms = trimmedSearch.split('|');
        if (orTerms.length) {
          query = query.andWhere(new Brackets((qb1) => {
            orTerms.reduce((q, orTerm, orIdx) => {
              const andTerms = orTerm.split(' ');
              if (!andTerms?.length) return q;
              return q.orWhere(new Brackets((qb) => {
                andTerms.reduce((orQb, term, andIdx) => orQb.andWhere(new Brackets((andQb) => {
                  const searchTermName = `term_${orIdx}_${andIdx}`;
                  if (+term) {
                    queryParams[searchTermName] = term;
                    if (withUser) {
                      andQb.orWhere(`user.id = :${searchTermName}`, { term });
                      andQb.orWhere(`MATCH(user.account_number) AGAINST(:${searchTermName})`, { term });
                    }
                    andQb.orWhere(`request.id = :${searchTermName}`, { term });
                    if (withManager) {
                      andQb.orWhere(`manager.id = :${searchTermName}`, { term });
                    }
                    if (withDocuments) { andQb.orWhere(`document.id = :${searchTermName}`, { term }); }
                  } else {
                    const searchTerm = `${term}*`;
                    queryParams[searchTermName] = searchTerm;
                    andQb.orWhere(`MATCH(user.name, user.lastname, user.business_entity, user.email) AGAINST(:${searchTermName})`, {
                      searchTerm,
                    });
                    andQb.orWhere(`MATCH(request.status, request.amount, request.wire_confirmation) AGAINST(:${searchTermName} in boolean mode)`, {
                      searchTerm,
                    });
                    if (withManager) {
                      andQb.orWhere(`MATCH(manager.username, manager.email) AGAINST(:${searchTermName} in boolean mode)`, {
                        searchTerm,
                      });
                    }
                    // searching over document fields seems to make query slow, even with index created over the two fields
                    // if (withDocuments) {
                    //   andQb.orWhere(`MATCH(document.stage, document.status) AGAINST(:${searchTermName} in boolean mode)`, {
                    //     searchTerm,
                    //   });
                    // }
                  }
                })), qb);
              }));
            }, qb1);
          }));
        }
      }
    }
    if (withDocuments || stage || month || year) query = query.leftJoinAndSelect('request.documents', documentAlias, `${documentAlias}.deleted <> 1`);
    if (withOperations || month || year) {
      query = query.leftJoinAndSelect('request.operations', operationAlias,
        `${operationAlias}.deleted <> 1`);
      if (withOperations) query = query.leftJoinAndMapOne(`${operationAlias}.createdBy`, 'users', 'poster', `${operationAlias}.created_id = poster.id`);
    }

    query = query.andWhere((qb) => {
      const subQuery = qb.subQuery()
        .select('user.id').from(User, 'user');
      return `request.id_client in ${
        AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
        // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
          .setParameters({ authUserId, ...queryParams }).getQuery()
      }`;
    });
    query = query.orderBy('request.id', 'DESC');
    // eslint-disable-next-line no-console
    // console.log(query.getQueryAndParameters());
    if (limit || page) {
      return {
        requests: await query.skip((limit || 5) * (page || 0)).take((limit || 5)).getMany(),
        count: await query.getCount(),
      };
    }
    return {
      requests: await query.getMany(),
      count: await query.getCount(),
      page,
    };
  }

  async handleRequestSubmission(requestSubmission: RequestSubmission) {
    try {
      const {
        authUserId, accountNumber, recurring, bankUUID: uuid,
      } = requestSubmission;
      const { authUser, account } = await this.getAccount(authUserId, accountNumber);
      let bankAccount = null;
      if (uuid && requestSubmission.amount < 0) {
        const bankRepo = this.manager.getCustomRepository(BankData);
        bankAccount = await bankRepo.findByUUID(authUserId, uuid, false);
      }
      const { amount } = requestSubmission;
      const request = this.manager.create(Request, {
        created: new Date().getTime(),
        createdId: authUserId,
        amount,
        status: recurring ? RequestStatus.Recurring : RequestStatus.Pending,
        user: account,
        datetime: new Date().getTime(),
        admin: authUser.role === RoleName.admin,
        bankAccount,
      });
      if (request) {
        const { identifiers } = await this.manager.createQueryBuilder(Request, 'Request').insert().values([request]).execute();
        if (identifiers) {
          const { requests } = await this.find({ authUserId, id: +identifiers[0] });
          if (requests?.length) return { request: requests[0] };
        }
      }
      return { request: null };
    } catch (error) {
      return { error };
    }
  }

  async handleRequestUpdate(requestUpdate: RequestUpdate) {
    try {
      const {
        authUserId, id, amount, wireConfirmation, status, bankAccountUUID,
      } = requestUpdate;

      await AUTH_ALLOW_MANAGER(authUserId, this.manager);

      let query = await this.createQueryBuilder('request');
      query = query
        .where('request.id = :id', { id })
        .andWhere((qb) => {
          const subQuery = qb.subQuery()
            .select('user.id').from(User, 'user');
          return `request.id_client in ${
            AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
            // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
              .setParameters({ authUserId }).getQuery()
          }`;
        });
      const request = await query.getOne();
      if (!request) {
        return { error: Labels.NoRequestForId(id) };
      }
      if ((!status || status === RequestStatus.Approved) && request.status === RequestStatus.Approved
        && (amount && amount !== request.amount)
      ) {
        return { message: Labels.CannotChangeApprovedAmount(request) };
      }
      if (amount) request.amount = amount;
      if (status) request.status = status;
      if (wireConfirmation) request.wireConfirmation = wireConfirmation;
      if (bankAccountUUID) request.bankAccountUUID = bankAccountUUID;
      const updateQuery = this.manager.createQueryBuilder(Request, 'Request').update({
        amount: request.amount,
        status: request.status,
        wireConfirmation: request.wireConfirmation,
        bankAccountUUID: request.bankAccountUUID,
      }).whereInIds([request.id]);
      await updateQuery.execute();
      const message = Labels.UpdatedRequest(request);
      return { request, message };
    } catch (error) {
      return { error };
    }
  }

  async handleRequestPost({
    authUserId, id, wireAmount, wireConfirmation, adjustment, year, month,
  }: RequestPost) {
    try {
      await AUTH_ALLOW_MANAGER(authUserId, this.manager);

      let query = await this.createQueryBuilder('request');
      query = query
        .leftJoinAndSelect('request.user', 'user')
        .leftJoinAndSelect('user.manager', 'manager')
        .leftJoinAndSelect('user.bankAccounts', 'bankAccounts')
        .where('request.id = :id', { id })
        .andWhere((qb) => {
          const subQuery = qb.subQuery()
            .select('user.id').from(User, 'user');
          return `request.id_client in ${
            AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
            // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
              .setParameters({ authUserId }).getQuery()
          }`;
        });
      const request = await query.getOne();
      if (!request) {
        throw new Error(Labels.NotAuthorized);
      }
      if ((request.status !== RequestStatus.Pending && request.status !== RequestStatus.Recurring)) {
        return { error: Labels.CannotPostBecauseStatus(request) };
      }
      const operationsRepo = this.manager.getCustomRepository(Operations);
      if (request.status === RequestStatus.Pending) {
        const [alreadyPostedPendingRequest] = await operationsRepo.find({
          request,
          deleted: false,
        });
        if (alreadyPostedPendingRequest) {
          return { error: Labels.AlreadyPostedRequest(request, alreadyPostedPendingRequest) };
        }
      }
      if (request.status === RequestStatus.Recurring) {
        const [alreadyPostedRecurringRequestForMonth] = await operationsRepo.find({
          request,
          deleted: false,
          year,
          month,
        });
        if (alreadyPostedRecurringRequestForMonth) {
          return { error: Labels.AlreadyPostedRequest(request, alreadyPostedRecurringRequestForMonth) };
        }
      }
      const operation = operationsRepo.create({
        createdId: authUserId,
        created: Date.now(),
        user: request.user,
        request,
        amount: wireAmount + adjustment,
        year,
        month,
        day: DateTime.fromObject({ year, month }).endOf('month').day,
        wireConfirmation: wireConfirmation || null,
      });
      // TODO implement bulk post
      await operationsRepo.createQueryBuilder('operation').insert().values([operation]).execute();
      if (request.status === RequestStatus.Pending) {
        request.status = RequestStatus.Approved;
      }
      if (wireConfirmation) { request.wireConfirmation = wireConfirmation; }
      await this.manager.createQueryBuilder(Request, 'Request').update({
        status: request.status,
        wireConfirmation: request.wireConfirmation,
      }).whereInIds([request.id]).execute();
      return { request, operation };
    } catch (error) {
      return { error };
    }
  }

  async makeRequestRecurring({ authUserId, id }: RecurRequest) {
    try {
      let query = await this.createQueryBuilder('request');
      query = query
        .where('request.id = :id', { id })
        .andWhere('request.status in (:canRecurStatuses)', { canRecurStatuses: [RequestStatus.Pending, RequestStatus.Approved] })
        .leftJoinAndMapOne(`${this.requestAlias}.bankAccount`, 'user_document_data', 'bankAccount', `bankAccount.deleted = 0 and bankAccount.id = ${this.requestAlias}.bankAccount`)
        .andWhere((qb) => {
          const subQuery = qb.subQuery()
            .select('user.id').from(User, 'user');
          return `request.id_client in ${
            AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
            // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
              .setParameters({ authUserId }).getQuery()
          }`;
        });
      const request = await query.getOne();
      if (request.type !== OperationType.Debit || (request.status !== RequestStatus.Pending && request.status !== RequestStatus.Approved)) {
        throw new Error(`${request.status} ${request.type} request #${request.id}.`);
      }
      request.status = RequestStatus.Recurring;
      await this.manager.createQueryBuilder(Request, 'Request').update({
        status: request.status,
      }).whereInIds([request.id]).execute();

      return { request };
    } catch (error) {
      return { error };
    }
  }

  async cancelRequest({ authUserId, id }: CancelRequest) {
    try {
      let query = await this.createQueryBuilder('request');
      query = query
        .where('request.id = :id', { id })
        .andWhere('request.status in (:canCancelStatuses)', { canCancelStatuses: [RequestStatus.Pending, RequestStatus.Recurring] })
        .andWhere((qb) => {
          const subQuery = qb.subQuery()
            .select('user.id').from(User, 'user');
          return `request.id_client in ${
            AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
            // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
              .setParameters({ authUserId }).getQuery()
          }`;
        });
      const request = await query.getOne();
      if (request.status === RequestStatus.Pending || request.status === RequestStatus.Recurring) {
        request.status = RequestStatus.Voided;
        await this.manager.createQueryBuilder(Request, 'Request').update({
          status: request.status,
        }).whereInIds([request.id]).execute();
      }
      return { request };
    } catch (error) {
      return { error };
    }
  }

  async handleRequestVoid({ authUserId, id }: VoidRequest) {
    try {
      let query = await this.createQueryBuilder('request');
      query = query
        .select('request.id')
        .leftJoinAndSelect('request.operations', 'operation')
        .where('request.id = :id', { id })
        .andWhere((qb) => {
          const subQuery = qb.subQuery()
            .select('user.id').from(User, 'user');
          return `request.id_client in ${
            AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
            // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
              .setParameters({ authUserId }).getQuery()
          }`;
        });
      const request = await query.getOne();
      const operation = request.operations && request.operations
        .reduce((prev, curr) => (!curr.deleted ? curr : prev));
      if (operation) throw new Error(`Could not post request ${request.id} as it has already been posted as operation ${operation.id}`);
      request.status = RequestStatus.Voided;
      await this.manager.createQueryBuilder(Request, 'Request').update({
        status: request.status,
      }).whereInIds([request.id]).execute();
      return { request };
    } catch (error) {
      return { error };
    }
  }

  private async getAccount(authUserId: User['id'], accountNumber: User['accountNumber']) {
    const users = this.manager.getCustomRepository(Users);
    // TODO review use of direct access to users table
    const authUser = await users.getUserById({ authUserId, id: authUserId });
    if (!authUser) throw new Error(Labels.NotAuthorized);
    const [account] = await users.accounts({ authUserId, accounts: { accountNumbers: [accountNumber] } });
    if (!account) throw new Error(Labels.NotAuthorized);
    return { account, authUser };
  }
}
