/* eslint-disable no-use-before-define */
/* eslint-disable class-methods-use-this */
import {
  EntityRepository, AbstractRepository, Brackets, SelectQueryBuilder,
} from 'typeorm';
import crypto from 'crypto';
import {
  Delegation,
  User,
} from '@entities';
import {
  IUserEditable,
  Modality,
  RequestStatus, RoleId, UserAccountStatus,
} from '@interfaces';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { authenticator } from 'otplib';
import env from '@server/lib/env';
import { Sessions } from './sessions.repository';
import { AUTH_ALLOW_MANAGER, AUTH_ALLOW_MANAGER_TO_EDIT_USER } from './auth.repository.helper';

export function AppendAccountAuthorizationFilterQuery(query: SelectQueryBuilder<User>, authUserId: User['id']) {
  return query.andWhere(new Brackets((whereExpression) => {
    whereExpression
      .where('user.id = :authUserId')
      .orWhere('user.fm_id = :authUserId')
      .orWhere(`${RoleId.admin} = ${query.subQuery()
        .select('admin.role_id')
        .from(User, 'admin')
        .where('admin.id = :authUserId')
        .andWhere('admin.deleted = 0')
        .getQuery()}`)
      .orWhere(`user.fm_id IN ${query.subQuery()
        .select('manager.id')
        .from(User, 'manager')
        .leftJoin(User, 'director', 'manager.fm_id = director.id')
        .andWhere('director.id = :authUserId')
        .andWhere('director.deleted = 0')
        .andWhere('director.role_id = :directorRole')
        .andWhere('manager.deleted = 0')
        .getQuery()}`)
      .orWhere(`user.id IN ${query.subQuery()
        .select('user.id')
        .from(User, 'user')
        .leftJoin(Delegation, 'delegations', 'delegations.owner_id = user.id')
        .andWhere('delegations.delegate_id = :authUserId')
        .andWhere('delegations.deleted = 0')
        .getQuery()}`);
  })).setParameters({ authUserId, directorRole: RoleId.director });
}

@EntityRepository(User)
export class Users extends AbstractRepository<User> {
  async accounts(accountsQuery: AccountsQuery) {
    if (accountsQuery?.authUserId == null) throw new Error('Could not query database because no authorized user was specified.');
    const {
      authUserId, accounts, managers, statements, requests, withManager, withBankData,
    } = accountsQuery;
    /* TODO determine if authUser is admin or manager during authN
    * so that queries can show fields like user ids using .addSelect
    * and entities can hide fields using {select: false}
    */
    let query = this.createQueryBuilder('user');
    query = query
      .addSelect('user.otpRequired')
      .where('user.deleted = 0');
    query = withManager ? query.leftJoinAndSelect('user.manager', 'manager') : query;
    query = statements ? this.filterAccountStatements(query, statements) : query;
    query = requests ? this.filterAccountRequests(query, requests) : query;
    query = accounts ? this.filterAccounts(query, accounts) : query;
    query = managers ? this.filterAccountsByManagers(query, managers) : query;
    query = withBankData ? query.leftJoinAndSelect('user.bankAccounts', 'bankAccount') : query;
    query = AppendAccountAuthorizationFilterQuery(query, authUserId);

    // eslint-disable-next-line no-console
    // console.log(query.getQueryAndParameters());

    const users = await query.getMany();
    // const users = (await query.getRawMany<User>());
    return users;
  }

  async getUserById({ authUserId, id }: {authUserId: User['id']; id: User['id']}) {
    const [user] = await this.accounts({ authUserId, accounts: { ids: [id] } }) || [];
    return user || null;
  }

  async countAccountNumber(accountNumber: number) {
    return this.createQueryBuilder('user').where('user.account_number = :accountNumber', { accountNumber }).getCount();
  }

  async countEmailAddress(email: string) {
    return this.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .andWhere('user.deleted <> :deleted', { deleted: true })
      .getCount();
  }

