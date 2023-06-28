import React from 'react';
import Form from 'react-bootstrap/esm/Form';
import { useSelector, useDispatch } from 'react-redux';
import CombinedState from '@store/state';
import { PostRequestDialog as labels } from '@client/js/labels';
import { actions } from '@admin/Transfers/TransferList/TransferDialog';
import { createSelector } from 'reselect';
import { creditPostedEmailTemplate, distributionPostedEmailTemplate, Labels as EmailLabels } from '@email';
import Col from 'react-bootstrap/esm/Col';
import Row from 'react-bootstrap/Row';
import { OperationType } from '@interfaces';
import { Accordion, Card } from 'react-bootstrap';
import { getUserInfo } from '@client/js/admin/admin.store';
import useSiteMetadata from '@client/js/core/useSiteMetadata';

const selectDialogAndTransfer = createSelector([
  (state: CombinedState) => state.transferDialog.emailPreview,
  (state: CombinedState) => {
    const {
      year, month, wireAmount, adjustment, wireConfirmation, wireDay, wireMonth, wireYear,
    } = state.transferDialog?.transferConfirmation;
    return {
      year, month, wireAmount, adjustment, wireConfirmation, wireDay, wireMonth, wireYear,
    };
  },
  (state: CombinedState) => state.transferDialog.request,
  (state: CombinedState) => state.transferDialog.saving,
  (state: CombinedState) => state.transferDialog.account,
  (state: CombinedState) => {
    const uuid = state.transferDialog.transferConfirmation?.bankEndingUUID;
    return state.transferDialog.bankAccounts?.find(({ uuid: u }) => uuid === u);
  },
  (state: CombinedState) => state.transferDialog.manager,
], (emailState, dialog, request, saving, account, bankAccount, manager) => ({
  emailState, dialog, request, saving, account, bankAccount, manager,
}));

export function emailPreview() {
  const {
    request, saving, emailState, account, manager,
  } = useSelector(selectDialogAndTransfer);
  const { siteUrl } = useSiteMetadata();
  const { userinfo } = getUserInfo();
  const { displayName } = userinfo || { displayName: null };
  const { sendEmail, canEmail, emailMessage } = emailState;
  const dispatch = useDispatch();
  if (!request) return null;
  const busy = saving.request;
  const toggleSendEmail = () => dispatch(actions.toggleSendEmail());
  const setEmailPS = (ps: string) => dispatch(actions.setEmailPS(ps));

  const getEmailTemplate = () => {
    if (!request) return <></>;
    const templateInput = {
      requestId: request.id,
      ps: emailMessage,
      displayName,
      siteUrl,
    };
    if (request?.type === OperationType.Credit) return creditPostedEmailTemplate(templateInput);
    if (request?.type === OperationType.Debit) return distributionPostedEmailTemplate(templateInput);
    return <></>;
  };
  const emailTemplate = getEmailTemplate();
  const emailSubject = EmailLabels.getRequestEmailSubject(request);
  return (
    <Accordion activeKey={sendEmail ? 'open' : ''}>
      <Card>
        <Accordion.Button as={Card.Header} variant="link" eventKey="0">
          <Form.Check
            name='toggle-sendEmail'
            label={labels.sendEmail}
            disabled={busy || !canEmail}
            checked={sendEmail}
            onChange={toggleSendEmail}
            id='send-post-request-email-switch'
            type='switch'
          />
          {!canEmail && <em>{labels.noDCAF}</em>}
        </Accordion.Button>
        <Accordion.Collapse eventKey='open'>
          <Card.Body>
            <Row>
              <Col className='p-0'>
              <Form.Group>
                <div className='pb-1'>
                  <div>{labels.emailTo}: {account.name} {account.lastname} {`<${account.email}>`}</div>
                  <div>{labels.emailCC}: {manager.username} {`<${manager.email}>`}</div>
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
                    value={emailMessage}
                    onChange={({ target: { value } }) => dispatch(setEmailPS(value))} />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
}

export const EmailPreview = React.memo(emailPreview);
