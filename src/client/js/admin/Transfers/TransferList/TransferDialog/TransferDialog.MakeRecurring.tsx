import React, { useState } from 'react';
import { RequestActions as labels } from '@client/js/labels';
import ConfirmationDialog from '@client/js/components/ConfirmationDialog';
import { generateDistributionRequestMadeRecurringTemplate, Labels as EmailLabels } from '@email';
import {
  Accordion,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  FormSelect,
  InputGroup, Row,
} from 'react-bootstrap';

import { DateTime, Info as DateTimeInfo } from 'luxon';
import { OperationType, RequestStatus } from '@interfaces';
import {
  handleTransferUpdate,
  useBankAccounts, useManager, useRequest, useUser,
} from '@client/js/admin/admin.store';
import { API } from '@api';
import { useDispatch } from 'react-redux';
import useSiteMetadata from '@client/js/core/useSiteMetadata';

function MakeRecurringPrompt(props: {
  requestId: number;
  showing: boolean;
  onHide: () => void;
}) {
  const { requestId, showing, onHide } = props;
  const dispatch = useDispatch();

  const { siteUrl } = useSiteMetadata();

  const { request, requestLoading } = useRequest(requestId);
  const { id, status, type } = request;

  const { account } = useUser(request?.userId);
  const { manager } = useManager(account?.accountNumber);
  const { bankAccounts } = useBankAccounts(account?.accountNumber, dispatch);

  const [effectiveDate, setDate] = useState(DateTime.now());
  const { month, year } = effectiveDate;
  const thisYear = DateTime.now().year;

  const [sendEmail, setSendEmail] = useState(false);
  const clearFields = () => {
    setDate(DateTime.now());
    setSendEmail(false);
  };
  const [saving, setSaving] = useState(false);
  const confirmMakeRecurring = async () => {
    setSaving(true);
    const response = await API.Requests.MakeRecurring.post({ id: requestId, sendEmail, monthAndYear: { month, year } });
    handleTransferUpdate(response, dispatch);
    setSaving(false);
    clearFields();
    onHide();
  };

  const busy = requestLoading || saving;
  const preferredAccount = bankAccounts.find(({ DCAF, preferred }) => DCAF && preferred)?.accountEnding;

  const toggleSendEmail = () => setSendEmail(!sendEmail);
  const hideMakeRecurringDialog = () => {
    clearFields();
    onHide();
  };
  const handleChangeRecurringEffectiveDateMonth = (m: number) => setDate(effectiveDate.set({ month: m }));
  const handleChangeRecurringEffectiveDateYear = (y: number) => setDate(effectiveDate.set({ year: y }));
  const recurringEmailTemplate = generateDistributionRequestMadeRecurringTemplate(request, siteUrl, effectiveDate);
  return (
    <ConfirmationDialog
      show={showing}
      title={labels.makeRecurringPromptTitle({ status, type, id })}
      cancelLabel={labels.Cancel}
      onCancel={hideMakeRecurringDialog}
      acceptLabel={labels.Confirm}
      onAccept={confirmMakeRecurring}
      canAccept={!busy}
      busy={busy}
    >
      <Row>
        <Form.Group as={Col}>
          <Form.Label htmlFor='effectiveMonth'>{labels.effectiveMonth} {effectiveDate.toFormat('MMMM yyyy')}</Form.Label>
          <InputGroup>
            <FormSelect
              name='effectiveMonth'
              disabled={busy}
              value={month}
              onChange={({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => handleChangeRecurringEffectiveDateMonth(+value)}
            >
              {DateTimeInfo.months().map((m, index) => <option key={index} value={index + 1}>{m}</option>)}
            </FormSelect>
            <FormSelect
              value={year}
              disabled={busy}
              onChange={({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => handleChangeRecurringEffectiveDateYear(+value)}
            >
              <option value={thisYear - 1}>{thisYear - 1}</option>
              <option value={thisYear}>{thisYear}</option>
              <option value={thisYear + 1}>{thisYear + 1}</option>
            </FormSelect>
          </InputGroup>
        </Form.Group>
      </Row>
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
                {recurringEmailTemplate}
              </Card.Body>
            </Card>
          </Card.Body>
        </Accordion.Collapse>
        </Card>
      </Accordion>
    </ConfirmationDialog>
  );
}

function makeRecurring(props: {
  requestId: number;
  uiType: 'button' | 'menuItem';
}) {
  const { requestId, uiType } = props;
  const { request, requestLoading } = useRequest(requestId);
  const { type, status } = request;
  const [showing, setShowing] = useState(false);
  const showMakeRecurringDialog = () => setShowing(true);
  const hideMakeRecurringDialog = () => setShowing(false);

  const isDebit = type === OperationType.Debit;
  const isPendingOrApproved = [RequestStatus.Pending, RequestStatus.Approved].includes(status);
  const canMakeRecurring = (isDebit && isPendingOrApproved);
  const ready = !requestLoading;

  if (!canMakeRecurring) return null;
  if (uiType === 'button') {
    return <>
  <Button
    disabled={!ready || !canMakeRecurring}
    variant='outline-secondary'
    onClick={showMakeRecurringDialog}
  >{labels.makeRecurring}</Button>
  <MakeRecurringPrompt showing={showing} requestId={requestId} onHide={hideMakeRecurringDialog}/>
  </>;
  }

  if (uiType === 'menuItem') {
    return <>
  <Dropdown.Item
    disabled={!ready || !canMakeRecurring}
    onClick={showMakeRecurringDialog}
  >{labels.makeRecurring}</Dropdown.Item>
  <MakeRecurringPrompt showing={showing} requestId={requestId} onHide={hideMakeRecurringDialog}/>
  </>;
  }
  return null;
}

export const MakeRecurring = React.memo(makeRecurring);
