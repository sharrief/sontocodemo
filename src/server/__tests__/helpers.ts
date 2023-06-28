import {
  BankDatum, User, Request, Document,
} from '@entities';
import {
  OperationType, RequestStatus, DocumentStage,
} from '@interfaces';
import { Users } from '@repositories';
import { DateTime } from 'luxon';
import { EntityManager } from 'typeorm';
import env from '@lib/env';

const accountNumbers = [
  2151430, 642909, 7097774, 8295316, 3992528, 2046121, 4867784,
];
const theTime = DateTime.fromFormat('2020-10-8', 'yyyy-M-D').valueOf();

export const createTestUser = async (manager: EntityManager, {
  index, roleId, fmId, name, lastname, username, businessEntity,
}: {index: number} & Pick<User, 'roleId'|'fmId'|'name'|'lastname'|'username'|'businessEntity'> = {
  index: 0, roleId: null, fmId: null, name: '', lastname: '', businessEntity: '', username: '',
}): Promise<User> => {
  const user: User = new User();
  user.roleId = roleId;
  user.fmId = fmId;
  user.deleted = false;
  user.accountNumber = `${accountNumbers[index]}`;
  user.email = env.var.EMAIL_ADMIN;
  user.businessEntity = businessEntity;
  user.obMonth = 9;
  user.obYear = 100;
  user.username = username;
  user.name = name;
  user.lastname = lastname;
  await manager.save(User, user);
  return user;
};

export async function createRequest(manager: EntityManager, id: number, userId: number, amount: number) {
  let request = new Request();
  request = Object.assign(request, {
    id,
    userId,
    amount,
    type: amount < 0 ? OperationType.Debit : OperationType.Credit,
    requester: theTime,
    status: RequestStatus.Pending,
    deleted: false,
    admin: false,
    show: true,
    wireConfirmation: '',
  });
  const repo = manager.getRepository(Request);
  await repo.save([request]);
  return request;
}

export async function createDocument(manager: EntityManager, requestId: number) {
  const [request] = await manager.find(Request, { where: { id: requestId } });
  const {
    id: operationId, amount, datetime, user,
  } = request;
  let document = new Document();
  document = Object.assign(document, {
    user,
    operationId,
    deleted: false,
    timestamp: 0,
    email: env.var.EMAIL_USER,
    amount,
    month: DateTime.fromMillis(theTime).month,
    year: DateTime.fromMillis(theTime).year,
    documentLink: '',
    status: '',
    stage: DocumentStage.Ready,
    lastUpdated: datetime,
  });
  await manager.save(Document, document);
  return document;
}

export async function createUserBankData(manager: EntityManager, user: User) {
  const bankAccounts: BankDatum[] = [];
  for (let i = 0; i < 6; i += 1) {
    const bankAccount = new BankDatum();
    bankAccount.user = user;
    bankAccount.accountName = user.businessEntity || user.displayName;
    bankAccounts.push(bankAccount);
  }
  const usersRepo = await manager.getCustomRepository(Users);
  const foundUser = await usersRepo.getUserById({ authUserId: user.id, id: user.id });
  foundUser.bankAccounts = bankAccounts;
  await manager.save(User, foundUser);
  return bankAccounts;
}
