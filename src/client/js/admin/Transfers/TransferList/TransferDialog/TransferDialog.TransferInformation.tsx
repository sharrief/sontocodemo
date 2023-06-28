import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/esm/Form';
import InputGroup from 'react-bootstrap/esm/InputGroup';
import Button from 'react-bootstrap/esm/Button';
import Spinner from 'react-bootstrap/esm/Spinner';
import { useSelector, useDispatch } from 'react-redux';
import { DateTime, Info as DateTimeInfo } from 'luxon';
import CombinedState from '@store/state';
import { Currency } from '@client/js/components/Numbers';
import { BankInfo, PostRequestDialog as labels, BankInfoSelector as bankInfoSelectorLabels } from '@client/js/labels';
import {
  actions, PostRequestPrompt,
} from '@admin/Transfers/TransferList/TransferDialog';
import { createSelector } from 'reselect';
import Col from 'react-bootstrap/esm/Col';
import Row from 'react-bootstrap/esm/Row';
import { OperationType, RequestStatus, RoleName } from '@interfaces';
import { currency } from '@client/js/core/helpers';
import {
  Accordion,
  Card, FormSelect,
} from 'react-bootstrap';
import {
  getUserInfo, useRequest, useUser, useBankAccounts, useStatementBalances, useOperationsByRequest,
} from '@client/js/admin/admin.store';
import { BankInfoComponent } from '@client/js/components/BankInfo/BankInfo.Item';
import useFullBankAccountNumber from '@client/js/components/BankInfo/helpers/useFullBankAccountNumber';
import Labels from '@client/js/application/Labels';
import ArrowDownwardSharp from '@mui/icons-material/ArrowDownwardSharp';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const selectDialogAndTransfer = createSelector([
  (state: CombinedState) => state.transferDialog.transferConfirmation,
], (transferConfirmation) => ({
  transferConfirmation,
}));

