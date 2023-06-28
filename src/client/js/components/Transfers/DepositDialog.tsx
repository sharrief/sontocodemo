import React, { useEffect, useState } from 'react';
import CSS from 'csstype';
import {
  Button, Col, Form, FormCheck, InputGroup, Row, Spinner,
} from 'react-bootstrap';
import { WireInstructions } from '@components/BankInfo/helpers/wireInstructions';
import { transactionLabels as labels } from '@labels';
import { Currency } from '@components/Numbers';
import ResponsiveModal from '@components/Modal';
import {
  getUserInfo, handleMessageAndError, submitCreditRequest, useBankAccounts,
} from '@admin/admin.store';
import { useDispatch } from 'react-redux';
import { RoleId } from '@interfaces';

export default function DepositDialog(props: {
  accountNumber: string;
  show: boolean;
  onClose: () => void;
}) {
  const {
    show, accountNumber, onClose,
  } = props;
  const handleMessage = handleMessageAndError;

  const dispatch = useDispatch();
  const { userinfo } = getUserInfo();
  const isDirector = [RoleId.admin, RoleId.director].includes(userinfo.roleId);
  const { bankAccounts } = useBankAccounts(accountNumber, dispatch);
  const { receivingBankId } = bankAccounts.find(({ preferred }) => preferred) || bankAccounts[0] || { receivingBank: null };
  const [amount, setAmount] = useState(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [busy, setBusy] = useState(false);
  const canSubmit = accountNumber !== '' && amount > 0 && !busy && confirmTransfer;

  const handleClose = () => {
    if (!busy) {
      setAmount(null);
      setConfirmTransfer(false);
      onClose();
    }
  };
  const header = (<span className='fs-5'>{labels.DepositDialogHeader}</span>);
  const style: { [key: string]: CSS.Properties } = {
    table: {
      width: '100%',
      fontSize: '.9rem',
      border: '1px solid black',
      borderRadius: '3px',
      borderCollapse: 'collapse',
      tableLayout: 'fixed',
    },
  };
  const handleSubmit = async () => {
    if (canSubmit) {
      setBusy(true);
      const { message, error } = await submitCreditRequest(amount, accountNumber, sendEmail);
      setBusy(false);
      if (message || error) handleMessage({ message, error }, dispatch);
      handleClose();
    }
  };

  const body = (
    <Form noValidate onSubmit={(e) => e.preventDefault()}>
      <Form.Group>
        <Form.Label>
          <em>{labels.DepositInstructions}</em>
        </Form.Label>
      </Form.Group>
      <hr/>
      <Form.Group>
        <Form.Label><strong>{labels.DepositAmountInstruction}</strong></Form.Label>
        <InputGroup hasValidation>
          <InputGroup.Text>$</InputGroup.Text>
          <Currency
            isValid={amount > 0}
            isInvalid={!amount || amount < 0}
            value={amount}
            disabled={busy}
            onValueChange={({ floatValue }) => setAmount(floatValue)}
          />
          <InputGroup.Text>USD</InputGroup.Text>
          <Form.Control.Feedback type='invalid'>{labels.EnterAmount}</Form.Control.Feedback>
        </InputGroup>
      </Form.Group>
      <hr/>
      <Form.Group>
        <Form.Label>
          <strong>{labels.WireInstructions}</strong>
        </Form.Label>
        <Form.Label>
          <WireInstructions receivingBankId={receivingBankId} stylesOverride={style}/>
        </Form.Label>
      </Form.Group>
      <hr/>
      <Form.Group>
        <Form.Label>
          <strong>{labels.AfterWireInstructions}</strong>
        </Form.Label>
        <FormCheck
          className='my-2'
          id='confirm-transfer-sent'
          label={labels.ConfirmWireSent}
          checked={confirmTransfer}
          onChange={({ target: { checked } }) => setConfirmTransfer(checked)}
          isInvalid={!confirmTransfer}
          isValid={confirmTransfer}
          feedback={labels.ConfirmWireSentValidation}
          feedbackType="invalid"
        />
      </Form.Group>
      {isDirector && <Form.Group>
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
        onClick={handleSubmit}
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
