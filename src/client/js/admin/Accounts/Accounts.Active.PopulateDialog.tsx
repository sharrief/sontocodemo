import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from 'react-bootstrap/esm/Button';
import Form from 'react-bootstrap/esm/Form';
import GenerateIcon from '@mui/icons-material/PostAdd';
import { DateTime } from 'luxon';
import { PopulateStatementsDialog as Labels } from '@labels';
import {
  Accordion,
  Card,
  Col, InputGroup, Row, Spinner,
} from 'react-bootstrap';
import { oldStatementPopulatedEmailTemplate } from '@email';
import DropdownItem from 'react-bootstrap/esm/DropdownItem';
import { getLatestTradeMonth, useAccounts, useStatements } from '@admin/admin.store';
import { useTradesROI } from '@admin/trades.store';
import ResponsiveModal from '@client/js/components/Modal';
import { percent } from '@client/js/core/helpers';
import { API } from '@api';
import useSiteMetadata from '@client/js/core/useSiteMetadata';
import { populatePortfolioStatements } from './Accounts.Active.Populate';

const MM_YYYY = 'MM-yyyy'; // dateID format in this file
const MMMM_YYYY = 'MMMM yyyy';

const PopulateStatementsDialog = ({ accountIds, asDropdownItem, onClose }: {
  accountIds: number[];
  asDropdownItem: boolean;
  onClose?: (populationComplete?: boolean) => void;
}) => {
  const dispatch = useDispatch();
  const { siteUrl } = useSiteMetadata();
  const { accounts } = useAccounts();
  const { tradeMonths } = useTradesROI();
  const { month, year } = getLatestTradeMonth();

  const tradeMonthsSortedDescending = tradeMonths?.sort((a, b) => {
    const dateA = DateTime.fromObject({ month: a.month, year: a.year });
    const dateB = DateTime.fromObject({ month: b.month, year: b.year });
    if (dateA.valueOf() > dateB.valueOf()) return -1;
    return 1;
  }).map((tradeMonth) => ({
    ...tradeMonth,
    dateID: DateTime.fromObject({
      month: tradeMonth.month,
      year: tradeMonth.year,
    }).toFormat(MM_YYYY),
  }));

  const [fromMonth, setFromMonth] = useState('');
  useEffect(() => {
    if (month && year) setFromMonth(DateTime.fromObject({ month, year }).toFormat(MM_YYYY));
  }, [month, year]);
  const fromMonthDateTime = DateTime.fromFormat(fromMonth, MM_YYYY);
  const fromMonthDateObject = { month: fromMonthDateTime.month, year: fromMonthDateTime.year };
  const fromDateString = fromMonthDateTime.isValid && fromMonthDateTime.toFormat(MMMM_YYYY);
  const fromMonths = tradeMonthsSortedDescending;
  const toDateString = DateTime.fromObject({ month, year }).isValid && DateTime.fromObject({ month, year }).toFormat(MMMM_YYYY);

  const [sendEmails, setSendEmails] = useState(false);
  const handleSendEmailsToggled = () => setSendEmails(!sendEmails);

  const selectedAccounts = accounts.filter(({ id }) => accountIds.includes(id));
  const name = selectedAccounts?.length === 1 && `${selectedAccounts[0].displayName} ${selectedAccounts[0].accountNumber}`;
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const handleOpen = () => setShow(true);
  const handleClose = (populationCompleted?: boolean) => {
    if (!busy || populationCompleted) {
      if (onClose) onClose(populationCompleted);
      setShow(false);
    }
  };
  const buttonContent = <><GenerateIcon /> <span className='d-none d-lg-inline'>{Labels.PopulateStatements}</span></>;
  const menuItemContent = <><GenerateIcon /> <span>{Labels.PopulateStatements}</span></>;
  const openDisabled = !accountIds.length;
  const populateDisabled = !fromMonth || busy;

  const populateStatements = async () => {
    setBusy(true);
    API.Statements.PopulateComplete.on(() => {
      setBusy(false);
      handleClose(true);
    });
    populatePortfolioStatements({
      userIds: accountIds,
      sendEmails,
      monthAndYear: fromMonthDateObject,
      dispatch,
    });
  };

  return <>
  <ResponsiveModal
    show={show}
    handleClose={handleClose}
    header={<span className='fs-5'>{Labels.PopulateStatements}</span>}
    body={<>
      <InputGroup>
        <InputGroup.Text>{Labels.PopulateFrom}</InputGroup.Text>
        <Form.Select
          isInvalid={!fromMonth}
          value={fromMonth}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFromMonth(e.target.value)}
        >
          <option>{Labels.SelectFromMonth}</option>
          {fromMonths?.map((tradeMonth) => <option
            key={tradeMonth.dateID}
            value={tradeMonth.dateID}
            >
              {DateTime.fromFormat(tradeMonth.dateID, MM_YYYY).toFormat(MMMM_YYYY)} | {percent(tradeMonth.interest / 100)}
            </option>)}
        </Form.Select>
      </InputGroup>
      <div className='mt-2 mb-2'>{Labels.UpdateStatementsPrompt(fromDateString, toDateString, accountIds.length, name)}</div>
      <Accordion activeKey={sendEmails ? 'email' : ''}>
        <Card>
        <Accordion.Button as={Card.Header} variant='link'>
          <Form.Switch
            label={Labels.SendEmails}
            checked={sendEmails}
            onChange={handleSendEmailsToggled}
          />
        </Accordion.Button>
        <Accordion.Collapse eventKey='email'>
            <Card.Body>
              <em>{Labels.SendEmailDescription}</em>
              {oldStatementPopulatedEmailTemplate({
                name: 'SAMPLE ACCOUNT NAME',
                accountNumber: '0123456789',
                dateString: DateTime.fromObject({ month, year }).toFormat('MMMM yyyy'),
                host: siteUrl,
              })}
            </Card.Body>
        </Accordion.Collapse>
        </Card>
      </Accordion>
    </>}
    footer={<Row className='w-100 justify-content-between g-0'>
      <Col xs='auto'>
        <Button
          variant='secondary'
          onClick={() => handleClose()}>
          {Labels.Cancel}
        </Button>
      </Col>
      <Col xs='auto'><Button
        variant='primary'
        onClick={populateStatements}
        disabled={populateDisabled}>
          {Labels.PopulateStatements} {busy ? <Spinner animation='grow' size='sm'/> : null}
        </Button>
      </Col>
    </Row>}
  />
  {asDropdownItem
    ? <DropdownItem onClick={handleOpen} disabled={openDisabled}>{menuItemContent}</DropdownItem>
    : <Button variant={openDisabled ? 'secondary' : 'success'} onClick={handleOpen} disabled={openDisabled}>{buttonContent}</Button>
  }
  </>;
};

export default React.memo(PopulateStatementsDialog);