function transferInformation(props: { requestId: number }) {
  const selectedState = useSelector(selectDialogAndTransfer);
  const {
    transferConfirmation,
  } = selectedState;
  const dispatch = useDispatch();

  const { userinfo } = getUserInfo();
  const { requestId } = props;
  const { request, requestLoading } = useRequest(requestId);
  useEffect(() => {
    if (request?.id) {
      dispatch(actions.initTransferConfirmation(request));
    }
  }, [request]);
  const { account } = useUser(request?.userId);
  const { operations, operationsLoading } = useOperationsByRequest(requestId);
  const { bankAccounts, bankAccountsLoading } = useBankAccounts(account?.accountNumber, dispatch);
  const { statementBalances, statementBalancesLoading } = useStatementBalances(account?.accountNumber);

  const ready = !(requestLoading || bankAccountsLoading || statementBalancesLoading || operationsLoading);

  const { role } = userinfo || { role: null };
  const { id, type, status } = request;
  const {
    year, month, wireAmount, adjustment, wireConfirmation,
    wireMonth, wireDay, wireYear,
  } = transferConfirmation;

  const isAdmin = role === RoleName.admin;
  const selectedMonth = DateTime.fromObject({ year, month });
  const postingOrLoadingRequest = (requestLoading || operationsLoading || statementBalancesLoading || bankAccountsLoading);
  const selectedBankAccount = request?.bankAccountUUID ? bankAccounts.find(({ uuid }) => uuid === request.bankAccountUUID) : bankAccounts.find(({ preferred }) => preferred);
  const bankAccountUUID = selectedBankAccount?.uuid;
  const latestStatementBalance = account && statementBalances
    .reduce((latest, curr) => {
      const currDate = DateTime.fromObject({ month: curr.month, year: curr.year });
      if (!latest) {
        return curr;
      }
      const latestDate = DateTime.fromObject({ month: latest.month, year: latest.year });
      if (currDate.valueOf() > latestDate.valueOf()) return curr;
      return latest;
    }, { month: account?.obMonth, year: account?.obYear, endBalance: account?.openingBalance });
  const earliestStatementBalance = statementBalances
    .reduce((earliest, curr) => {
      const currDate = DateTime.fromObject({ month: curr.month, year: curr.year });
      if (!earliest) {
        return curr;
      }
      const earliestDate = DateTime.fromObject({ month: earliest.month, year: earliest.year });
      if (currDate.valueOf() < earliestDate.valueOf()) return curr;
      return earliest;
    }, { month: account?.obMonth, year: account?.obYear, endBalance: account?.openingBalance });
  const latestStatementMonth = latestStatementBalance && DateTime.fromObject({ month: latestStatementBalance?.month, year: latestStatementBalance?.year });
  const firstStatementMonth = DateTime.fromObject({ month: earliestStatementBalance?.month, year: earliestStatementBalance?.year });
  const operationPostMonth = selectedMonth.valueOf();
  const cantPostBCMonthNotWithinStatementRange = (operationPostMonth >= firstStatementMonth?.valueOf() && (
    latestStatementMonth ? operationPostMonth <= latestStatementMonth?.plus({ month: 2 }).valueOf() : operationPostMonth === firstStatementMonth?.valueOf()))
    ? ''
    : labels.cantPostBecauseOutsideStatementRage(
      firstStatementMonth.toFormat('MMMM yyyy'),
      firstStatementMonth.valueOf() !== latestStatementMonth?.valueOf() && latestStatementMonth?.plus({ month: 2 }).toFormat('MMMM yyyy'),
    );
  const isPosted = operations.find(({ requestId: rId, month: m, year: y }) => {
    if (rId === id) {
      if (status !== RequestStatus.Recurring) return true;
      if (operationPostMonth === DateTime.fromObject({ month: m, year: y }).valueOf()) return true;
    }
    return false;
  });
  const handleWireConfirmationChange = (w: string) => dispatch(actions.changeWireConfirmation(w));
  useEffect(() => {
    if (isPosted) {
      dispatch(actions.setPostedEffectiveDate({ month: isPosted.month, year: isPosted.year }));
      handleWireConfirmationChange(isPosted.wireConfirmation);
    }
  }, [operations, selectedState]);
  const cantPostBCStatus = [RequestStatus.Pending, RequestStatus.Recurring].includes(status) ? '' : labels.cantPostBCStatus(status);
  const cantPostBCWireConfirmationEmpty = (cantPostBCStatus || wireConfirmation?.trim()) ? '' : labels.cantPostBCWireConfirmationEmpty;
  const cantPostBCPosted = isPosted ? labels.cantPostBCPosted(selectedMonth.toFormat('MMMM yyyy')) : '';
  const cantPostReasons = [cantPostBCStatus, cantPostBCWireConfirmationEmpty, cantPostBCPosted, cantPostBCMonthNotWithinStatementRange];
  const canPost = ready && !cantPostBCStatus && !cantPostBCWireConfirmationEmpty && !cantPostBCPosted && !cantPostBCMonthNotWithinStatementRange;
  const canChangeEffectiveMonth = ready && !cantPostBCStatus; // the date is defaulted to the request datetime
  const canSetTransactionAmount = ready && !isPosted && !cantPostBCStatus && isAdmin;
  const canSetCreditReimbursement = ready && !isPosted && !cantPostBCStatus;
  const canChangeDebitFee = ready && !cantPostBCStatus;
  const canSetWireConfirmation = ready && !isPosted && !cantPostBCStatus;
  const canSetWirePostDate = ready && !isPosted && !cantPostBCStatus;
  const handlePostMonthChange = (m: number) => dispatch(actions.changePostMonth(m));
  const handlePostYearChange = (y: number) => dispatch(actions.changePostYear(y));
  const handleWireAmountChange = (a: number) => dispatch(actions.changeWireAmount(a || 0));
  const handleWireAdjustmentChange = (a: number) => dispatch(actions.changeWireAdjustment(a));
  useEffect(() => {
    if (type === OperationType.Credit) {
      dispatch(actions.changeWireAdjustment(Math.min(100, Math.max(0, request.amount - wireAmount))));
    }
  }, [type, wireAmount]);
  const handleWireMonthChange = (m: number) => dispatch(actions.changeWireMonth(m));
  const handleWireYearChange = (y: number) => dispatch(actions.changeWireYear(y));
  const handleWireDayChange = (d: number) => dispatch(actions.changeWireDay(d));
  const dataIsValid = !!wireConfirmation && wireAmount !== 0 && year && month && wireDay && wireMonth && wireYear;
  const clickPostButton = canPost && dataIsValid;

  const [showPostPrompt, setShowPostPrompt] = useState(false);
  const handlePostClicked = () => {
    if (clickPostButton) {
      setShowPostPrompt(true);
    }
  };
  const hidePostPrompt = () => setShowPostPrompt(false);
  const [showBankPreview, setShowBankPreview] = useState('');
  const previewBankInfo = (uuid: string) => uuid && setShowBankPreview(uuid === showBankPreview ? '' : uuid);
  const sendToAccount = !selectedBankAccount
    ? bankInfoSelectorLabels.NoBankAccountSet
    : `${selectedBankAccount.accountName ?? `${selectedBankAccount.name}${selectedBankAccount.lastName ? ` ${selectedBankAccount.lastName}` : ''}`
    } ...${selectedBankAccount.accountEnding} ${selectedBankAccount.bankName}`;

  const [accountNumbersVisibleForUUID, setAccountNumbersVisibleForUUID] = useState('');
  useFullBankAccountNumber(account.accountNumber, accountNumbersVisibleForUUID, dispatch);
  const toggleAccountNumbersVisible = (uuid: string) => {
    setAccountNumbersVisibleForUUID(accountNumbersVisibleForUUID ? '' : uuid);
  };

  return (
    <>
      <PostRequestPrompt show={showPostPrompt} onHide={hidePostPrompt} requestId={requestId} bankAccountUUID={bankAccountUUID} />
      <Form>
        <Card>
          <Card.Header>
            <h5>{labels.transferInformation} {!ready ? <Spinner animation='grow' size='sm' className='align-middle' /> : null} </h5>
          </Card.Header>
          <Card.Body>
            <Row className='mt-2'>
              <Form.Group as={Col}>
                <Form.Label htmlFor='postMonth'>{labels.postMonth}</Form.Label>
                <InputGroup>
                  <FormSelect
                    disabled={!canChangeEffectiveMonth}
                    value={month}
                    onChange={
                      ((e: React.ChangeEvent<HTMLSelectElement>) => handlePostMonthChange(+e.target.value))}
                  >
                    {DateTimeInfo.months().map((m, index) => <option key={index + 1} value={index + 1}>{m}</option>)}
                  </FormSelect>
                  <Form.Control
                    disabled={!canChangeEffectiveMonth}
                    type='number'
                    value={Number(year).toString()}
                    onChange={
                      ((e: React.ChangeEvent<HTMLInputElement>) => handlePostYearChange(+e.target.value))}
                  />
                </InputGroup>
              </Form.Group>
            </Row>

            <Row className='mt-2'>
              <Form.Group as={Col}>
                <Form.Label htmlFor='amount'>{type === OperationType.Credit ? labels.receivedAmount : labels.sentAmount}</Form.Label>
                <InputGroup>

                  <InputGroup.Text>$</InputGroup.Text>

                  <Currency
                    disabled={!canSetTransactionAmount}
                    value={wireAmount}
                    readOnly={type === OperationType.Debit}
                    onValueChange={(({ floatValue }) => handleWireAmountChange(floatValue))}
                  />
                  {type === OperationType.Credit && adjustment > 0
                    ? <>

                      <InputGroup.Text>+</InputGroup.Text>

                      <Form.Control
                        disabled={!canSetCreditReimbursement}
                        readOnly
                        value={currency(adjustment)}
                      />
                    </> : null}
                </InputGroup>
              </Form.Group>

              {type === OperationType.Debit
                && <Form.Group as={Col} className='ml-md-2' xs={12} lg={6}>
                  <Form.Label htmlFor='requestFee'>{labels.fee}</Form.Label>
                  <InputGroup>

                    <InputGroup.Text>$</InputGroup.Text>

                    <Button
                      disabled={!canChangeDebitFee || adjustment === 0}
                      onClick={() => handleWireAdjustmentChange(0)}
                    >{0}</Button>

                    <Button
                      disabled={!canChangeDebitFee || adjustment === -30}
                      onClick={() => handleWireAdjustmentChange(-30)}
                    >{30}</Button>

                    <Button
                      disabled={!canChangeDebitFee || adjustment === -60}
                      onClick={() => handleWireAdjustmentChange(-60)}
                    >{60}</Button>

                    <Currency
                      disabled={!canChangeDebitFee}
                      value={adjustment}
                      onValueChange={
                        (({ floatValue }) => handleWireAdjustmentChange(-1 * Math.abs(floatValue)))
                      }
                    />
                  </InputGroup>
                </Form.Group>}
            </Row>

            {type === OperationType.Debit
              && <Row className='mt-2'>
                <Form.Label htmlFor='requestFee'>{bankInfoSelectorLabels.BankAccount}</Form.Label>
                <Accordion activeKey={showBankPreview}>
                  <Card>
                    <Card.Header onClick={() => previewBankInfo(bankAccountUUID)}>
                      <div className='d-flex justify-content-between'>
                        <div>
                          {sendToAccount}
                        </div>
                        <div>{showBankPreview === ''
                          ? <ExpandMore/>
                          : <ExpandLess/>}
                        </div>
                      </div>
                    </Card.Header>
                  </Card>
                  <Accordion.Collapse eventKey={bankAccountUUID}>
                    <Card.Body>
                    {selectedBankAccount
                    && <BankInfoComponent
                      bankData={selectedBankAccount}
                      isPreview={true}
                      toggleAccountNumbersVisible={toggleAccountNumbersVisible}
                      accountNumbersVisible={accountNumbersVisibleForUUID === bankAccountUUID}
                    />}
                    </Card.Body>
                  </Accordion.Collapse>
                </Accordion>
              </Row>
            }
            <Row className='mt-2'>
              <Form.Group as={Col} xs={true}>
                <Form.Label htmlFor='wireConfirmation'>{labels.wireConfirmation}</Form.Label>
                <InputGroup>
                  <Form.Control
                    disabled={!canSetWireConfirmation} required type='text'
                    value={wireConfirmation}
                    onChange={
                      ((e: React.ChangeEvent<HTMLInputElement>) => handleWireConfirmationChange(e.target.value))
                    }
                  />
                  <Form.Control.Feedback type='invalid'>{labels.invalidConfirmationNumber}</Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Row>
            <Row className='mt-2'>
              <Form.Group as={Col}>
                <Form.Label htmlFor='wirePostDate'>{type === OperationType.Credit ? labels.transferReceivedDate : labels.transferSentDate}</Form.Label>
                <InputGroup>
                  <FormSelect
                    disabled={!canSetWirePostDate}
                    value={wireMonth}
                    onChange={
                      ((e: React.ChangeEvent<HTMLSelectElement>) => handleWireMonthChange(+e.target.value))
                    }
                  >
                    {DateTimeInfo.months()
                      .map((m, index) => <option key={index + 1} value={index + 1} >{m}</option>)
                    }
                  </FormSelect>
                  <FormSelect
                    disabled={!canSetWirePostDate}
                    value={wireDay}
                    onChange={
                      (({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => handleWireDayChange(+value))
                    }
                  >
                    {[...Array(DateTime.local(wireYear, wireMonth).daysInMonth).keys()]
                      .map((index) => <option key={index} value={index + 1}>{index + 1}</option>)
                    }
                  </FormSelect>
                  <Form.Control
                    disabled={!canSetWirePostDate}
                    type='number' value={Number(wireYear).toString()} onChange={
                      ((e: React.ChangeEvent<HTMLInputElement>) => handleWireYearChange(+e.target.value))}
                  />
                </InputGroup>
              </Form.Group>
            </Row>
          </Card.Body>
          <Card.Footer>
            <Row>
              <Col xs={12} lg={8} className='d-flex justify-content-start'>
                {(ready && !canPost) && <span className='text-danger'>
                  {`Cannot post this request because ${cantPostReasons.filter((t) => !!t).join(' & ')}.`}
                </span>}
              </Col>
              <Col xs={12} lg={4} className='d-flex justify-content-end align-items-end'>
                <Button
                  disabled={!clickPostButton}
                  variant="primary"
                  onClick={handlePostClicked}
                >
                  {postingOrLoadingRequest
                    ? <Spinner size='sm' animation='grow' />
                    : labels.postRequest}
                </Button>
              </Col>
            </Row>
          </Card.Footer>
        </Card>
      </Form>
    </>
  );
}

export const TransferInformation = React.memo(transferInformation);
