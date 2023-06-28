import {
  IRequest, IUserTrimmed, IDocument, RequestStatus, OperationType, DocumentStage, IBankDatumTrimmed, IOperation, IManager,
} from '@interfaces';
import { DateTime } from 'luxon';
import { EffectiveMonthFormat, RequestParams } from 'shared/api/admin.api';
import { TransferListRow } from './index';

export function mapOperationRequestToTableRow(
  {
    request, account, manager, document, userDocumentDatum, operations, bankAccounts,
  }: {request?: IRequest; account?: IUserTrimmed; manager?: IManager; document?: IDocument; userDocumentDatum?: IBankDatumTrimmed; operations?: IOperation[]; bankAccounts?: IBankDatumTrimmed[]},
  requestParameters: RequestParams,
  oldRow: TransferListRow = {
    admin: false,
    id: 0,
    amount: 0,
    datetime: 0,
    status: RequestStatus.Voided,
    type: OperationType.Debit,
    wireConfirmation: '',
    bankAccountUUID: '',
    document: {
      id: 0,
      stage: DocumentStage.Requested,
      notes: '',
      lastUpdated: 0,
      link: '',
    },
    account: {},
    manager: {},
    posted: [],
    editing: false,
    dirty: false,
  },
) {
  let row: TransferListRow = oldRow;
  if (request) {
    const {
      admin,
      id,
      amount,
      datetime,
      status,
      wireConfirmation,
      bankAccountUUID,
    } = request;
    const { effectiveMonth } = requestParameters;
    const { month, year } = effectiveMonth ? DateTime.fromFormat(effectiveMonth, EffectiveMonthFormat) : { month: undefined, year: undefined };
    let effectiveTradeMonth = { posted: false, date: document ? DateTime.fromObject({ month: document.month, year: document.year }).toFormat('MMM yyyy') : 'N/A' };
    if (operations) {
      const postedOperations = operations
        .sort((a, b) => {
          const dateA = DateTime.fromObject({ month: a.month, year: a.year }).valueOf();
          const dateB = DateTime.fromObject({ month: b.month, year: b.year }).valueOf();
          // eslint-disable-next-line no-nested-ternary
          return (dateA === dateB ? 0 : (dateA > dateB ? -1 : 1));
        })
        .filter(({ requestId, deleted }) => (id === requestId && !deleted));
      if (postedOperations.length > 0) {
        row.posted = postedOperations
          .map(({
            id: opId, amount: opAmount, year, month, day, wireConfirmation: confirmation, created, createdBy,
          }) => ({
            id: opId, amount: opAmount, year, month, day, wireConfirmation: confirmation, created, createdBy,
          }));
        const mostRecent = row.posted[0];
        if (status === RequestStatus.Recurring) {
          if (effectiveMonth) {
            const recurringPostedOnParamMonth = postedOperations.find(({ month: postedMonth, year: postedYear }) => postedMonth === month && postedYear === year);
            effectiveTradeMonth = { posted: !!recurringPostedOnParamMonth, date: recurringPostedOnParamMonth ? DateTime.fromObject({ month: recurringPostedOnParamMonth.month, year: recurringPostedOnParamMonth.year }).toFormat('MMM yyyy') : 'N/A' };
          } else if (mostRecent) {
            effectiveTradeMonth = { posted: !!mostRecent, date: DateTime.fromObject({ month: mostRecent.month, year: mostRecent.year }).toFormat('MMM yyyy') };
          }
        }
        if (status === RequestStatus.Approved) effectiveTradeMonth = { posted: !!mostRecent, date: DateTime.fromObject({ month: mostRecent.month, year: mostRecent.year }).toFormat('MMM yyyy') };
      }
    }
    row = {
      ...row,
      admin,
      id,
      amount,
      datetime,
      status,
      wireConfirmation,
      bankAccountUUID,
      effectiveTradeMonth,
      type: Number(amount) > (0)
        ? OperationType.Credit
        : OperationType.Debit,
    };
  }
  if (account) {
    row.account.displayName = `${account.displayName} ${account.accountNumber}`;
    row.account.name = `${account.name} ${account.lastname}`;
    row.account.accountNumber = account.accountNumber;
    row.account.businessEntity = account.businessEntity;
    row.account.email = account.email;
    row.account.userId = account.id;
    if (manager) {
      row.manager.userName = manager.displayName;
      row.manager.email = manager.email;
    }
    if (userDocumentDatum) {
      row.account.accountEnding = userDocumentDatum.accountEnding;
      row.account.DCAF = userDocumentDatum.DCAF;
      row.account.saved = userDocumentDatum.InBofA ? 'Yes' : 'No';
    }
    if (bankAccounts) {
      row.account.bankAccounts = bankAccounts;
    }
  }
  if (document) {
    const {
      id: docId, status: docStatus, stage, documentLink, lastUpdated,
    } = document;
    row = {
      ...row,
      document: {
        id: docId,
        stage,
        notes: docStatus,
        lastUpdated,
        link: documentLink,
      },
    };
  }

  return row;
}
