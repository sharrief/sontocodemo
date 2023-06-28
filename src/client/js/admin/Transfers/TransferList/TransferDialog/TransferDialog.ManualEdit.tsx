import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { RequestActions as labels, PostRequestDialog as postLabels } from '@client/js/labels';
import ConfirmationDialog from '@client/js/components/ConfirmationDialog';
import {
  Col,
  Row,
  Form,
  InputGroup,
  Button,
  Dropdown,
} from 'react-bootstrap/esm';
import {
  DocumentStage, GetDocumentStatusByStage, OperationType, RequestStatus, RoleName,
} from '@interfaces';
import { currency } from '@client/js/core/helpers';
import { $enum } from 'ts-enum-util';
import {
  getUserInfo, handleTransferUpdate, useBankAccounts, useDocument, useRequest, useUser,
} from '@client/js/admin/admin.store';
import { API } from '@api';
import { Currency } from '@client/js/components/Numbers';
import BankInfoSelector from '@client/js/components/BankInfo.Selector';

function ManualEditPrompt(props: {
  requestId: number;
  showing: boolean;
  hide: () => void;
}) {
  const { requestId, showing, hide } = props;
  const dispatch = useDispatch();
  const { request, requestLoading } = useRequest(requestId, dispatch);
  const {
    id, type,
  } = request;
  const [status, setRequestStatus] = useState(request.status);
  const [bankAccountUUID, setBankAccountUUID] = useState(request.bankAccountUUID);
  const [rawAmount, setRawAmount] = useState(request.amount);
  const handleWireAmountChange = (a: number) => {
    if (type === OperationType.Credit) {
      setRawAmount(Math.max(Math.abs(a), 0));
    } else {
      setRawAmount(Math.min(-Math.abs(a), 0));
    }
  };
  useEffect(() => {
    setRequestStatus(request.status);
    setBankAccountUUID(request.bankAccountUUID);
    setRawAmount(request.amount);
  }, [request]);

  const { account, accountLoading } = useUser(request?.userId);
  const { bankAccounts, bankAccountsLoading } = useBankAccounts(account?.accountNumber, dispatch);
  const selectedBankAccount = bankAccounts.find(({ uuid }) => uuid === request?.bankAccountUUID) || bankAccounts.find(({ preferred }) => preferred);

  const { document, documentLoading } = useDocument(requestId, dispatch);
  const {
    id: docId,
  } = document;
  const [stage, setDocumentStage] = useState(document.stage);
  const [notes, setDocumentStatus] = useState(document.status);
  const [link, setDocumentLink] = useState(document.documentLink);
  useEffect(() => {
    setDocumentStage(document.stage);
    setDocumentStatus(document.status);
    setDocumentLink(document.documentLink);
  }, [document]);
  useEffect(() => setDocumentStatus(GetDocumentStatusByStage(stage, type, selectedBankAccount?.accountEnding)), [stage]);

  const amount = currency(rawAmount);
  const [saving, setSaving] = useState(false);
  const busy = (requestLoading || accountLoading || documentLoading || bankAccountsLoading) || saving;

  const cancelChanges = () => {
    setRequestStatus(request.status);
    setDocumentStage(document.stage);
    setDocumentStatus(document.status);
    setDocumentLink(document.documentLink);
    hide();
  };
  const requestChanged = status !== request.status
  || rawAmount !== request.amount
  || bankAccountUUID !== request.bankAccountUUID;
  const docChanged = (document
    ? (stage !== document.stage
      || notes !== document.status
      || link !== document.documentLink)
    : false);

  const saveChanges = async () => {
    setSaving(true);
    // eslint-disable-next-line prefer-const
    if (requestChanged) {
      const response = await API.Requests.Update.post({
        id: requestId, status, bankAccountUUID, amount: rawAmount,
      });
      handleTransferUpdate(response, dispatch);
    }
    if (docChanged) {
      const response = await API.Documents.Update.post({
        id: document.id, stage, status: notes, documentLink: link,
      });
      handleTransferUpdate(response, dispatch);
    }
    setSaving(false);
    hide();
  };

  const canSave = requestChanged || docChanged;

  return <ConfirmationDialog
      show={showing}
      title={labels.manualEditTitle({
        status: request.status, type, id, docId, amount,
      })}
      cancelLabel={labels.Cancel}
      onCancel={cancelChanges}
      acceptLabel={labels.Confirm}
      canAccept={canSave}
      onAccept={saveChanges}
      busy={busy}
    >
      <Row>
        <Col><h5>Request</h5></Col>
      </Row>
      <Row className='mb-2'>
        {status && <Form.Group as={Col}>
          <Form.Label htmlFor='status'>{labels.status}</Form.Label>
          <InputGroup>
            <Form.Control
              name='status'
              disabled={busy}
              value={status}
              as='select'
              onChange={({ target: { value } }) => setRequestStatus(value as RequestStatus)}
            >
              {$enum(RequestStatus).map((s, index) => <option key={index} value={s}>{s}</option>)}
            </Form.Control>
          </InputGroup>
        </Form.Group>}
        <Form.Group as={Col}>
          <Form.Label htmlFor='amount'>{type === OperationType.Credit ? postLabels.receivedAmount : postLabels.sentAmount}</Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Currency
              disabled={busy}
              value={rawAmount}
              onValueChange={
                (({ floatValue }) => handleWireAmountChange(floatValue))}
              />
            </InputGroup>
          </Form.Group>
      </Row>
      <Row>
        <BankInfoSelector
          accountNumber={account?.accountNumber}
          bankAccountUUID={bankAccountUUID}
          setBankAccountUUID={setBankAccountUUID}
        />
      </Row>
      {!!docId && <><Row className='mt-3'>
        <Col><h5>Document</h5></Col>
      </Row>
      <Row>
        <Form.Group as={Col}>
          <Form.Label htmlFor='stage'>{labels.stage}</Form.Label>
          <InputGroup>
            <Form.Select
              name='stage'
              disabled={busy}
              value={stage ?? ''}
              onChange={({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => setDocumentStage(value as DocumentStage)}
            >
              {$enum(DocumentStage).map((s, index) => <option key={index} value={s}>{s}</option>)}
            </Form.Select>
          </InputGroup>
        </Form.Group>
        <Form.Group as={Col}>
          <Form.Label htmlFor='link'>{labels.link}</Form.Label>
          <InputGroup>
            <Form.Control
              name='link'
              disabled={busy}
              value={link ?? ''}
              onChange={({ target: { value } }) => setDocumentLink(value)}
            />
          </InputGroup>
        </Form.Group>
        </Row>
        <Row>
        <Form.Group as={Col}>
          <Form.Label htmlFor='notes'>{labels.notes}</Form.Label>
          <InputGroup>
            <Form.Control
              name='notes'
              disabled={busy}
              value={notes ?? ''}
              as='textarea'
              rows={5}
              onChange={({ target: { value } }) => setDocumentStatus(value)}
            />
          </InputGroup>
        </Form.Group>
      </Row></>}
    </ConfirmationDialog>;
}

function manualEdit(props: {
  requestId: number;
  uiType: 'button' | 'menuItem';
}) {
  const { requestId, uiType } = props;
  const { userinfo } = getUserInfo();
  const { role } = userinfo ?? { };
  const [showing, setShowing] = useState(false);
  const busy = !requestId;
  const showEditDialog = () => setShowing(true);

  if (role !== RoleName.admin) return null;
  if (uiType === 'button') {
    return <>
    <ManualEditPrompt
      requestId={requestId}
      showing={showing}
      hide={() => setShowing(false)}
    />
    <Button
      disabled={busy}
      variant='outline-primary'
      onClick={showEditDialog}
    >{labels.manualEdit}
    </Button>
    </>;
  }

  if (uiType === 'menuItem') {
    return <>
  <ManualEditPrompt
    requestId={requestId}
    showing={showing}
    hide={() => setShowing(false)}
  />
  <Dropdown.Item
    disabled={busy}
    onClick={showEditDialog}
  >{labels.manualEdit}
  </Dropdown.Item>
  </>;
  }
  return null;
}

export const ManualEdit = React.memo(manualEdit);
