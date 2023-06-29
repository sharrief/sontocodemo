import { DateTime } from 'luxon';
import {
  Operation,
  Request,
  Statement,
  Trade,
  User,
  Document,
  BankDatum,
  Application,
  ReceivingBank,
} from '@entities';
import {
  Modality,
  RequestStatus,
  RoleId,
  GetDocumentStatusByStage,
  UserAccountStatus,
  DocumentStage,
  OperationType,
  ApplicantEntityType,
  DefaultApplicantAddress,
  IApplication,
  DefaultApplication,
  IContactInfo,
  DefaultContactInfo,
  IApplicantAddress,
  IApplicantBirthDate,
  USDValueBracket,
} from '@interfaces';
import { Repository } from 'typeorm';
import {
  chain,
} from '@numbers';
import { v4 } from 'uuid';
import { fakeAssUsers } from '../user.data';

const allUsers: User[] = [];
let administrator: User;
let director: User;
let director2: User;
let manager: User;
let manager2: User;
let client: User;
let client2: User;
let clientDeleted: User;
let clientInactive: User;
let applicant1: {name: string; lastname: string; email: string };
let applicant2: {name: string; lastname: string; email: string };
let usersInited = false;

export async function createSaveAndGetTestUserData(usersRepo: Repository<User>) {
  if (!usersRepo) throw new Error('Could not create test user data because the repo was null or undefined');
  if (!usersInited) {
    usersInited = true;
    let fauIdx = 0;
    administrator = await usersRepo.save(usersRepo.create({
      status: UserAccountStatus.active,
      username: `${fakeAssUsers[fauIdx].name} ${fakeAssUsers[fauIdx].lastname}`,
      roleId: RoleId.admin,
      email: 'admin@test.sontocoholdings.com',
      hashedPassword: 'a8tfdpnrta-ftusant9-2d8f3wup3w892fdtupn',
    }));
    allUsers.push(administrator);
    fauIdx += 1;
    director = await usersRepo.save(usersRepo.create({
      status: UserAccountStatus.active,
      username: `${fakeAssUsers[fauIdx].name} ${fakeAssUsers[fauIdx].lastname}`,
      email: `${fakeAssUsers[fauIdx].name}${fakeAssUsers[fauIdx].lastname}@test.sontocoholdings.com`,
      hashedPassword: 'nt2983fwupartn92q-83fwntiuprtn98fN{89',
      roleId: RoleId.director,
    }));
    allUsers.push(director);
    fauIdx += 1;
    director2 = await usersRepo.save(usersRepo.create({
      status: UserAccountStatus.active,
      username: `${fakeAssUsers[fauIdx].name} ${fakeAssUsers[fauIdx].lastname}`,
      email: `${fakeAssUsers[fauIdx].name}${fakeAssUsers[fauIdx].lastname}@test.sontocoholdings.com`,
      hashedPassword: 'nt2983fwupartn92q-83fwntiuprtn98fN{89',
      roleId: RoleId.director,
    }));
    allUsers.push(director2);
    fauIdx += 1;
    manager = await usersRepo.save(usersRepo.create({
      manager: director,
      status: UserAccountStatus.active,
      username: `${fakeAssUsers[fauIdx].name} ${fakeAssUsers[fauIdx].lastname}`,
      email: `${fakeAssUsers[fauIdx].name}${fakeAssUsers[fauIdx].lastname}@test.sontocoholdings.com`,
      hashedPassword: 'nt2983fwupartn92q-83fwntiuprtn98fN{89',
      roleId: RoleId.manager,
    }));
    allUsers.push(manager);
    fauIdx += 1;
    manager2 = await usersRepo.save(usersRepo.create({
      manager: director2,
      status: UserAccountStatus.active,
      username: `${fakeAssUsers[fauIdx].name} ${fakeAssUsers[fauIdx].lastname}`,
      roleId: RoleId.manager,
    }));
    allUsers.push(manager2);
    fauIdx += 1;
    client = await usersRepo.save(usersRepo.create({
      id: 294, // this ID is whitelisted for sign in as a client
      accountNumber: `0000${fauIdx}`,
      status: UserAccountStatus.active,
      name: fakeAssUsers[fauIdx].name,
      lastname: fakeAssUsers[fauIdx].lastname,
      roleId: RoleId.client,
      manager,
      email: `${fakeAssUsers[fauIdx].name}@test.sontocoholdings.com`,
      hashedPassword: '123abc',
      openingBalance: 0,
      obMonth: 1,
      obYear: 2017,
    }));
    allUsers.push(client);
    fauIdx += 1;
    client2 = await usersRepo.save(usersRepo.create({
      accountNumber: `0000${fauIdx}`,
      openingBalance: 10000,
      obMonth: 1,
      obYear: 2017,
      status: UserAccountStatus.active,
      name: fakeAssUsers[fauIdx].name,
      lastname: fakeAssUsers[fauIdx].lastname,
      roleId: RoleId.client,
      manager: manager2,
    }));
    fauIdx += 1;
    allUsers.push(client2);
    clientDeleted = await usersRepo.save(usersRepo.create({
      accountNumber: `0000${fauIdx}`,
      status: UserAccountStatus.active,
      name: fakeAssUsers[fauIdx].name,
      lastname: fakeAssUsers[fauIdx].lastname,
      roleId: RoleId.client,
      manager: manager2,
      email: `${fakeAssUsers[fauIdx].name}${fakeAssUsers[fauIdx].lastname}@test.sontocoholdings.com`,
      hashedPassword: 't9823fnuwptdanhtpuanshts',
      deleted: true,
    }));
    allUsers.push(clientDeleted);
    fauIdx += 1;
    allUsers.push(client2);
    clientInactive = await usersRepo.save(usersRepo.create({
      accountNumber: `0000${fauIdx}`,
      name: fakeAssUsers[fauIdx].name,
      lastname: fakeAssUsers[fauIdx].lastname,
      roleId: RoleId.client,
      manager,
      email: `${fakeAssUsers[fauIdx].name}${fakeAssUsers[fauIdx].lastname}@test.sontocoholdings.com`,
      hashedPassword: 'tn2938wf2udn2983wfn239w82',
      status: UserAccountStatus.pending,
    }));
    allUsers.push(clientInactive);
    fauIdx += 1;
    applicant1 = {
      name: fakeAssUsers[fauIdx].name,
      lastname: fakeAssUsers[fauIdx].lastname,
      email: `${fakeAssUsers[fauIdx].name}${fakeAssUsers[fauIdx].lastname}@test.sontocoholdings.com`,
    };
    fauIdx += 1;
    applicant2 = {
      name: fakeAssUsers[fauIdx].name,
      lastname: fakeAssUsers[fauIdx].lastname,
      email: `${fakeAssUsers[fauIdx].name}${fakeAssUsers[fauIdx].lastname}@test.sontocoholdings.com`,
    };
    fauIdx += 1;
  }
  return {
    allUsers, administrator, director, director2, manager, manager2, client, client2, clientDeleted, clientInactive, applicant1, applicant2,
  };
}

