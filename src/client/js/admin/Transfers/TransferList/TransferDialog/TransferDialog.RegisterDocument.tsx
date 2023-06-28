import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { RequestActions as labels } from '@client/js/labels';
import {
  Accordion,
  Button, Card, Dropdown, Form, FormGroup, FormSelect,
} from 'react-bootstrap';
import {
  BankAccountStatus, OperationType, RoleName,
} from '@interfaces';
import ConfirmationDialog from '@client/js/components/ConfirmationDialog';
import { creditRequestedEmailTemplate, distributionRequestedEmailTemplate, Labels as EmailLabels } from '@email';
import {
  getUserInfo, handleDocumentDelete, handleTransferUpdate, useBankAccounts, useDocument, useManager, useRequest, useUser,
} from '@client/js/admin/admin.store';
import { API } from '@api';
import { DateTime, Info as DateInfo } from 'luxon';
import useSiteMetadata from '@client/js/core/useSiteMetadata';

function RegisterDocumentPrompt(props: {
  requestId: number;
  showing: boolean;
  onHide: () => void;
}) {
  const dispatch = useDispatch();
  const { requestId, showing, onHide } = props;
  const { siteUrl } = useSiteMetadata();
  const { request, requestLoading } = useRequest(requestId);
  const { account } = useUser(request?.userId);
  const { manager } = useManager(account?.accountNumber);
  const { bankAccounts } = useBankAccounts(account?.accountNumber, dispatch);
  const { userinfo } = getUserInfo();
  const [saving, setSaving] = useState(false);
  const { role } = userinfo || { role: null };
  const { id, type } = request;
  const bankData = bankAccounts.find(({ preferred, uuid }) => (preferred || uuid === request?.bankAccountUUID));
  const [sendEmail, setSendEmail] = useState(false);
  const [sendByDate, setSendByDate] = useState(DateTime.now());
  useEffect(() => {
    if (request.datetime) {
      setSendByDate(DateTime.fromMillis(request.datetime).plus({ month: 1 }));
    }
  }, [request]);
  const isDebit = type === OperationType.Debit;
  const cantRegister = role !== RoleName.admin || !request.id;
  const toggleSendEmail = () => setSendEmail(!sendEmail);
  const cancel = () => {
    setSendEmail(false);
    onHide();
  };
  const confirm = async () => {
    setSaving(true);
    const response = await API.Documents.Register.post({
      requestId, sendEmail, sendBy: sendByDate.valueOf(),
    });
    handleTransferUpdate(response, dispatch);
    setSaving(false);
    onHide();
  };

  const disabled = cantRegister || requestLoading || saving;
  const canEmail = !disabled && (request.type === OperationType.Credit || ((!!bankData?.DCAF && !!bankData?.accountEnding) || bankData?.status === BankAccountStatus.Validated));
  const subject = EmailLabels.getRequestEmailSubject(request);
  const emailTemplate = (() => {
    if (!cantRegister) {
      if (isDebit) { return distributionRequestedEmailTemplate({ request, siteUrl, sendBy: sendByDate.valueOf() }); }
      return creditRequestedEmailTemplate(siteUrl);
    }
    return { component: <></>, html: '' };
  })();

  return <ConfirmationDialog
  show={showing}
  title={labels.registerRequestPrompTitle({ id })}
  cancelLabel={labels.Cancel}
  onCancel={cancel}
  acceptLabel={labels.Confirm}
  onAccept={confirm}
  canAccept={!disabled}
  busy={disabled}
>
  <Accordion activeKey={sendEmail ? 'open' : ''}>
    <Card>
    <Accordion.Button as={Card.Header}>
      <Form.Check
      label={canEmail ? labels.sendEmail : labels.cantEmailNoDCAF }
      disabled={!canEmail}
      name='toggle-sendEmail'
      id='send-email-switch'
      type='switch'
      checked={sendEmail}
      onChange={toggleSendEmail}
    />
    </Accordion.Button>
    <Accordion.Collapse eventKey='open'>
      <Card.Body>
        <div className='mb-2'>
          {isDebit && <FormGroup>
            <Form.Label>{labels.sendByMonth}</Form.Label>
            <FormSelect value={sendByDate.month} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSendByDate(sendByDate.set({ month: +e.target.value })); }}>
              {DateInfo.months().map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </FormSelect>
          </FormGroup>}
        </div>
        <p>{labels.emailWillBeSent}</p>
        <div>To: {account.name} {account.lastname} {`<${account.email}>`}</div>
        <div>CC: {manager.username} {`<${manager.email}>`}</div>
        <div>Subject: {subject}</div>
        <Card>
          <Card.Body>
            {emailTemplate}
          </Card.Body>
        </Card>
      </Card.Body>
    </Accordion.Collapse>
    </Card>
  </Accordion>
</ConfirmationDialog>;
}

function createDocument(props: {
  requestId: number;
  uiType: 'button' | 'menuItem';
}) {
  const { requestId, uiType } = props;
  const { request, requestLoading } = useRequest(requestId);
  const { document, documentLoading } = useDocument(requestId);
  const { userinfo } = getUserInfo();
  const dispatch = useDispatch();

  const registered = !!document?.id;
  const { role } = userinfo || { role: null };
  const cantRegister = role !== RoleName.admin || !request.id;

  const [saving, setSaving] = useState(false);
  const unregister = async () => {
    if (!document?.id) return;
    setSaving(true);
    const response = await API.Documents.Delete.post({ id: document?.id });
    handleDocumentDelete(requestId, response, dispatch);
    setSaving(false);
  };
  const disabled = cantRegister || requestLoading || documentLoading || saving;

  const [showing, setShowing] = useState(false);
  const show = () => setShowing(true);

  const handleClick = () => {
    if (registered) {
      unregister();
    } else {
      show();
    }
  };
  const onHide = () => setShowing(false);

  if (uiType === 'button') {
    return (
    <>
    <RegisterDocumentPrompt {...{ requestId, showing, onHide }}/>
    <Button
      disabled={disabled}
      onClick={handleClick}
      variant='outline-secondary'
    >
      {registered ? labels.deleteDocument : labels.createDocument}
    </Button>
  </>);
  }

  if (uiType === 'menuItem') {
    return (
    <>
    <RegisterDocumentPrompt {...{ requestId, showing, onHide }}/>
    <Dropdown.Item
      disabled={disabled}
      onClick={handleClick}
    >
      {registered ? labels.deleteDocument : labels.createDocument}
    </Dropdown.Item>
  </>);
  }
  return null;
}

export const RegisterDocument = React.memo(createDocument);
