import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'react-bootstrap/esm/Button';
import Modal from 'react-bootstrap/esm/Modal';
import Form from 'react-bootstrap/esm/Form';
import GenerateIcon from '@mui/icons-material/PostAdd';
import { createSelector } from 'reselect';
import { DateTime } from 'luxon';
import CombinedState from '@store/state';
import { PortfolioStatementsSlice } from '@admin/Portfolio/Portfolio.Accounts.Slice';
import { Portfolio as labels } from '@labels';
import {
  Card,
  Col, ModalBody, Row, Spinner,
} from 'react-bootstrap';
import { generatePortfolioStatements } from '@admin/Portfolio/Portfolio.Sockets';
import { statementGeneratedEmailTemplate, oldStatementPopulatedEmailTemplate } from '@email';
import PortfolioAccountsSelector from '@admin/Portfolio/Portfolio.Accounts.Selector';
import useSiteMetadata from '@client/js/core/useSiteMetadata';

const selectStatementDialogState = createSelector([
  (state: CombinedState) => state.portfolioStatementsState.loading,
  (state: CombinedState) => state.portfolioStatementsState.genState,
  (state: CombinedState) => state.portfolioStatementsState.sendEmails,
  (state: CombinedState) => state.portfolioStatementsState.emailType,
  (state: CombinedState) => state.portfolioStatementsState.ccManager,
  (state: CombinedState) => state.portfolioStatementsState.showGenDialog,
  (state: CombinedState) => state.portfolioStatementsState.filteredMonthIds,
  (state: CombinedState) => state.portfolioStatementsState.latestTradeMonth,
], (loading, genState, sendEmails, emailType, ccManager, showGenDialog, filteredMonthIds, latestTradeMonth) => ({
  loading, genState, sendEmails, emailType, ccManager, showGenDialog, filteredMonthIds, latestTradeMonth,
}));

function GenerateStatementsDialog() {
  const dispatch = useDispatch();
  const { siteUrl } = useSiteMetadata();
  const {
    loading, genState, sendEmails, emailType, ccManager, showGenDialog, filteredMonthIds, latestTradeMonth,
  } = useSelector(selectStatementDialogState);
  const generate = () => {
    dispatch(generatePortfolioStatements());
  };
  const busy = loading.statements || genState === 'busy';
  const onHide = () => !busy && dispatch(PortfolioStatementsSlice.actions.setShowGenDialog(false));
  const toggleSendEmails = () => !busy && dispatch(PortfolioStatementsSlice.actions.toggleSendEmails());
  const toggleCCManager = () => !busy && dispatch(PortfolioStatementsSlice.actions.toggleCCManager());
  const toggleEmailType = () => !busy && dispatch(PortfolioStatementsSlice.actions.setEmailType(emailType === 'old' ? 'text' : 'old'));
  const oldestStatement = Math.min(...filteredMonthIds);
  const emailPreview = emailType === 'old'
    ? <Card>
      <Card.Body>{oldStatementPopulatedEmailTemplate({
        name: 'SAMPLE ACCOUNT NAME',
        accountNumber: '0123456789',
        dateString: DateTime.fromObject(latestTradeMonth).toFormat('MMMM yyyy'),
        host: siteUrl,
      })}</Card.Body></Card>
    : <Card>
        <Card.Body>
          {statementGeneratedEmailTemplate({
            statement: latestTradeMonth,
            manager: { displayName: 'SAMPLE ACCOUNT MANAGER' },
          })}
        </Card.Body>
      </Card>;
  return <Modal show={showGenDialog} onHide={onHide} style={{ height: '100%' }}>
    <>
    <Modal.Header closeButton><h4>{labels.GenerateStatementsDialogHeader}</h4></Modal.Header>
    <ModalBody>
      <p>{labels.UpdateStatementsPrompt(DateTime.fromMillis(oldestStatement).toFormat('MMMM yyyy'), DateTime.fromObject(latestTradeMonth).toFormat('MMMM yyyy'))}</p>
      <Row className='mb-2'>
        <Col>
        <Row>
          <Col>
            <Form.Check
              type='switch'
              id='send-statement-emails-switch'
              disabled={busy}
              label={labels.SendEmails}
              onChange={toggleSendEmails}
              checked={sendEmails}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Check
              type='switch'
              id='cc-manager-switch'
              disabled={!sendEmails || busy}
              label={labels.CCManager}
              onChange={toggleCCManager}
              checked={ccManager}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Check
              type='switch'
              id='cc-email-type-switch'
              disabled={!sendEmails || busy}
              label={labels.SendHTMLEmail}
              onChange={toggleEmailType}
              checked={emailType === 'old'}
            />
          </Col>
        </Row>
        </Col>
        <Col xs='auto'>
          <Button disabled={busy} variant='primary'
            onClick={generate}>{busy ? <Spinner animation='grow' size='sm' /> : labels.Start}
          </Button>
        </Col>
      </Row>
      {sendEmails && <>
          <Row xs='12'>
            <Col><em>{labels.EmailPreview}</em></Col>
          </Row>
          <div className='mb-2'>
            {emailPreview}
          </div>
        </>
      }
      <PortfolioAccountsSelector asDialog={false}/>
    </ModalBody>
    </>
  </Modal>;
}

const selectGenerateStatementsButtonState = createSelector([
  (state: CombinedState) => state.portfolioStatementsState.selectedAccounts,
], (selectedAccounts) => ({ selectedAccounts }));

function GenerateStatementsButton() {
  const dispatch = useDispatch();
  const { selectedAccounts } = useSelector(selectGenerateStatementsButtonState);
  const disabled = !selectedAccounts?.length;
  const handleClick = () => dispatch(PortfolioStatementsSlice.actions.setShowGenDialog(true));
  return <>
    <GenerateStatementsDialog />
    <Button
    style={{ height: '100%', width: '100%' }}
    disabled={disabled}
    variant='primary'
    onClick={handleClick}>{labels.GenerateStatements} <GenerateIcon /></Button>
  </>;
}

export default React.memo(GenerateStatementsButton);
