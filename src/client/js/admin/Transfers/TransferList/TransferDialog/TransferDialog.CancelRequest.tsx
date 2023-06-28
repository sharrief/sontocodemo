import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { RequestActions as labels } from '@client/js/labels';
import ConfirmationDialog from '@client/js/components/ConfirmationDialog';
import { generateDistributionRequestCancelTemplate, Labels as EmailLabels } from '@email';
import {
  Accordion,
  Button,
  Card,
  Dropdown,
  Form,
} from 'react-bootstrap/esm';
import { RequestStatus } from '@interfaces';
import {
  getUserInfo,
  handleTransferUpdate, useManager, useRequest, useUser,
} from '@client/js/admin/admin.store';
import { API } from '@api';
import useSiteMetadata from '@client/js/core/useSiteMetadata';

function CancelRequestPrompt(props: {
  requestId: number;
  showing: boolean;
  onHide: () => void;
}) {
  const { requestId, showing, onHide } = props;
  const { siteUrl } = useSiteMetadata();
  const { request, requestLoading } = useRequest(requestId);
  const { account } = useUser(request?.userId);
  const { userinfo } = getUserInfo();
  const { manager } = useManager(account?.accountNumber);
  const [saving, setSaving] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const dispatch = useDispatch();

  const { id, status, type } = request;
  const busy = requestLoading || saving;

  const toggleSendEmail = () => setSendEmail(!sendEmail);

  const confirm = async () => {
    setSaving(true);
    const response = await API.Requests.Cancel.post({ id: requestId, sendEmail, emailMessage });
    handleTransferUpdate(response, dispatch);
    setSaving(false);
    onHide();
  };
  const cancel = () => {
    setSendEmail(false);
    onHide();
  };
  const cancelEmailTemplate = generateDistributionRequestCancelTemplate(request, siteUrl, manager.username, emailMessage, userinfo?.displayName);

  return <ConfirmationDialog
  show={showing}
  title={labels.cancelRequestPromptTitle({ status, type, id })}
  cancelLabel={labels.Cancel}
  onCancel={cancel}
  acceptLabel={labels.Confirm}
  onAccept={confirm}
  canAccept={!busy}
  busy={busy}
>
  <Accordion activeKey={sendEmail ? 'open' : ''}>
    <Card>
    <Accordion.Button as={Card.Header}>
      <Form.Check
      label='Send email'
      disabled={busy}
      name='toggle-sendEmail'
      id='send-email-switch'
      type='switch'
      checked={sendEmail}
      onChange={toggleSendEmail}
    />
    </Accordion.Button>
    <Accordion.Collapse eventKey='open'>
      <Card.Body>
        <p>{labels.emailWillBeSent}</p>
        <div>To: {account.name} {account.lastname} {`<${account.email}>`}</div>
        <div>CC: {manager.username} {`<${manager.email}>`}</div>
        <div>Subject: {EmailLabels.getRequestEmailSubject(request)}</div>
        <Card>
          <Card.Body>
            {cancelEmailTemplate}
          </Card.Body>
        </Card>
        <Form.Group>
          <Form.Label>{labels.emailMessage}</Form.Label>
          <Form.Control
            disabled={busy}
            as='textarea'
            rows={4}
            value={emailMessage}
            onChange={({ target: { value } }) => dispatch(setEmailMessage(value))} />
        </Form.Group>
      </Card.Body>
    </Accordion.Collapse>
    </Card>
  </Accordion>
</ConfirmationDialog>;
}

function cancelRequest(props: {
  requestId: number;
  uiType: 'button' | 'menuItem';
}) {
  const { requestId, uiType } = props;
  const { request, requestLoading } = useRequest(requestId);
  const { status } = request;
  const busy = requestLoading;
  const [showing, setShowing] = useState(false);

  const showCancelDialog = () => setShowing(true);
  const onHide = () => setShowing(false);
  const canCancelRequest = ([RequestStatus.Pending, RequestStatus.Recurring].includes(status));

  if (uiType === 'button') {
    return <>
      <CancelRequestPrompt {...{ requestId, showing, onHide }}/>
      <Button disabled={busy || !canCancelRequest} variant='outline-danger'
        onClick={showCancelDialog}
      >{labels.cancelRequest}</Button>
    </>;
  }

  if (uiType === 'menuItem') {
    return <>
      <Dropdown.Item
        disabled={busy || !canCancelRequest}
        variant='outline-danger'
        onClick={showCancelDialog}
      >{labels.cancelRequest}</Dropdown.Item>
      <CancelRequestPrompt {...{ requestId, showing, onHide }}/>
    </>;
  }

  return null;
}

export const CancelRequest = React.memo(cancelRequest);
