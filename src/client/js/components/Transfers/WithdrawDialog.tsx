import React, { useEffect, useState } from 'react';
import {
  Button, Col, InputGroup, Row, Spinner, FormCheck, Form,
} from 'react-bootstrap';
import { transactionLabels as labels, dashboardLabels } from '@labels';
import { Currency } from '@components/Numbers';
import ResponsiveModal from '@components/Modal';
import {
  useBankAccounts, submitDistributionRequest, handleMessageAndError, getUserInfo, useStatementBalances,
} from '@admin/admin.store';
import { NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { DashboardTabs } from '@dashboard/Dashboard';
import { RoleId } from '@interfaces';
import { DateTime } from 'luxon';
import BankInfoSelector from '../BankInfo.Selector';

export default function WithdrawDialog(props: {
  accountNumber: string;
  show: boolean;
  onClose: () => void;
  asDropdownItem?: boolean;
}) {
  const {
    accountNumber, show, onClose,
  } = props;
  const handleMessage = handleMessageAndError;
  const dispatch = useDispatch();
  const { userinfo } = getUserInfo();
  const [confirmBank, setConfirmBank] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [amount, setAmount] = useState(null);
  const [busy, setBusy] = useState(false);
  const { bankAccounts } = useBankAccounts(accountNumber, dispatch);
  const [selectedBankUUID, setSelectedBankUUID] = useState('');
  const { statementBalances } = useStatementBalances(accountNumber);
  const latestStatement = statementBalances.reduce((latest, current) => {
    const { month, year } = current;
    if (DateTime.fromObject({ month, year }).valueOf() > DateTime.fromObject({ month: latest.month, year: latest.year }).valueOf()) {
      return current;
    }
    return latest;
  }, { month: 1, year: 1970, endBalance: 0 });

  const amountTooGreat = amount > latestStatement.endBalance;
  const amountIsValid = amount > 0 && !amountTooGreat;
  const isDirectorOrAdmin = [RoleId.admin, RoleId.director].includes(userinfo?.roleId);
  const bankAccountValid = (selectedBankUUID !== '' || isDirectorOrAdmin);
  const bankAccountValidAdminMessage = selectedBankUUID === '' && isDirectorOrAdmin ? labels.AdminNoAccountMessage : null;

  const canSubmit = accountNumber !== ''
  && amount > 0
  && !busy && confirmBank
  && bankAccountValid
  && (amountIsValid);

  const handleClose = () => {
    if (!busy) {
      setAmount(null);
      setConfirmBank(false);
      onClose();
    }
  };

  useEffect(() => {
    if (bankAccounts?.length) {
      const preferredUUID = bankAccounts.find(({ preferred }) => preferred)?.uuid;
      setSelectedBankUUID(preferredUUID ?? bankAccounts[0]?.uuid);
    }
  }, [bankAccounts]);

  const submit = async () => {
    if (canSubmit) {
      setBusy(true);
      const { message, error } = await submitDistributionRequest(amount, accountNumber, selectedBankUUID, sendEmail);
      setBusy(false);
      if (message || error) handleMessage({ message, error }, dispatch);
      handleClose();
    }
  };

  const header = (<span className='fs-5'>{labels.WithdrawalDialogHeader}</span>);
  const body = (
    <Form noValidate onSubmit={(e) => e.preventDefault()}>
      <Form.Group>
        <Form.Label>
          <em>{labels.WithdrawalInstructions}</em>
        </Form.Label>
      </Form.Group>
      <hr />
      <Form.Group>
        <Form.Label>
          <strong>{labels.WithdrawalAmountInstruction}</strong>
        </Form.Label>
        <InputGroup as={Col}>
          <InputGroup.Text>$</InputGroup.Text>
          <Currency
            isValid={amountIsValid}
            isInvalid={!amountIsValid}
            value={amount}
            disabled={busy}
            onValueChange={({ floatValue }) => setAmount(floatValue)}
          />
          <InputGroup.Text>USD</InputGroup.Text>
          {amount <= 0 && <Form.Control.Feedback type='invalid'>{labels.WithdrawalAmountInvalid}</Form.Control.Feedback>}
          {amountTooGreat && <Form.Control.Feedback type='invalid'>
            {labels.WithdrawalAmountTooGreat(DateTime.fromObject({
              month: latestStatement.month,
              year: latestStatement.year,
            })
              .toLocaleString(DateTime.DATETIME_SHORT))}
          </Form.Control.Feedback>}
        </InputGroup>
        <Form.Label><em>{labels.WithdrawalFees}</em></Form.Label>
      </Form.Group>
      <hr />
      <Form.Group>
        <Form.Label><strong>{labels.BankInfoInstructions}</strong></Form.Label>
        <BankInfoSelector
          hideLabel={true}
          bankAccountUUID={selectedBankUUID}
          accountNumber={accountNumber}
          setBankAccountUUID={setSelectedBankUUID}
          isValid={bankAccountValid}
          isInvalid={!bankAccountValid}
        />
        <Form.Label><em>{labels.AddNewAccount} <NavLink to={`../${DashboardTabs.bankAccounts}`}>{dashboardLabels.TabTitleBankAccounts}</NavLink></em></Form.Label>
        {bankAccountValidAdminMessage && <Form.Label><em>{bankAccountValidAdminMessage}</em></Form.Label>}
      </Form.Group>
      <hr />
      <Form.Group>
        <Form.Label><strong>{labels.ConfirmWithdrawal}</strong></Form.Label>
        <FormCheck
          className='my-2'
          id='confirm-withdrawal-bank'
          isValid={confirmBank}
          isInvalid={!confirmBank}
          label={labels.ConfirmWithdrawalBank}
          checked={confirmBank}
          onChange={({ target: { checked } }) => setConfirmBank(checked)}
        />
      </Form.Group>
      {isDirectorOrAdmin && <Form.Group>
        <FormCheck
          className='my-2'
          id='send-email'
          label={labels.SendEmail}
          checked={sendEmail}
          onChange={({ target: { checked } }) => setSendEmail(checked)}
        />
      </Form.Group>}
    </Form>
  );
  const footer = (
    <Row className='w-100 m-0' style={{ height: '50px' }}>
      <Col>
        <Button
          disabled={busy}
          variant='secondary'
          className='d-flex align-items-center w-100 justify-content-center'
          onClick={handleClose}
        >{labels.Cancel}</Button>
      </Col>
      <Col>
        <Button
          variant='primary'
          disabled={!canSubmit}
          className='d-flex align-items-center w-100 justify-content-center'
          onClick={submit}
        >
          {labels.Submit} {busy && <Spinner size='sm' animation='grow' />}
        </Button>
      </Col>
    </Row>
  );

  return <ResponsiveModal
    header={header}
    body={body}
    footer={footer}
    handleClose={handleClose}
    show={show}
  />;
}
