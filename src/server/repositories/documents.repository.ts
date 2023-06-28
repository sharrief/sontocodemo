/* eslint-disable class-methods-use-this */
import { DateTime } from 'luxon';
import { EntityRepository, AbstractRepository } from 'typeorm';
import {
  Document, Request, User,
} from '@entities';
import {
  BankAccountStatus,
  DocumentStage, GetDocumentStatusByStage, OperationType, RequestStatus,
} from '@interfaces';
import { AppendAccountAuthorizationFilterQuery, Users } from './users.repository';

@EntityRepository(Document)
export class Documents extends AbstractRepository<Document> {
  findById(authUserId: User['id'], documentId: Document['id']) {
    let query = this.createQueryBuilder('document');
    query = query
      .where('document.id = :documentId', { documentId })
      .andWhere('document.deleted = :documentDeleted', { documentDeleted: false });
    query = query.andWhere((qb) => {
      const subQuery = qb.subQuery()
        .select('user.id').from(User, 'user');
      return `document.user_id in ${
        AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
        // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
          .setParameters({ authUserId }).getQuery()
      }`;
    });
    return query.getOne();
  }

  findByRequestId(authUserId: User['id'], requestIds: Request['id'][]) {
    if (!requestIds?.length) return (async () => [] as Document[])();
    let query = this.createQueryBuilder('document');
    query = query
      .where('document.operation_id in (:requestIds)', { requestIds })
      .andWhere('document.deleted = :documentDeleted', { documentDeleted: false });
    query = query.andWhere((qb) => {
      const subQuery = qb.subQuery()
        .select('user.id').from(User, 'user');
      return `document.user_id in ${
        AppendAccountAuthorizationFilterQuery(subQuery, authUserId)
          // Must set *subQuery* parameters manually, cannot rely on code in AppendAccountAuth...
          .setParameters({ authUserId }).getQuery()
      }`;
    });
    return query.getMany();
  }

  async create(authUserId: User['id'], { request }: {request: Request }) {
    const users = this.manager.getCustomRepository(Users);
    const [user] = await users.accounts({ authUserId, accounts: { ids: [request.userId] }, withBankData: true });
    if (!user) throw new Error(`Could not locate the user for request #${request.id} when attempting to create the document`);
    let bankAccount = user.bankAccounts?.find(({ uuid }) => uuid === request.bankAccountUUID);
    if (!bankAccount) bankAccount = user.bankAccounts?.find(({ preferred }) => preferred);
    const newDoc = new Document();
    newDoc.userId = request.userId;
    newDoc.request = request;
    newDoc.email = 'sent to client';
    newDoc.amount = request.amount;
    newDoc.month = DateTime.fromMillis(request.datetime).month;
    newDoc.year = DateTime.fromMillis(request.datetime).year;
    const isDebit = request.type === OperationType.Debit;
    newDoc.stage = (() => {
      if (request.status === RequestStatus.Voided) return DocumentStage.Cancelled;
      if (request.status === RequestStatus.Approved) {
        if (isDebit) return DocumentStage.Sent;
        return DocumentStage.Received;
      }
      if (request.status === RequestStatus.Pending || request.status === RequestStatus.Recurring) {
        if (isDebit) {
          if (bankAccount && bankAccount.status === BankAccountStatus.Validated) { return DocumentStage.Ready; }
          return DocumentStage.Review;
        }
        return DocumentStage.Waiting;
      }
      return DocumentStage.Requested;
    })();
    newDoc.status = GetDocumentStatusByStage(newDoc.stage, request.type, (bankAccount?.accountEnding));
    newDoc.publicId = 0;
    newDoc.timestamp = DateTime.now().valueOf();
    newDoc.lastUpdated = DateTime.now().valueOf();
    const result = await this.manager.createQueryBuilder(Document, 'Document').insert().values(newDoc).execute();
    if (result?.identifiers?.[0].id) {
      const savedDocument = await this.findById(authUserId, result.identifiers?.[0].id);
      return savedDocument;
    }
    throw new Error('Unable to save the new document');
  }

  async setLink(authUserId: User['id'], docId: Document['id'], link: string) {
    const document = await this.findById(authUserId, docId);
    if (!document) throw new Error(`Could not locate document with id ${docId}`);
    await this.manager.createQueryBuilder(Document, 'Document').update({
      documentLink: link,
      lastUpdated: DateTime.now().valueOf(),
    }).whereInIds([document.id]).execute();
    return document;
  }

  async update(authUserId: User['id'], update: Pick<Document, 'id'> & Partial<Pick<Document, 'month'|'year'|'amount'|'documentLink'|'stage'|'status'>>) {
    const document = await this.findById(authUserId, update.id);
    if (!document) throw new Error(`Could not locate document with id ${update.id}`);
    if (+update.amount) document.amount = update.amount;
    if (+update.month) document.month = update.month;
    if (+update.year) document.year = update.year;
    if (update.documentLink != null) document.documentLink = update.documentLink;
    if (update.stage != null) document.stage = update.stage;
    if (update.status != null) document.status = update.status;
    await this.manager.createQueryBuilder(Document, 'Document').update({
      amount: document.amount,
      month: document.month,
      year: document.year,
      documentLink: document.documentLink,
      status: document.status,
      stage: document.stage,
      lastUpdated: DateTime.now().valueOf(),
    }).whereInIds([document.id]).execute();
    return document;
  }

  async delete(authUserId: User['id'], id: Document['id']) {
    const document = await this.findById(authUserId, id);
    const { affected } = await this.manager.createQueryBuilder(Document, 'Document').update({
      deleted: true,
      lastUpdated: DateTime.now().valueOf(),
    }).whereInIds([document.id]).execute();
    return affected;
  }

  async cancel(authUserId: User['id'], id: Document['id']) {
    const document = await this.findById(authUserId, id);
    document.stage = DocumentStage.Cancelled;
    document.status = GetDocumentStatusByStage(DocumentStage.Cancelled);
    await this.manager.createQueryBuilder(Document, 'Document').update({
      stage: document.stage,
      status: document.status,
      lastUpdated: DateTime.now().valueOf(),
    }).whereInIds([document.id]).execute();
    return document;
  }
}
