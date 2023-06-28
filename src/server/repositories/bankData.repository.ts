/* eslint-disable class-methods-use-this */
import { AbstractRepository, EntityRepository } from 'typeorm';
import {
  BankDatum, User, ReceivingBank,
} from '@entities';
import { AppendAccountAuthorizationFilterQuery } from '@repositories';
import {
  BankAccountStatus, BankLocation, IBankDatum, IBankDatumTrimmed, IUser, RoleId, RoleName,
} from '@interfaces';
import { v4 } from 'uuid';
import { $enum } from 'ts-enum-util';
import env from '@server/lib/env';
import { Users } from './users.repository';
import { ReceivingBanks } from './receivingBank.repository';

@EntityRepository(BankDatum)
export class BankData extends AbstractRepository<BankDatum> {
  find(authUserId: User['id'], userIds: User['userId'][]) {
    let query = this.createQueryBuilder('bankData');
    query = query.where('bankData.user_id in (:userIds)', { userIds });
    query = query.andWhere('bankData.deleted <> :bankDataDeleted', { bankDataDeleted: true });
    query = query.andWhere((qb) => {
      const subQuery = qb.subQuery()
        .select('user.id').from(User, 'user');
      return `bankData.user_id in ${
        AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
        // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
          .setParameters({ authUserId }).getQuery()
      }`;
    });
    return query.getMany();
  }

  findByUUID(authUserId: User['id'], uuid: IBankDatum['uuid'], withAccountNumbers: boolean) {
    let query = this.createQueryBuilder('bankData');
    if (withAccountNumbers) {
      query = query.addSelect('bankData.accountNumber');
      query = query.addSelect('bankData.iban');
    }
    query = query.where('bankData.uuid = :uuid', { uuid });
    query = query.andWhere('bankData.deleted <> :bankDataDeleted', { bankDataDeleted: true });
    query = query.andWhere((qb) => {
      const subQuery = qb.subQuery()
        .select('user.id').from(User, 'user');
      return `bankData.user_id in ${
        AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
        // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
          .setParameters({ authUserId }).getQuery()
      }`;
    });
    return query.getOne();
  }

  findByUserId(authUserId: User['id'], userId: User['id'], withAccountNumbers: boolean) {
    let query = this.createQueryBuilder('bankData');
    if (withAccountNumbers) {
      query = query.addSelect('bankData.accountNumber');
      query = query.addSelect('bankData.iban');
    }
    query = query.where('bankData.user_id = :userId', { userId });
    query = query.andWhere('bankData.deleted <> :bankDataDeleted', { bankDataDeleted: true });
    query = query.andWhere((qb) => {
      const subQuery = qb.subQuery()
        .select('user.id').from(User, 'user');
      return `bankData.user_id in ${
        AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
        // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
          .setParameters({ authUserId }).getQuery()
      }`;
    });
    return query.getMany();
  }

  async updateBankDataProperty(authUserId: User['id'], uuid: IBankDatum['uuid'], actionName: string, props: Partial<Pick<IBankDatum, 'status'|'receivingBankId'|'DCAF'>>) {
    if (!authUserId) throw new Error(`Failed to ${actionName} data because the authorized user was not specified.`);
    if (Object.keys(props).reduce((ret, propName) => ret || !['status', 'receivingBankId', 'DCAF'].includes(propName), false)) {
      throw new Error(`Failed to ${actionName} because an invalid property was specified`);
    }
    const userRepo = this.manager.getCustomRepository(Users);
    const user = await userRepo.getUserById({ authUserId, id: authUserId });
    if (!user || ![RoleName.admin, RoleName.director].includes(user.role)) throw new Error(`Failed to ${actionName} data because the user does not have authorization`);
    const bankAccount = await this.findByUUID(authUserId, uuid, false);
    if (!bankAccount) throw new Error('Could not locate the specified bank account');
    const updateQuery = this.manager.createQueryBuilder(BankDatum, 'BankDatum').update({
      uuid, ...props,
    }).whereInIds([bankAccount.id]);
    await updateQuery.execute();

    return true;
  }