  findByEmailAndHashedPassword(email: User['email'], hashedPassword: User['hashedPassword']) {
    if (!email || !hashedPassword) return undefined;
    const query = this.createQueryBuilder('user')
      .addSelect('user.otpSecret1')
      .where('user.email = :email', { email })
      .andWhere('user.password = :hashedPassword', { hashedPassword })
      .andWhere('user.deleted = 0')
      .andWhere('user.status = :userStatusActive', { userStatusActive: UserAccountStatus.active })
      .andWhere(new Brackets((expression) => {
        expression
          .andWhere('user.role_id IN (:allowedRoles)', { allowedRoles: [RoleId.admin, RoleId.manager, RoleId.director, RoleId.seniorTrader] })
          .orWhere('user.id IN (:userIds)', { userIds: [294, 443, 72, 762, 802] })
          .orWhere('user.hasAccountsAccess = 1');
      }));
    return query.getOne();
  }

  updateLastAccess(user: User) {
    return this.manager.createQueryBuilder(User, 'User').update({
      lastAccess: (new Date()).getTime(),
    }).whereInIds([user.id]).execute();
  }

  getCountOfPendingRequests({ authUserId }: CountOfPendingRequestsQuery) {
    let query = this.createQueryBuilder('user')
      .select('request.id_client', 'id')
      .addSelect('COUNT(request.id)', 'count')
      .leftJoin('user.requests', 'request', 'request.status in (:requestStatuses) and request.id_client = user.id', { requestStatuses: [RequestStatus.Pending, RequestStatus.Recurring] })
      .groupBy('request.id_client');
    query = AppendAccountAuthorizationFilterQuery(query, authUserId);
    // eslint-disable-next-line no-console
    // error(JSON.stringify(query.getQueryAndParameters()));
    return query.getRawMany() as Promise<{id: number; count: number}[]>;
  }

  async openAccount(authUserId: User['id'], month: number, year: number, email: User['email'], name: User['name'], lastName: User['lastname'], entity?: User['businessEntity'], managerId?: User['id']) {
    await AUTH_ALLOW_MANAGER(authUserId, this.manager);

    const account = new User();
    if (managerId) {
      const [manager] = await this.accounts({ authUserId, accounts: { ids: [managerId], roles: [RoleId.director, RoleId.manager, RoleId.admin] } });
      if (!manager) throw new Error(`Could not locate the manager with id ${managerId}`);
      account.manager = manager;
    } else {
      // manager is the user opening the account
      const [manager] = await this.accounts({ authUserId, accounts: { ids: [authUserId], roles: [RoleId.director, RoleId.manager, RoleId.admin] } });
      if (!manager) throw new Error(`Could not locate the manager with id ${authUserId}`);
      account.manager = manager;
    }

    if (await this.countEmailAddress(email)) {
      throw new Error(`Could not open the account because the email address ${email} is already in use`);
    }

    const openDate = DateTime.fromObject({ month, year });
    const fundStartDate = DateTime.fromObject({ month: 1, year: 2017 }).valueOf();
    if (!(openDate.isValid && openDate.valueOf() >= fundStartDate)) throw new Error(`The opening date provided (${month}-${year}) is invalid or is before Jan 2017`);

    account.createdId = authUserId;
    account.obMonth = month;
    account.obYear = year;
    account.email = email;
    account.name = name;
    account.lastname = lastName;
    account.businessEntity = entity;
    account.status = UserAccountStatus.active;
    account.roleId = RoleId.client;
    account.percentage = 100;
    account.modality = Modality.NoCompounding;
    account.created = DateTime.now().valueOf();
    account.hasAccountsAccess = true;

    const getNum = () => Math.floor(Math.random() * (10 ** 10));
    let accountNumber = 0;
    let loopCount = 0;
    while (!accountNumber && loopCount < 10) {
      const tempNum = getNum();
      // eslint-disable-next-line no-await-in-loop
      const existingUser = await this.countAccountNumber(tempNum);
      if (!existingUser) accountNumber = tempNum;
      loopCount += 1;
    }
    if (!accountNumber || loopCount >= 10) {
      throw new Error('Could not generate a new account number');
    }
    account.accountNumber = `${accountNumber}`;
    const insertQuery = await this.manager.createQueryBuilder(User, 'user').insert().values({ ...account });
    const newAccountResult = await insertQuery.execute();
    if (!newAccountResult?.identifiers?.length) throw new Error('Could not open the account as the insert query failed.');
    const newAccount = this.getUserById({ authUserId, id: newAccountResult.identifiers[0].id });
    return newAccount;
  }