const dataYear = 2017;
const dataMonth = 3;
const dataDay = DateTime.fromObject({ year: dataYear, month: dataMonth }).endOf('month').day;
const allRequests: Request[] = [];
let requestPosted: Request;
let creditPending: Request;
let creditPending2: Request;
let creditPending2WithDoc: Request;
let debitPending: Request;
let debitPending2: Request;
let debitRecurring: Request;
let debitRecurringWithDoc: Request;
let requestDeleted: Request;
let requestDeclined: Request;
let approvedRequestDeletedOp: Request;
let requestsInited = false;

export async function createSaveAndGetTestRequestData(requestsRepo: Repository<Request>) {
  if (!requestsRepo) throw new Error('Could not create test requests data because the repo was null or undefined');
  if (!usersInited) throw new Error('Could not create test requests data because users have not been initialized.');
  if (!requestsInited) {
    requestsInited = true;
    creditPending = requestsRepo.create({ // call order 5
      amount: 10,
      status: RequestStatus.Pending,
      user: client,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(creditPending);
    debitPending = requestsRepo.create({ // call order 4
      amount: -400,
      status: RequestStatus.Pending,
      user: client,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(debitPending);
    requestPosted = requestsRepo.create({
      amount: 100,
      status: RequestStatus.Approved,
      user: client,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(requestPosted);
    requestDeleted = requestsRepo.create({
      amount: 30,
      status: RequestStatus.Deleted,
      user: client,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(requestDeleted);
    approvedRequestDeletedOp = requestsRepo.create({ // approved request for deleted op
      amount: 200,
      status: RequestStatus.Approved,
      user: client,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(approvedRequestDeletedOp);
    requestDeclined = requestsRepo // declined request
      .create({
        amount: 20,
        status: RequestStatus.Declined,
        user: client,
        datetime: DateTime.now().valueOf(),
      });
    allRequests.push(requestDeclined);
    creditPending2WithDoc = requestsRepo.create({ // pending credit for client2 with doc
      amount: 10,
      status: RequestStatus.Pending,
      user: client2,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(creditPending2WithDoc);
    creditPending2 = requestsRepo.create({ // pending credit for client2, call order 3
      amount: 150,
      status: RequestStatus.Pending,
      user: client2,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(creditPending2);
    debitPending2 = requestsRepo.create({ // pending debit for client2, call order 2
      amount: -10,
      status: RequestStatus.Pending,
      user: client2,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(debitPending2);
    allRequests.push(requestsRepo // deleted for client2
      .create({
        amount: 10,
        status: RequestStatus.Deleted,
        user: client2,
        datetime: DateTime.now().valueOf(),
      }));
    debitRecurring = requestsRepo.create({ // recurring debit for client, call order 1
      amount: -520,
      status: RequestStatus.Recurring,
      user: client,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(debitRecurring);
    debitRecurringWithDoc = requestsRepo.create({ // recurring debit for client2 with doc
      amount: -420,
      status: RequestStatus.Recurring,
      user: client2,
      datetime: DateTime.now().valueOf(),
    });
    allRequests.push(debitRecurringWithDoc);
    await requestsRepo.save(allRequests); // save requests to create ids to use for relations in operations and documents
  }
  return {
    allRequests, debitPending, debitPending2, debitRecurring, debitRecurringWithDoc, creditPending, creditPending2, creditPending2WithDoc, requestPosted, approvedRequestDeletedOp, requestDeclined, requestDeleted,
  };
}
const allOperations: Operation[] = [];
let operationPosted: Operation;
let operationDeleted: Operation;
const getCreated = (y: number, month: number, day?: number) => {
  const milliseconds = DateTime.fromObject({
    year: (y),
    month,
    day: day || 7, // 7 is default statement creation date for tests
  }).valueOf();
  return { created: milliseconds };
};
let operationsInited = false;

export async function createSaveAndGetTestOperationsData(operationsRepo: Repository<Operation>) {
  if (!operationsRepo) throw new Error('Could not create test operations data because the repo was null or undefined');
  if (!usersInited || !requestsInited) throw new Error('Could not create test operations data because users or requests have not been initialized.');
  if (!operationsInited) {
    operationsInited = true;
    const createOp = async (account: User, amount: number, y: number, month: number, day?: number, request?: Request, isDeleted?: boolean) => {
      const endOfMonthDay = DateTime.fromObject({ year: y, month }).endOf('month').day;
      const op = (operationsRepo.create({
        user: account,
        amount,
        year: y,
        month,
        day: day || endOfMonthDay,
        created: getCreated(y, month, day).created,
        createdId: 490,
        deleted: isDeleted || false,
        request,
      }));
      allOperations.push(op);
      return op;
    };
    operationPosted = await createOp(
      requestPosted.user,
      requestPosted.amount,
      dataYear,
      dataMonth,
      dataDay,
      requestPosted,
    );
    operationDeleted = await createOp( // deleted operation for approved request
      approvedRequestDeletedOp.user,
      approvedRequestDeletedOp.amount,
      dataYear,
      dataMonth,
      dataDay,
      approvedRequestDeletedOp,
      true,
    );
    await createOp(client, 200, dataYear, 1);
    await createOp(client, -100, dataYear, 3);
    await createOp(client, 30, dataYear, 3);
    await createOp(client, 9, dataYear, 3, null, null, true);
    await createOp(client2, 8900, dataYear, 1);
    await createOp(client2, -3000, dataYear, 2);
    await operationsRepo.save(allOperations);
  }
  return { allOperations, operationPosted, operationDeleted };
}
const allDocuments: Document[] = [];
let documentPending: Document;
let documentRecurring: Document;
let documentPosted: Document;
let documentDeleted: Document;
let documentsInited = false;
const publicId = 0;
const email = 'test@sontocoholdings.com';
export async function createSaveAndGetTestDocumentData(documentsRepo: Repository<Document>) {
  if (!documentsRepo) throw new Error('Could not create test document data because the repo was null or undefined');
  if (!usersInited || !requestsInited) throw new Error('Could not create test document data because users or requests have not been initialized.');
  if (!documentsInited) {
    documentsInited = true;
    documentPending = documentsRepo.create({
      amount: creditPending2WithDoc.amount,
      publicId,
      email,
      user: creditPending2WithDoc.user,
      request: creditPending2WithDoc,
      year: dataYear,
      month: dataMonth,
      status: GetDocumentStatusByStage(
        DocumentStage.Client,
        creditPending2WithDoc.amount > 0 ? OperationType.Credit : OperationType.Debit,
        null,
      ),
      stage: DocumentStage.Client,
    });
    allDocuments.push(documentPending);
    documentPosted = documentsRepo.create({
      amount: requestPosted.amount,
      publicId,
      email,
      user: requestPosted.user,
      request: requestPosted,
      year: dataYear,
      month: dataMonth,
      status: GetDocumentStatusByStage(
        requestPosted.amount > 0 ? DocumentStage.Received : DocumentStage.Sent,
        requestPosted.amount > 0 ? OperationType.Credit : OperationType.Debit,
        null,
      ),
      stage: requestPosted.amount > 0 ? DocumentStage.Received : DocumentStage.Sent,
      documentLink: 'https://accounts.sontocoholdings.com',
      lastUpdated: DateTime.now().valueOf(),
    });
    allDocuments.push(documentPosted);
    documentDeleted = documentsRepo.create({
      amount: requestDeleted.amount,
      publicId,
      email,
      user: requestDeleted.user,
      request: requestDeleted,
      year: dataYear,
      month: dataMonth,
      deleted: true,
      status: GetDocumentStatusByStage(
        DocumentStage.Cancelled,
        requestDeleted.amount > 0 ? OperationType.Credit : OperationType.Debit,
        null,
      ),
    });
    allDocuments.push(documentDeleted);
    documentRecurring = documentsRepo.create({
      amount: debitRecurringWithDoc.amount,
      publicId,
      email,
      user: debitRecurringWithDoc.user,
      request: debitRecurringWithDoc,
      year: dataYear,
      month: dataMonth,
      status: GetDocumentStatusByStage(
        DocumentStage.Ready,
        OperationType.Debit,
        null,
      ),
      stage: DocumentStage.Client,
    });
    allDocuments.push(documentRecurring);
    await documentsRepo.save(allDocuments);
  }
  return {
    allDocuments, documentPending, documentPosted, documentDeleted, documentRecurring,
  };
}

const allBankData: BankDatum[] = [];
let bankDataClient: BankDatum;
let bankDataClientNotPreferred: BankDatum;
const allReceivingBanks: ReceivingBank[] = [];
let Bank1: ReceivingBank;
let Bank2: ReceivingBank;
let Bank3: ReceivingBank;
// let bankDataClient2: BankData;
let bankDataInited = false;
export async function createSaveAndGetTestBankAccountData(bankDataRepo: Repository<BankDatum>) {
  if (!bankDataRepo) throw new Error('Could not create test bank data because the repo was null or undefined');
  if (!usersInited) throw new Error('Could not create test operations data because users have not been initialized.');
  if (!bankDataInited) {
    bankDataInited = true;
    Bank1 = { id: 1, bankName: 'Bank 1' } as ReceivingBank;
    Bank2 = { id: 2, bankName: 'Bank 2' } as ReceivingBank;
    Bank3 = { id: 3, bankName: 'Bank 3' } as ReceivingBank;
    bankDataClientNotPreferred = bankDataRepo.create({
      user: client,
      address: DefaultApplicantAddress,
      accountEnding: '4321',
      accountName: client.displayName,
      preferred: false,
      DCAF: 'https://sontocoholdings',
      uuid: v4(),
    });
    allBankData.push(bankDataClientNotPreferred);
    bankDataClient = bankDataRepo.create({
      user: client,
      address: DefaultApplicantAddress,
      accountEnding: '7890',
      accountName: client.displayName,
      preferred: true,
      DCAF: 'https://sontocoholdings',
      uuid: v4(),
    });
    allBankData.push(bankDataClient);
    // bankDataClient2 = bankDataRepo.create({
    //   user: client2,
    //   accountEnding: '2345',
    //   accountName: client2.displayName,
    //   preferred: true,
    // });
    // allBankData.push(bankDataClient2);
    await bankDataRepo.save(allBankData);
  }
  return {
    allBankData, bankDataClient, bankDataClientNotPreferred, Bank1, Bank2, Bank3,
    /* bankDataClient2 */ };
}

const statements: Statement[] = [];
const trades: Trade[] = [];
let statementsInited = false;
export async function createSaveAndGetTestStatementData(statementsRepo: Repository<Statement>, tradesRepo: Repository<Trade>) {
  if (!statementsRepo || !tradesRepo) throw new Error('Could not create test statement data because the statement or trade repo was null or undefined');
  if (!usersInited || !requestsInited || !operationsInited) { throw new Error('Could not create test statement data because test users, requests or operations have not been initialized'); }
  if (!statementsInited) {
    statementsInited = true;
    const perFee = 30;
    const fmFee = 25;
    const percentage = 100;
    const modality = Modality.Compounding;
    const deleted = false;

    const createdId = administrator.id;
    const getCalculatedProps = (account: User, y: number, month: number) => {
      let endBalance = 0;
      let monthlyDividend = 0;
      let gainLoss = 0;

      // Find this year/month's statement's opening balance by looking for previous month statements
      let openingBalance = 0;
      const prevStatement = statements.length && statements.reduce((currentPreviousStatement, next) => {
        if (next.deleted || next.userId !== account.id) return currentPreviousStatement;
        const potentialPreviousStatement = DateTime.fromObject({ year: next.year, month: next.month });
        const thisStatement = DateTime.fromObject({ year: y, month });
        if (potentialPreviousStatement.equals(thisStatement.minus({ months: 1 }))) {
          return next;
        }
        return currentPreviousStatement;
      }, null);
      openingBalance = prevStatement?.endBalance || account.openingBalance || 0;

      // Calculate the end balance by summing the operations and multiplying the trade interest
      const totalOps = allOperations.reduce((total, {
        userId, month: opMonth, year: opYear, amount, deleted: opDeleted,
      }) => {
        if (!opDeleted && userId === account.id && y === opYear && month === opMonth) {
          return chain(total).add(amount).done();
        }
        return total;
      }, 0);
      gainLoss = openingBalance > 0 ? trades.reduce((total, {
        deleted: tradeDeleted, year: tradeYear, month: tradeMonth, interest,
      }) => {
        if (!tradeDeleted && y === tradeYear && month === tradeMonth) {
          const tradeGainLoss = chain(interest)
            .divide(100)
            .multiply(openingBalance)
            .done();
          return chain(total).add(tradeGainLoss).done();
        }
        return total;
      }, 0) : 0;
      monthlyDividend = openingBalance > 0 ? chain(gainLoss).divide(openingBalance).multiply(100).done() : 0;
      endBalance = chain(openingBalance).add(gainLoss).add(totalOps).done();

      return { endBalance, monthlyDividend, gainLoss };
    };

    const tradeData = [];
    await Promise.all(tradeData.map(async ({
      day: d, month: m, year: y, trade: currency, interest,
    }) => trades.push(
      await tradesRepo.save(tradesRepo.create({
        year: y,
        month: m,
        day: d,
        currency,
        interest,
        createdId,
        ...getCreated(y, m, d),
        deleted,
        published: true,
      })),
    )));
    for (let month = 1; month < 4; month += 1) {
      const statement = statementsRepo.create({
        user: client,
        year: dataYear,
        month,
        perfFee: perFee,
        fmFee,
        percentage,
        modality,
        deleted,
        createdId,
        ...getCalculatedProps(client, dataYear, month),
        ...getCreated(dataYear, month + 1), // statements are created on the month after the statement month
      });
      statements.push(statement);
      const statement2 = statementsRepo.create({
        user: client2,
        year: dataYear,
        month,
        perfFee: perFee,
        fmFee,
        percentage,
        modality,
        deleted,
        createdId,
        ...getCalculatedProps(client2, dataYear, month),
        ...getCreated(dataYear, month + 1), // statements are created on the month after the statement month
      });
      statements.push(statement2);
    }
    await statementsRepo.save(statements);
  }
  return { statements, trades };
}

const applications: Application[] = [];
let applicationsInited = false;
export async function creatSaveAndGetTestApplicationsData(applicationsRepo: Repository<Application>) {
  try {
    if (applicationsInited) return { applications };
    if (!usersInited) { throw new Error('Could not create test application data because test users have not been initialized'); }

    const appForManagerClient = applicationsRepo.create({
      manager,
      managerEmail: manager.email,
      managerName: manager.username,
      authEmail: client.email,
      appPIN: '111111',
      dateCreated: DateTime.now().valueOf(),
      entityType: ApplicantEntityType.Individual,
      uuid: v4(),
    });
    applications.push(appForManagerClient);
    const appForManager2Client2 = applicationsRepo.create({
      manager: manager2,
      managerName: manager2.username,
      managerEmail: manager2.email,
      authEmail: client2.email,
      appPIN: '222222',
      dateCreated: DateTime.now().valueOf(),
      entityType: ApplicantEntityType.Corporation,
      uuid: v4(),
    });
    applications.push(appForManager2Client2);
    await applicationsRepo.save(applications);
    applicationsInited = true;
    return { applications, appForManagerClient, appForManager2Client2 };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return { applications: [] };
  }
}

const getValidAddress: () => IApplicantAddress = () => ({
  ...DefaultApplicantAddress,
  line1: 'Test line 1',
  line2: 'Test line 2',
  city: 'Test city',
  province: 'Test province',
  country: 'US',
  postal: 'Test postal',
});

const getValidDoB: () => IApplicantBirthDate = () => ({
  year: 1950,
  month: 1,
  day: 1,
});

const getValidIndividualContact: () => IContactInfo = () => usersInited && ({
  ...DefaultContactInfo,
  name: client.name,
  lastName: client.lastname,
  identificationNumber: 'Test IDN1234',
  legalAddress: getValidAddress(),
  mailingAddress: getValidAddress(),
  dateOfBirth: getValidDoB(),
  phone: '+14045503491',
  email: client.email,
});

export const getValidApplication: () => IApplication = () => ({
  ...DefaultApplication,
  applicantContact: getValidIndividualContact(),
  representativeContact: getValidIndividualContact(),
  taxCountry: 'US',
  incomeSize: USDValueBracket.OneK,
  financialCommitments: USDValueBracket.FiveK,
  financialAssets: USDValueBracket.TenK,
  financialLiabilities: USDValueBracket.MillPlus,
  expectedInvestmentLengthInYears: 5,
});