  async validate(authUserId: User['id'], uuid: IBankDatum['uuid']) {
    return this.updateBankDataProperty(authUserId, uuid, 'mark bank data valid', { status: BankAccountStatus.Validated });
  }

  async setReceivingBank(authUserId: User['id'], uuid: IBankDatum['uuid'], receivingBankId: ReceivingBank['id']) {
    const receivingBankRepo = this.manager.getCustomRepository(ReceivingBanks);
    const receivingBanks = await receivingBankRepo.find();
    const { id } = receivingBanks.find(({ id }) => id === receivingBankId);
    return this.updateBankDataProperty(authUserId, uuid, 'set receiving bank', { receivingBankId: id });
  }

  async setDCAFLink(authUserId: User['id'], uuid: IBankDatum['uuid'], DCAF: IBankDatum['DCAF']) {
    const sharepointFormat = env.var.SITE_FILE_HOST;
    const docuSignFormat = 'https://app.docusign.com/documents/details';
    if (DCAF !== '' && !(DCAF.startsWith(sharepointFormat) || DCAF.startsWith(docuSignFormat))) {
      throw new Error(`Failed to set the DCAF because the link provided doesn't start with either ${sharepointFormat} or ${docuSignFormat}.`);
    }
    return this.updateBankDataProperty(authUserId, uuid, 'set DCAF link', { DCAF });
  }

  async setPreferredBankAccount(authUserId: User['id'], uuid: IBankDatum['uuid']) {
    const errorPrefix = 'Failed to set the preferred bank account because';
    if (!authUserId) throw new Error(`${errorPrefix} the authorized user was not specified.`);
    if (!uuid) throw new Error(`${errorPrefix} the bank account identifier was not specified.`);
    const bankData = await this.findByUUID(authUserId, uuid, false);
    if (!bankData) { throw new Error(`${errorPrefix} the specified bank account could not be located.`); }
    const userBankAccounts = await this.findByUserId(authUserId, bankData.userId, false);
    await this.manager.createQueryBuilder(BankDatum, 'BankDatum')
      .update({ preferred: false })
      .whereInIds(userBankAccounts.map(({ id }) => id))
      .execute();
    await this.manager.createQueryBuilder(BankDatum, 'BankDatum')
      .update({ preferred: true, deleted: false })
      .whereInIds([bankData.id])
      .execute();
  }

  async create(authUserId: User['id'], bankData: IBankDatumTrimmed, accountNumber: IUser['accountNumber']) {
    if (!authUserId) throw new Error('Failed to create bank data because the authorized user was not specified.');
    if (!accountNumber) throw new Error('Failed to create bank data because the account was not specified.');
    const userRepo = this.manager.getCustomRepository(Users);
    const authUser = await userRepo.getUserById({ authUserId, id: authUserId });
    const accounts = await userRepo.accounts({ authUserId, accounts: { accountNumbers: [accountNumber] } });
    const receivingBanksRepo = this.manager.getCustomRepository(ReceivingBanks);
    const receivingBanks = await receivingBanksRepo.find();
    if (accounts.length !== 1) throw new Error(`Failed to create bank data for user ${bankData.userId} because the account could not be located.`);
    const [account] = accounts;
    const newBankData = new BankDatum();
    ({
      userId: newBankData.userId,
      accountEnding: newBankData.accountEnding,
      preferred: newBankData.preferred,
      DCAF: newBankData.DCAF,
      InBofA: newBankData.InBofA,
      name: newBankData.name,
      lastName: newBankData.lastName,
      accountType: newBankData.accountType,
      bankLocation: newBankData.bankLocation,
      bankCountry: newBankData.bankCountry,
      bankName: newBankData.bankName,
      address: newBankData.address,
      accountNumber: newBankData.accountNumber,
      routingNumber: newBankData.routingNumber,
      swift: newBankData.swift,
      useIBAN: newBankData.useIBAN,
      iban: newBankData.iban,
      extra: newBankData.extra,
    } = bankData);
    newBankData.uuid = v4();
    newBankData.status = [RoleId.admin, RoleId.director].includes(authUser.roleId) ? BankAccountStatus.Validated : BankAccountStatus.Review;
    newBankData.address = { ...newBankData.address, isDomestic: newBankData.bankLocation === BankLocation.Domestic };
    newBankData.userId = account.id;
    if (!newBankData.name) newBankData.name = newBankData.accountName;
    newBankData.receivingBankId = receivingBanks?.[0].id || null;
    newBankData.accountEnding = bankData.useIBAN ? bankData.iban?.substring(bankData.iban.length - 4) : bankData.accountNumber?.substring(bankData.accountNumber.length - 4);
    if (bankData.useIBAN) { newBankData.accountNumber = ''; } else { newBankData.iban = ''; }
    await this.manager.createQueryBuilder(BankDatum, 'BankData')
      .insert().values(newBankData).execute();
    if (newBankData.preferred) await this.setPreferredBankAccount(authUserId, newBankData.uuid);
    return this.findByUUID(authUserId, newBankData.uuid, true);
  }