  async startPasswordReset({ email }: { email: string }, expires = true) {
    const account = await this.createQueryBuilder('user')
      .where('email = :email', { email })
      .andWhere('deleted = 0')
      .getOne();
    if (!account) return {};
    const hashMaker = crypto.createHash('sha256');
    const hashUpdate = hashMaker.update(v4(), 'utf-8');
    const hash = hashUpdate.digest('hex');
    const expiration = DateTime.now().plus(expires ? { hour: 1 } : { days: 30 }).valueOf();
    const result = await this.manager.createQueryBuilder(User, 'User').update({
      passwordResetHash: hash,
      passwordResetExpiration: expiration,
    }).whereInIds([account.id]).execute();
    if (result.affected) {
      return {
        account,
        hash,
        expiration,
      };
    }
    return { };
  }

  async userOTPEnabled(email: User['email']) {
    try {
      const [user] = await this.manager.createQueryBuilder(User, 'user')
        .addSelect('user.otpSecret1')
        .where('user.email = :email', { email })
        .andWhere('user.deleted = 0')
        .getMany();
      return { otpRequired: !!user?.otpSecret1 };
    } catch (e) {
      return { error: e?.message || e };
    }
  }

  async disableOTPRequirements(id: User['id'], password: string) {
    try {
      const [user] = await this.accounts({ authUserId: id, accounts: { ids: [id] } }) || [];
      if (!user) throw new Error('Unable to locate the specified user');

      const otpSalt = env.var.DB_PASSWORD_2FA_SALT;
      const otpHashedPassword = crypto.createHash('sha256')
        .update(password + otpSalt, 'utf8').digest('hex');

      const validUser = await this.findByEmailAndHashedPassword(user.email, otpHashedPassword);
      if (!validUser) throw new Error('Double check you entered the correct password');

      const salt = env.var.DB_PASSWORD_SALT;
      const hashedPassword = crypto.createHash('sha256')
        .update(password + salt, 'utf8').digest('hex');

      const result = await this.manager.createQueryBuilder(User, 'User').update({
        hashedPassword,
        otpSecret1: '',
        otpSecretTemp: '',
        otpRequired: false,
      }).whereInIds([id]).execute();
      if (!result.affected) throw new Error('Unable to finish OTP setup. Please contact adminstration for assistance');
      return { success: true };
    } catch (e) {
      return { error: e?.message || e };
    }
  }

  async createTempOTPSecret(id: User['id']) {
    try {
      const [user] = await this.accounts({ authUserId: id, accounts: { ids: [id] } }) || [];
      if (!user) throw new Error('Unable to locate the specified user');
      const secret = authenticator.generateSecret();
      if (!secret?.length) throw new Error('Unable to finish OTP setup. Please contact adminstration for assistance');
      const result = await this.manager.createQueryBuilder(User, 'User').update({
        otpSecret1: '',
        otpSecretTemp: secret,
        otpRequired: false,
      }).whereInIds([id]).execute();
      if (!result.affected) throw new Error('Unable to finish OTP setup. Please contact adminstration for assistance');
      const queryUserWithOTP = await this.createQueryBuilder('user')
        .select('user.otpSecretTemp')
        .whereInIds([id]);
      const [userWithOTP] = await AppendAccountAuthorizationFilterQuery(queryUserWithOTP, id)
        .getMany();
      return { tempSecret: userWithOTP.otpSecretTemp };
    } catch (e) {
      return { error: e?.message || e };
    }
  }

