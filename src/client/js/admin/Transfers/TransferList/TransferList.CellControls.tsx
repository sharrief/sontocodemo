import React from 'react';
import { Cell } from 'react-table';
import { DateTime as Luxon } from 'luxon';
import { currency, getIconByRequestStatus } from '@helpers';
import TransactionProgressBar from '@components/Transfers/TransactionProgressBar';
import { Activity as ActivityLabels } from '@client/js/labels';
import Row from 'react-bootstrap/esm/Row';
import Col from 'react-bootstrap/esm/Col';
import {
  TransferListRow,
} from '@admin/Transfers/TransferList';
import { chain } from 'mathjs';

export const RequestID = React.memo(Object.assign(({ value: id }: Cell<TransferListRow, TransferListRow['id']>) => (
  <span>{id}</span>
)));

export const Account = React.memo(function Account(
  {
    value: {
      displayName,
    },
  }: Cell<TransferListRow, TransferListRow['account']>,
) {
  return (
        <span>{displayName}</span>
  );
});

export const Manager = React.memo(function Manager(
  {
    value: {
      userName,
    },
  }: Cell<TransferListRow, TransferListRow['manager']>,
) {
  return (
        <span>{userName}</span>
  );
});

export const Amount = React.memo(Object.assign(({ value: amount }: Cell<TransferListRow, TransferListRow['amount']>) => (<span className={amount >= 0 ? 'text-success' : ''}>{currency(amount)}</span>), { displayName: 'AmountCtrl' }));

export const DateTime = React.memo(function DateTime({ value: date }: Cell<TransferListRow, number>) {
  return (<span>{date ? Luxon.fromMillis(date).toLocaleString(Luxon.DATETIME_MED) : 'Not yet updated'}</span>);
});

export const Status = React.memo(function Status({ value: status }: Cell<TransferListRow, TransferListRow['status']>) {
  return getIconByRequestStatus(status);
});
export const StageCell = React.memo(function StageCell(
  {
    value: {
      stage,
    },
  }: Cell<TransferListRow, TransferListRow['document']>,
) {
  return (stage
    ? <TransactionProgressBar transaction={{ stage }} />
    : <span>{ActivityLabels.NoDocument}</span>);
});
export const PostedDate = React.memo(function PostedDate(
  {
    row: {
      values: {
        amount,
      },
    },
    value: operations,
  }: Cell<TransferListRow, TransferListRow['posted']>,
) {
  const opsCopy = [...operations] // sort mutates the array otherwise
    .sort(({ id: a }, { id: b }) => (a > b ? -1 : 1));
  const [latest] = opsCopy;
  if (!latest) {
    return <span></span>;
  }
  const { day, month, year } = latest;
  const diff = chain(latest.amount).subtract(amount).abs().done();
  const amountFormatted = ` | ${currency(latest.amount)}`;

  return <span>{Luxon.fromObject({ day, month, year }).toLocaleString(Luxon.DATE_SHORT)}{diff ? amountFormatted : ''} </span>;
});

export const EffectiveDate = React.memo(function EffectiveDate(
  {
    value: { date, posted },
  }: Cell<TransferListRow, TransferListRow['effectiveTradeMonth']>,
) {
  return posted ? <span>{date}</span> : <span>({date})</span>;
});
