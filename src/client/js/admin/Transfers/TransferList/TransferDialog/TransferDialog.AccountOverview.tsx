import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateTime } from 'luxon';
import CombinedState from '@store/state';
import { PostRequestDialog as labels } from '@labels';
import { createSelector } from 'reselect';
import Col from 'react-bootstrap/esm/Col';
import { OperationType, RequestStatus } from '@interfaces';
import { currency } from '@client/js/core/helpers';
import {
  Alert, Badge, Card, Row, Spinner,
} from 'react-bootstrap';
import Error from '@mui/icons-material/Error';

import {
  handleMessageAndError,
  useActiveRequests, useManager, useOperations, useOperationsByRequest, useRequest, useStatements, useUser,
} from '@admin/admin.store';
import { chain, equal } from '@numbers';

import { AccountActions } from '@client/js/admin/Accounts/AccountActions';

const select = createSelector([
  (state: CombinedState) => state.transferDialog.balancePreview,
  (state: CombinedState) => state.transferDialog.request,
  (state: CombinedState) => state.transferDialog.account,
  // only refresh component if these items are loading

  (state: CombinedState) => {
    const {
      year, month, wireAmount, adjustment,
    } = state.transferDialog?.transferConfirmation;
    return {
      year, month, wireAmount, adjustment,
    };
  },
], (balancePreview, request, account, dialog) => ({
  balancePreview, request, account, dialog,
}));

