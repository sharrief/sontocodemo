import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import {
  useDispatch,
} from 'react-redux';
import { currency } from '@helpers';
import {
  OperationType, RequestStatus,
} from '@interfaces';
import { AlertVariant } from '@store/state';
import { DateTime } from 'luxon';
import { chain } from 'mathjs';
import ActivityList from '@client/js/components/Transfers/TransferActivity';
import TransactionHistory from '@components/Transfers/TransactionHistory';
import { useAccount, useActiveRequests, useStatements } from '@admin/admin.store';
import { dashboard } from '@store/reducers';
import { v4 } from 'uuid';
import AddCircle from '@mui/icons-material/AddCircle';
import RemoveCircle from '@mui/icons-material/RemoveCircle';
import {
  useNavigate, useParams,
  Link as RouterLink,
} from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import useSiteMetadata from '@client/js/core/useSiteMetadata';
import { transactionLabels } from '../../labels';
import DepositDialog from './DepositDialog';
import WithdrawDialog from './WithdrawDialog';

export const TransferDialog = {
  Deposit: 'deposit',
  Withdraw: 'withdraw',
};

function TransactionsComponent(props: {
  path?: string;
  accountNumber: string;
}) {
  const { path, accountNumber } = props;
  const { requestsDisabled } = useSiteMetadata();
  const { requests: operationRequests, requestsLoading: loadingOperationRequests } = useActiveRequests(accountNumber);
  const { statements } = useStatements(accountNumber);
  const { account } = useAccount(accountNumber);
  const navigate = useNavigate();
  const { dialog } = useParams<{ dialog: string }>();
  const depositDialogLink = TransferDialog.Deposit;
  const withdrawDialogLink = TransferDialog.Withdraw;
  const showDepositDialog = dialog === TransferDialog.Deposit;
  const showWithdrawDialog = dialog === TransferDialog.Withdraw;
  const dialogClosed = () => {
    if (path) {
      navigate(`../${path}`);
    }
  };
  const [latestStatement] = statements?.sort((a, b) => {
    const dateA = DateTime.fromObject({ month: a.month, year: a.year });
    const dateB = DateTime.fromObject({ month: b.month, year: b.year });
    if (dateA.valueOf() > dateB.valueOf()) return -1;
    return 1;
  }) || [];
  const latestStatementDate = latestStatement ? DateTime.fromObject({ month: latestStatement.month, year: latestStatement.year }) : DateTime.fromObject({ month: account.obMonth, year: account.obYear }).minus({ month: 1 });

  const dispatch = useDispatch();
  const handleMessage = (args: { message?: string; error?: string }) => dispatch(dashboard.actions.addAlert({
    message: args?.error || args?.message,
    type: args?.error ? AlertVariant.Danger : AlertVariant.Primary,
    id: v4(),
    show: true,
  }));
  const pendingCredits = operationRequests.filter(({ type, status }) => (
    (type === OperationType.Credit) && ([RequestStatus.Pending, RequestStatus.Recurring].includes(status))
  ));
  const postedCredits = operationRequests.filter(({ type, status }) => (
    (type === OperationType.Credit) && ([RequestStatus.Approved].includes(status))
  ));
  const pendingDebits = operationRequests.filter(({ type, status }) => (
    (type === OperationType.Debit) && ([RequestStatus.Pending, RequestStatus.Recurring].includes(status))
  ));
  const postedDebits = operationRequests.filter(({ type, status }) => (
    (type === OperationType.Debit) && ([RequestStatus.Approved].includes(status))
  ));
  const pendingCreditsAmount = pendingCredits
    .reduce((total, req) => chain(req.amount).add(total).done(), 0);
  const postedCreditsAmount = postedCredits
    .reduce((total, req) => {
      const op = req.operations.find(({ month, year }) => DateTime.fromObject({ month, year }) > latestStatementDate);
      return (total + (op?.amount || 0));
    }, 0);
  const pendingDebitsAmount = pendingDebits
    .reduce((total, req) => chain(req.amount).add(total).done(), 0);
  const postedDebitsAmount = postedDebits
    .reduce((total, req) => {
      const op = req.operations.find(({ month, year }) => DateTime.fromObject({ month, year }) > latestStatementDate);
      return (total + (op?.amount || 0));
    }, 0);

  const pendingTransfersAmount = chain(pendingCreditsAmount).add(pendingDebitsAmount).done();
  const postedTransfersAmount = chain(postedCreditsAmount).add(postedDebitsAmount).done();
  const pendingBalance = latestStatement && (pendingTransfersAmount || postedTransfersAmount) && (chain(latestStatement.endBalance).add(postedTransfersAmount).add(pendingTransfersAmount).done());
  return (
    <div className='mb-3'>
      <Row>
        <Col xs={3}>
          <div className='d-flex flex-column'>
            <span className='fs-6'>
              {transactionLabels.PendingActivity}
            </span>
            <span className='fs-6'>
              {currency(pendingTransfersAmount)}
            </span>
          </div>
        </Col>
        <Col xs={3}>
          <div className='d-flex flex-column'>
            <span className='fs-6'>
              {transactionLabels.PostedActivity}
            </span>
            <span className='fs-6'>
              {currency(postedTransfersAmount)}
            </span>
          </div>
        </Col>
        {pendingBalance ? <Col xs={6}>
          <div className='d-flex flex-column align-items-end align-items-md-start'>
            <span className='fs-6'>
              {transactionLabels.PendingBal}
            </span>
            <span className='fs-6'>
              {currency(pendingBalance)}
            </span>
          </div>
        </Col> : null}
      </Row>
      <hr />
      <Row className='mb-2'>
        <Col xs={6} md='auto' className='d-flex align-items-center'>
          <RouterLink
            to={depositDialogLink}
            style={{ textDecoration: 'none' }}
          >
            <Button
              className='d-flex align-items-center w-100 justify-content-center justify-content-md-start'
              disabled={requestsDisabled}
            >
              <AddCircle className='me-2' />{transactionLabels.Deposit}
            </Button>
          </RouterLink>
          <DepositDialog
            show={showDepositDialog}
            accountNumber={accountNumber}
            onClose={dialogClosed}
          />
        </Col>
        <Col xs={6} md='auto' className='d-flex align-items-center'>
          <RouterLink
            to={withdrawDialogLink}
            style={{ textDecoration: 'none' }}
          >
            <Button
              className='d-flex align-items-center w-100 justify-content-center justify-content-md-start'
              disabled={requestsDisabled}
            >
              <RemoveCircle className='me-2' />{transactionLabels.Withdraw}
            </Button>
          </RouterLink>
          <WithdrawDialog
            accountNumber={accountNumber}
            show={showWithdrawDialog}
            onClose={dialogClosed}
          />
        </Col>
        {requestsDisabled && <Col xs={12} md='auto' className='d-flex align-items-center'>
          <Alert variant='info' className='m-0'>We have temporarily paused transfers while we work on making the latest statement available.</Alert>
        </Col>}
      </Row>
      <Row>
        <Col>
          <ActivityList
            handleMessage={handleMessage}
            accountNumber={accountNumber}
            requests={operationRequests}
            loading={loadingOperationRequests}
            latestStatementDate={latestStatementDate}
          />
        </Col>
      </Row>
      <Row className='mt-2'>
        <Col>
          <TransactionHistory
            accountNumber={accountNumber}
          />
        </Col>
      </Row>
      <hr />
    </div>
  );
}

export default TransactionsComponent;
