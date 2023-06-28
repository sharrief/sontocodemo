import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CombinedState from '@store/state';
import { PostRequestDialog as labels } from '@client/js/labels';
import ConfirmationDialog from '@client/js/components/ConfirmationDialog';
import { createSelector } from 'reselect';
import { creditPostedEmailTemplate, distributionPostedEmailTemplate, Labels as EmailLabels } from '@email';
import { BankAccountStatus, OperationType } from '@interfaces';
import {
  Accordion,
  Card,
  Col,
  Row,
  Form,
} from 'react-bootstrap';
import { DateTime } from 'luxon';
import {
  getUserInfo, useManager, useRequest, useUser, useBankAccounts, handleTransferUpdate,
} from '@client/js/admin/admin.store';
import useSiteMetadata from '@client/js/core/useSiteMetadata';
import { API } from '@api';

const selector = createSelector([
  (state: CombinedState) => state.transferDialog.emailPreview,
  (state: CombinedState) => {
    const {
      year, month, wireAmount, adjustment, wireConfirmation, wireDay, wireMonth, wireYear,
    } = state.transferDialog?.transferConfirmation;
    return {
      year, month, wireAmount, adjustment, wireConfirmation, wireDay, wireMonth, wireYear,
    };
  },
], (emailState, dialog) => ({
  emailState, dialog,
}));

function postRequestPrompt(props: {
  show: boolean;
  onHide: () => void;
  requestId: number;
  bankAccountUUID?: string;
}) {
  const {
    show, onHide, requestId, bankAccountUUID,
  } = props;
  const {
    dialog: dialogProps,
  } = useSelector(selector);
  const dispatch = useDispatch();

  const [saving, setSaving] = useState(false);
  const { siteUrl } = useSiteMetadata();
  const { userinfo } = getUserInfo();
  const { request, requestLoading } = useRequest(requestId);
  const { account, accountLoading } = useUser(request?.userId);
  const { manager, managerLoading } = useManager(account?.accountNumber);
  const { bankAccounts, bankAccountsLoading } = useBankAccounts(account?.accountNumber, dispatch);
  const bankAccount = bankAccounts?.find(({ uuid, preferred }) => (bankAccountUUID ? (bankAccountUUID === uuid) : request?.bankAccountUUID === uuid || preferred));
  const hasDCAF = !!bankAccount?.DCAF;
  const isValidated = bankAccount?.status === BankAccountStatus.Validated;
  const canEmail = (hasDCAF || isValidated) || request?.type === OperationType.Credit;
  const cantEmailReasons = [];
  if (!hasDCAF) cantEmailReasons.push(labels.noDCAF);
  if (!isValidated) cantEmailReasons.push(labels.notValidated);
  const [sendEmail, setSendEmail] = useState(canEmail);
  useEffect(() => {
    setSendEmail(canEmail);
  }, [bankAccountUUID, bankAccounts]);
  const toggleSendEmail = () => setSendEmail(!sendEmail);
  const [ps, setPs] = useState('');

  const { displayName } = userinfo || { displayName: null };
  const busy = (requestLoading || accountLoading || managerLoading || bankAccountsLoading) || saving;

  const closeDialog = () => {
    setPs('');
    onHide();
  };

  const confirm = async () => {
    setSaving(true);
    const response = await API.Requests.Post.post({
      ...dialogProps,
      sendEmail,
      emailMessage: ps,
      bankEndingUUID: bankAccount?.uuid,
      id: requestId,
    });
    handleTransferUpdate(response, dispatch);
    setSaving(false);
    closeDialog();
  };

  const {
    year, month,
  } = dialogProps ?? {};
  const { amount } = request;
  const postDate = DateTime.fromObject({ month, year });

  const getEmailTemplate = () => {
    if (!request) return '';
    const templateInput = {
      requestId: request.id,
      ps,
      displayName,
      siteUrl,
    };
    if (request?.type === OperationType.Credit) return creditPostedEmailTemplate(templateInput);
    if (request?.type === OperationType.Debit) return distributionPostedEmailTemplate(templateInput);
    return '';
  };
  const emailTemplate = getEmailTemplate();
  const emailSubject = EmailLabels.getRequestEmailSubject(request);

  return (
    <ConfirmationDialog
      show={show}
      title={labels.postRequestSummary(request?.type, amount, postDate.toFormat('MMMM yyyy'), sendEmail)}
      cancelLabel={labels.cancel}
      onCancel={onHide}
      acceptLabel={labels.confirm}
      onAccept={confirm}
      canAccept={!busy}
      busy={busy}
    >
      <Accordion activeKey={sendEmail ? 'open' : ''}>
      <Card>
        <Accordion.Button as={Card.Header} variant="link">
          <Form.Check
            name='toggle-sendEmail'
            label={labels.sendEmail}
            disabled={busy || !canEmail}
            checked={sendEmail}
            onChange={toggleSendEmail}
            id='send-post-request-email-switch'
            type='switch'
          />
          {!canEmail && <em>{labels.cantEmail} {cantEmailReasons.join(', and ')}.</em>}
        </Accordion.Button>
        <Accordion.Collapse eventKey='open'>
          <Card.Body>
            <Row>
              <Col className='p-0'>
              <Form.Group>
                <div className='pb-1'>
                  <div>{labels.emailTo}: {account.name} {account.lastname} {`<${account.email}>`}</div>
                  <div>{labels.emailCC}: {manager.displayName} {`<${manager.email}>`}</div>
                  <div>{labels.emailSubject}: {emailSubject}</div>
                </div>
                <Card>
                  <Card.Body>
                    {emailTemplate}
                  </Card.Body>
                </Card>
              </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col className='p-0'>
                <Form.Group>
                  <Form.Label>{labels.emailMessage}</Form.Label>
                  <Form.Control
                    disabled={busy}
                    as='textarea'
                    rows={4}
                    value={ps}
                    onChange={({ target: { value } }) => dispatch(setPs(value))} />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
    </ConfirmationDialog>
  );
}

export const PostRequestPrompt = React.memo(postRequestPrompt);