  async validateTempOPTSecret(id: User['id'], code: string, password: string) {
    const [user] = await this.accounts({ authUserId: id, accounts: { ids: [id] } }) || [];
    if (!user) throw new Error('Unable to locate the specified user');

    const salt = env.var.DB_PASSWORD_SALT;
    const hashedPassword = crypto.createHash('sha256')
      .update(password + salt, 'utf8').digest('hex');
    const validUser = await this.findByEmailAndHashedPassword(user.email, hashedPassword);
    if (!validUser) throw new Error('Double check you entered the correct password');

    const queryUserWithOTP = await this.createQueryBuilder('user')
      .select('user.otpSecretTemp')
      .whereInIds([id]);
    const [userWithOTP] = await AppendAccountAuthorizationFilterQuery(queryUserWithOTP, id)
      .getMany();
    if (!userWithOTP?.otpSecretTemp) throw new Error('Unable to complete the OTP setup, as the secret was not present for the user');
    const isValid = authenticator.verify({ token: code, secret: userWithOTP.otpSecretTemp });

    const otpSalt = env.var.DB_PASSWORD_2FA_SALT;
    const otpHashedPassword = crypto.createHash('sha256')

      .update(password + otpSalt, 'utf8').digest('hex');
    if (isValid) {
      await this.manager.createQueryBuilder(User, 'User').update({
        hashedPassword: otpHashedPassword,
        otpSecret1: userWithOTP.otpSecretTemp,
        otpSecretTemp: '',
        otpRequired: true,
      }).whereInIds([id]).execute();
      return true;
    }
    return false;
  }

  async doPasswordReset({ resetKey, newPassword }: { resetKey: string; newPassword: string }) {
    const query = this.createQueryBuilder('user')
      .addSelect('user.passResetHash', 'user_passResetHash')
      .addSelect('passResetExpire', 'user_passResetExpire')
      .addSelect('user.otpSecret1')
      .addSelect('id')
      .addSelect('email')
      .andWhere('user.passResetHash = :resetKey', { resetKey })
      .andWhere('user.deleted = 0');
    const user = await query.getOne();
    if (!user) throw new Error('The password reset link is invalid.');
    const { id, email, passwordResetExpiration } = user;
    if (passwordResetExpiration < DateTime.now().valueOf()) {
      throw new Error('The password reset link has expired.');
    }
    let salt = env.var.DB_PASSWORD_SALT;
    if (user.otpSecret1) { salt = env.var.DB_PASSWORD_2FA_SALT; }
    const newHashedPassword = crypto.createHash('sha256')
      .update(newPassword + salt, 'utf-8').digest('hex');

    const result = await this.manager.createQueryBuilder(User, 'User').update({
      hashedPassword: newHashedPassword,
      passwordResetHash: null,
      passwordResetExpiration: null,
      status: UserAccountStatus.active,
    }).whereInIds([id]).execute();

    if (result.affected) {
      const sessionsRepo = this.manager.getCustomRepository(Sessions);
      await sessionsRepo.unsafeDeleteSessionsForUser({ userId: id, email: user.email });
      return {
        email,
        message: 'The password reset has been completed.',
      };
    }

    throw new Error('The password reset failed for some reason.');
  }

  async doChangeEmail({ authUserId, accountNumber, email }: { authUserId: User['id']; accountNumber: User['accountNumber']; email: User['email'] }) {
    try {
      await AUTH_ALLOW_MANAGER(authUserId, this.manager);

      const accounts = await this.accounts({ authUserId, accounts: { accountNumbers: [accountNumber] } });
      if (accounts?.length === 1) {
        const [account] = accounts;
        const updateEmailQuery = await this.manager.createQueryBuilder(User, 'user').update({
          email,
          modificatedId: authUserId,
        }).whereInIds([account.id]).execute();
        if (updateEmailQuery.affected) {
          return {
            message: `Successfully changed the email for account ${accountNumber} from '${account.email}' to '${email}.'`,
            oldEmail: account.email,
            newEmail: email,
          };
        }
      }
      return { error: 'Failed to locate the account.' };
    } catch ({ message }) {
      return { error: message };
    }
  }

