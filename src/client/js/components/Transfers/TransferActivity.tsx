import React, { useState } from 'react';
import {
  IRequest,
  OperationType,
  RequestStatus,
} from '@interfaces';
import {
  Row, Col, Button, Spinner, Card,
} from 'react-bootstrap/esm';
import Cancel from '@mui/icons-material/Cancel';
import Edit from '@mui/icons-material/Edit';
import { Activity as labels, transactionLabels } from '@labels';
import { cancelRequest, makeRecurringRequest } from '@admin/admin.store';
import { DateTime } from 'luxon';
import TransferSummary from './TransactionSummary';
import ConfirmationDialog from '../ConfirmationDialog';

const TransferActivity = ({
  requests, loading, accountNumber, handleMessage, latestStatementDate,
}: {
  requests: IRequest[];
  latestStatementDate?: DateTime;
  loading: boolean;
  accountNumber: string;
  handleMessage: (args: { message: string; error: string }) => void;
}) => {
  const [cancelId, setCancelId] = useState(0);
  const [modifyId, setModifyId] = useState(0);
  const [busy, setBusy] = useState(false);
  const handleCancel = async (id: number) => {
    setCancelId(0);
    setBusy(true);
    if (id && accountNumber) {
      const cancelResult = await cancelRequest(id, accountNumber);
      handleMessage(cancelResult);
    }
    setBusy(false);
  };
  const handleMakeRecurring = async (id: number) => {
    setModifyId(0);
    setBusy(true);
    if (id && accountNumber) {
      const modifyResult = await makeRecurringRequest(id, accountNumber);
      handleMessage(modifyResult);
    }
    setBusy(false);
  };
  const cards = requests
    .map(({
      documents, ...request
    }) => (
        <Row
          key={request.id}
          className='mb-2'>
          <Col xs={12} md={10}>
            <TransferSummary
              requestId={request.id}
            />
          </Col>
          <Col xs={12} md={2}><Row className='h-100'>
            {[RequestStatus.Pending, RequestStatus.Recurring].includes(request.status)
              && <Col xs={6} md={12} className='d-flex mt-1 mt-md-0 align-items-stretch'>
                <Button onClick={() => setCancelId(request.id)} className='text-center w-100' variant='outline-secondary'><Cancel /> {labels.Cancel}</Button>
              </Col>}
            {[RequestStatus.Pending].includes(request.status) && request.type === OperationType.Debit
              && <Col xs={6} md={12} className='d-flex mt-1 mt-md-0 align-items-stretch'>
                <Button onClick={() => setModifyId(request.id)} className='text-center w-100' variant='outline-secondary'><Edit /> {labels.Modify}</Button>
              </Col>}
          </Row>
          </Col>
        </Row>
    ));
  return (
    // Using Fragment due to https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356#issuecomment-336384210
    <>
      <ConfirmationDialog
        title={`${transactionLabels.CancelRequestDialogTitle} #${cancelId}`}
        busy={busy}
        show={!!cancelId}
        onAccept={() => {
          handleCancel(cancelId);
        }}
        canAccept={true}
        acceptLabel={labels.Yes}
        onCancel={() => { setCancelId(0); }}
        cancelLabel={labels.No}
      />
      <ConfirmationDialog
        title={`${transactionLabels.ModifyingRequest} #${modifyId}`}
        busy={busy}
        show={!!modifyId}
        onAccept={() => {
          handleMakeRecurring(modifyId);
        }}
        canAccept={true}
        acceptLabel={transactionLabels.MakeRecurring}
        onCancel={() => { setModifyId(0); }}
        cancelLabel={labels.No}
      >
        <div>
          <p><strong className='fs-5'>{`Would you like to make request #${modifyId} a monthly recurring request?`}</strong></p>
          <p>{transactionLabels.MakeRecurringDetails1}</p>
          <p>{transactionLabels.MakeRecurringDetails2}</p>
          <p><strong>{transactionLabels.MakeRecurringDetails3}</strong></p>
          <p><em>{transactionLabels.ModifyOther}</em></p>
        </div>
      </ConfirmationDialog>
      <Card>
        <Card.Header>
          <div className='fs-5'>{labels.ActiveTransfers}</div>
        </Card.Header>
        <Card.Body>
          {!requests.length && !loading && <em>{labels.NoCurrentActivity}</em>}
          {cards}
          {loading && <div className='d-flex justify-content-center w-100'><Spinner animation='grow' size='sm' /></div>}
        </Card.Body>
      </Card>

    </>
  );
};

export default TransferActivity;