  async save(authUserId: User['id'], bankData: IBankDatumTrimmed, accountNumber: IUser['accountNumber']) {
    if (!authUserId) throw new Error('Failed to save bank data because the authorized user was not specified.');
    if (!accountNumber) throw new Error('Failed to save bank data because the account was not specified.');
    const userRepo = this.manager.getCustomRepository(Users);
    const accounts = await userRepo.accounts({ authUserId, accounts: { accountNumbers: [accountNumber] } });
    if (accounts.length !== 1) throw new Error(`Failed to save bank data for account ${accountNumber} because the account could not be located.`);
    const [account] = accounts;
    if (account.id !== bankData.userId) throw new Error(`Failed to save bank data for account ${accountNumber} because the data is invalid.`);
    const existingBankData = await this.findByUUID(authUserId, bankData.uuid, false);
    if (!existingBankData?.id) throw new Error(`Failed to save bank data for ${bankData.uuid} because the existing bank data could not be located`);

    const editedBankData = new BankDatum();
    ({
      preferred: editedBankData.preferred,
      name: editedBankData.name,
      lastName: editedBankData.lastName,
      accountType: editedBankData.accountType,
      bankName: editedBankData.bankName,
      address: editedBankData.address,
      extra: editedBankData.extra,
    } = bankData);
    editedBankData.status = BankAccountStatus.Review;
    await this.manager.createQueryBuilder(BankDatum, 'BankData')
      .update(editedBankData).whereInIds([existingBankData.id]).execute();

    if (editedBankData.preferred) await this.setPreferredBankAccount(authUserId, editedBankData.uuid);
    return this.findByUUID(authUserId, existingBankData.uuid, true);
  }

  async delete(authUserId: User['id'], uuid: IBankDatum['uuid']) {
    if (!authUserId) throw new Error('Failed to delete bank account because the authorized user was not specified.');
    if (!uuid) throw new Error('Failed to delete bank account because the bank account identifier was not specified.');
    const bankData = await this.findByUUID(authUserId, uuid, false);
    if (!bankData) throw new Error('Failed to delete the bank account because the bank account could not be found.');
    // ensure there is still a preferred bank account
    const userBankAccounts = await this.findByUserId(authUserId, bankData.userId, false);
    if (userBankAccounts?.length > 1) {
      const preferredAccount = userBankAccounts.find(({ preferred, id: _id }) => bankData.id !== _id && preferred);
      if (!preferredAccount) {
        const newPreferredAccount = userBankAccounts.find(({ id: _id }) => bankData.id !== _id);
        await this.manager.createQueryBuilder(BankDatum, 'BankDatum').update({
          preferred: true,
        }).whereInIds([newPreferredAccount.id]).execute();
      }
    }
    const { affected } = await this.manager.createQueryBuilder(BankDatum, 'BankData')
      .update({ deleted: true }).whereInIds([bankData.id]).execute();
    if (!affected) throw new Error('Failed to delete the account data because the query failed.');
    return affected;
  }
}