export function AccountOverview(props: {
  requestId: number;
}) {
  const { requestId } = props;
  const {
    dialog: {
      year: dialogYear, month: dialogMonth, wireAmount, adjustment,
    },
  } = useSelector(select);
  const dispatch = useDispatch();
  const handleMessage = (arg: { message: string; error: string }) => handleMessageAndError(arg, dispatch);
  const { request, requestLoading } = useRequest(requestId);
  const { type } = request;
  const { account, accountLoading } = useUser(request?.userId);
  const { manager, managerLoading } = useManager(account?.accountNumber);
  const { requests, requestsLoading, refreshActiveRequests } = useActiveRequests(account?.accountNumber);
  const handleCloseRequestDialog = () => refreshActiveRequests();
  const { operations, operationsLoading } = useOperations(account?.accountNumber);
  const { operations: requestOperations, operationsLoading: requestOperationsLoading } = useOperationsByRequest(requestId);
  const { statements, statementsLoading, refreshStatements } = useStatements(account?.accountNumber);
  const onPopulationComplete = () => refreshStatements();

  const ready = !(requestLoading || requestsLoading || statementsLoading || operationsLoading || requestOperationsLoading);

  const thisRequestPostedAs = requestOperations.find(({ month, year }) => month === dialogMonth && year === dialogYear);
  const thisRequestAmount = thisRequestPostedAs?.amount || chain(wireAmount).add(adjustment).done();
  const effectiveEndOf = (DateTime.fromObject({ month: dialogMonth, year: dialogYear }) || DateTime.now().startOf('month'));
  const { month, year } = effectiveEndOf;

  const openingMonth = DateTime.fromObject({ month: account.obMonth, year: account.obYear });
  const effectiveEndOfIsOpening = effectiveEndOf.valueOf() === openingMonth.valueOf();
  const LoadingSpinner = () => <Spinner animation='grow' size='sm' className='align-middle' />;
  const ellipsis = '...';
  const otherTransfers = requests.filter(({ id }) => id !== requestId);
  const otherPendingTransfers = otherTransfers.filter(({ id, status }) => id !== requestId && [RequestStatus.Pending, RequestStatus.Recurring].includes(status));
  const pendingTransfersAmount = otherPendingTransfers.reduce((total, d) => total + d.amount, 0);
  const pendingTransfersAmountFormatted = !requestsLoading ? currency(pendingTransfersAmount) : ellipsis;
  const effectiveEndOfOperations = operations.filter(({ requestId: reqId, month: oM, year: oY }) => requestId !== reqId && oM === month && oY === year);
  const postedTransfersAmount = effectiveEndOfOperations.reduce((total, d) => total + d.amount, 0);
  const effectiveEndOfStartBalance = effectiveEndOfIsOpening
    ? account.openingBalance
    : statements.find(({ month: m, year: y }) => {
      const { month: mp, year: yp } = DateTime.fromObject({ month: m, year: y });
      return effectiveEndOf.minus({ month: 1 }).month === mp && effectiveEndOf.minus({ month: 1 }).year === yp;
    })?.endBalance;
  const effectiveEndOfStatement = statements.find(({ month: m, year: y }) => {
    const { month: mp, year: yp } = DateTime.fromObject({ month: m, year: y });
    return effectiveEndOf.month === mp && effectiveEndOf.year === yp;
  });
  const effectiveEndOfEndBalance = effectiveEndOfStatement?.endBalance;
  const effectiveEndOfGainLoss = effectiveEndOfStatement?.gainLoss || 0;
  const pendingBalance = chain(effectiveEndOfStartBalance || 0)
    .add(pendingTransfersAmount || 0)
    .add(postedTransfersAmount || 0)
    .add(effectiveEndOfGainLoss || 0)
    .add(thisRequestAmount || 0)
    .done();
  const pendingBalanceInvalid = ready && pendingBalance < 0 && type === OperationType.Debit;
  const diff = effectiveEndOfStatement && chain(effectiveEndOfEndBalance).subtract(pendingBalance).done();
  const pendingNotStatementBalance = effectiveEndOfStatement
    ? !equal(diff + 1, 1)
    : false;

  const previousMonthBalanceFormatted = (() => {
    if (!statementsLoading) {
      return (!Number.isNaN(+effectiveEndOfStartBalance) ? currency(effectiveEndOfStartBalance) : labels.unavailable);
    }
    return ellipsis;
  })();
  const PostedTransfers = (() => {
    if (!requestsLoading) {
      return currency(postedTransfersAmount);
    }
    return ellipsis;
  })();

  const GainLoss = (() => {
    if (!statementsLoading) {
      return (!Number.isNaN(+effectiveEndOfGainLoss) ? currency(effectiveEndOfGainLoss) : labels.unavailable);
    }
    return ellipsis;
  })();

  const StatementBalance = (() => {
    if (!requestsLoading) {
      if (effectiveEndOfEndBalance != null) return <>{currency(effectiveEndOfEndBalance)}</>;
      if (effectiveEndOfStartBalance == null) return <>{labels.cannotCalculateBalance}</>;
    }
    return <>{ellipsis}</>;
  })();

  const PendingBalance = (() => {
    if (!requestsLoading) {
      return <>{currency(pendingBalance)} {!(pendingBalance > 0) && <Error />}</>;
    }
    return <>{ellipsis}</>;
  })();

  const accountContactName = `${account?.name} ${account?.lastname}`;
  const accountName = `${account.businessEntity || accountContactName} ${account.accountNumber}`;
  const dateOpened = DateTime.fromObject({ month: account.obMonth, year: account.obYear }).toFormat('MMMM yyyy');
  const accountContact = `${accountContactName} <${account.email}> (${account.id})`;
  const accountManager = `${manager.displayName} <${manager.email}>`;

  return (
    <Card className='mb-2'>
      <Card.Header>
        <h5>{labels.relevantAccountInformation} {!ready && <LoadingSpinner />}</h5>
      </Card.Header>
      <Card.Body>
        {account
          && <Row className='mb-2'>
            <Col>
              <Row>
                <Col>
                  <strong>{labels.accountHolder}</strong>
                  <div>{accountLoading ? ellipsis : accountName}</div>
                </Col>
                <Col>
                  <strong>{labels.dateOpened}</strong>
                  <div>{accountLoading ? ellipsis : dateOpened}</div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <strong>{labels.accountContact}</strong>
                  <div>{accountLoading ? ellipsis : accountContact}</div>
                </Col>
                {manager && <Col>
                  <strong>{labels.accountManager}</strong>
                  <div>{managerLoading ? ellipsis : accountManager}</div>
                </Col>}
              </Row>
            </Col>
          </Row>}
        <Row className='mb-2'>
          <Col>
            <AccountActions
              accountNumber={account.accountNumber}
              disabled={!ready}
              requestId={requestId}
              onPopulationComplete={onPopulationComplete}
            />
          </Col>
        </Row>
        <hr />
        <span className='fs-6'>{effectiveEndOf.toFormat('MMMM yyyy')}</span>
        <Row>
          <Col>
            {labels.startBalance}:
          </Col>
          <Col>
            {previousMonthBalanceFormatted}
          </Col>
        </Row>
        <Row>
          <Col>
            {labels.thisTransfer}:
          </Col>
          <Col>
            {currency(thisRequestAmount)}
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={6}>
            {labels.pendingTransfers}:
          </Col>
          <Col xs={12} md={6}>
            {pendingTransfersAmountFormatted} {!!otherPendingTransfers.length && <Badge bg='info'>{otherPendingTransfers.length}</Badge>}
          </Col>
        </Row>
        <Row>
          <Col>
            {labels.postedTransfers}:
          </Col>
          <Col>
            {PostedTransfers} {!!effectiveEndOfOperations.length && <Badge bg='info'>{effectiveEndOfOperations.length}</Badge>}
          </Col>
        </Row>
        <Row>
          <Col>
            {labels.gainLoss}:
          </Col>
          <Col>
            {GainLoss}
          </Col>
        </Row>
        <hr />
        <Row>
          <Col>
            {labels.pending}:
          </Col>
          <Col>
            <div className={(effectiveEndOfStatement && pendingNotStatementBalance) ? 'text-danger' : ''}>
              {PendingBalance}
            </div>
          </Col>
        </Row>
        {effectiveEndOfStatement && <Row>
          <Col>
            {labels.endBalance}:
          </Col>
          <Col>
            <div>
              {StatementBalance}
            </div>
          </Col>
        </Row>}
        {pendingBalanceInvalid
          && <><hr />
            <Row>
              <Col>
                <Alert variant='danger'>{labels.errorBalanceBelowZero}</Alert>
              </Col>
            </Row></>}
        {(pendingNotStatementBalance && !thisRequestPostedAs)
          && <><hr />
            <Row>
              <Col>
                <Alert variant='danger'>{labels.errorInvalidFutureStatements(effectiveEndOf.toFormat('MMMM yyyy'))}</Alert>
              </Col>
            </Row></>}
      </Card.Body>
    </Card>
  );
}