  async doEditAccount({ authUserId, id, partialAccount }: { authUserId: User['id']; id: User['id']; partialAccount: IUserEditable}) {
    try {
      await AUTH_ALLOW_MANAGER_TO_EDIT_USER(authUserId, this.manager, id);

      const accounts = await this.accounts({ authUserId, accounts: { ids: [id] } });
      if (accounts?.length === 1) {
        const [account] = accounts;
        const {
          name, lastname, businessEntity, email, fmId, obYear, obMonth, hasAccountsAccess,
        } = partialAccount;
        const updateAccountQuery = await this.manager.createQueryBuilder(User, 'user').update({
          name, lastname, businessEntity, email, fmId, obYear, obMonth, hasAccountsAccess,
        }).whereInIds([account.id]).execute();
        if (updateAccountQuery.affected) {
          return {
            message: `Successfully edited the info for account ${account.accountNumber}.`,
          };
        }
      }
      return { error: 'Failed to locate the account.' };
    } catch ({ message }) {
      return { error: message };
    }
  }

  private filterAccounts(query: SelectQueryBuilder<User>, accounts: AccountQueryFilter) {
    let q = query;
    const {
      ids, accountNumbers, roles, emails,
    } = accounts;
    q = ids?.length ? q.andWhere('user.id in (:ids)', { ids }) : q;
    q = roles?.length ? q.andWhere('user.role_id in (:roles)', { roles }) : q;
    q = emails?.length ? q.andWhere('user.email in (:emails)', { emails }) : q;
    q = accountNumbers?.length ? q
      .andWhere('user.accountNumber in (:accountNumbers)', { accountNumbers }) : q;
    return q;
  }

  private filterAccountsByManagers(query: SelectQueryBuilder<User>, managers: ManagerQueryFilter) {
    const managerFilterQuery = query
      .andWhere('user.fm_id IN (:managerIds)', { managerIds: managers.ids });
    return managerFilterQuery;
  }

  private filterAccountStatements(query: SelectQueryBuilder<User>, statements: StatementsQueryFilter) {
    if (statements?.date && !statements.date?.year) return query;
    let q = query
      .leftJoinAndSelect('user.statements', 'statement', 'statement.deleted <> :statementDeleted', { statementDeleted: true })
      .leftJoinAndSelect('user.operations', 'operation', 'operation.deleted <> :operationDeleted', { operationDeleted: true });
    const { year, month } = statements?.date || {};
    if (year >= 1970 && year <= 2100) {
      q = q.andWhere('statement.year = :year and operation.year = :year', { year });
      if (month) { q = q.andWhere('statement.month = :month and operation.month = :month', { month }); }
    }
    return q;
  }

  private filterAccountRequests(query: SelectQueryBuilder<User>, requests: RequestsQueryFilter) {
    if (!requests?.all && !requests?.status) return query;
    const { all, status } = requests || {};
    let q = query
      .leftJoinAndSelect('user.requests', 'request')
      .leftJoinAndSelect('request.operations', 'operation', 'operation.deleted <> :operationDeleted', { operationDeleted: true })
      .leftJoinAndSelect('request.documents', 'document', 'document.deleted <> :documentDeleted', { documentDeleted: true })
      .leftJoinAndSelect('user.bankAccounts', 'bankAccount', 'bankAccount.preferred = :bankAccountPreferred', { bankAccountPreferred: true });
    if (all) {
      q = query
        .andWhere('request.status <> :requestStatus', { requestStatus: RequestStatus.Deleted });
    } else if (status) {
      q = query
        .andWhere('request.status = :requestStatus', { requestStatus: status });
    }
    return q;
  }
}

type AccountQueryFilter = {
  ids?: User['id'][];
  accountNumbers?: User['accountNumber'][];
  roles?: RoleId[];
  emails?: User['email'][];
}
type ManagerQueryFilter = {
  ids: User['id'][];
}
type StatementsQueryFilter = {
  date?: {
    month?: 1|2|3|4|5|6|7|8|9|10|11|12;
    year: number;
  };
};
type RequestsQueryFilter = {
  all?: boolean;
  status?: RequestStatus;
}
export type AccountsQuery = {
  authUserId: User['id'];
  accounts?: AccountQueryFilter;
  withBankData?: boolean;
  managers?: ManagerQueryFilter;
  withManager?: boolean;
  statements?: StatementsQueryFilter;
  requests?: RequestsQueryFilter;
}

type CountOfPendingRequestsQuery = {
  authUserId: User['id'];
}
