import React, { useEffect, useState } from 'react';
import {
  IBankDatumTrimmed,
  IRequest,
  OperationType,
  RequestStatus,
} from '@interfaces';
import {
  Spinner, ListGroup, ListGroupItem, Pagination, Col, Row, Form, InputGroup, Card, Accordion,
} from 'react-bootstrap/esm';
import { Activity as labels } from '@labels';
import {
  useOperationsWithRequestsAndBank,
} from '@admin/admin.store';
import { DateTime } from 'luxon';
import { chain } from '@numbers';
import usePagination from '@mui/material/usePagination/usePagination';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { currency } from '@helpers';

const TransactionHistory = ({
  accountNumber,
}: {
  accountNumber: string;
}) => {
  const {
    operations: unsortedOperations, requests, bankAccounts, dataLoading: loading,
  } = useOperationsWithRequestsAndBank(accountNumber);
  const operations = unsortedOperations.sort((a, b) => {
    const dateA = DateTime.fromObject({ month: a.month, year: a.year }).valueOf();
    const dateB = DateTime.fromObject({ month: b.month, year: b.year }).valueOf();
    return dateA > dateB ? -1 : 1;
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  useEffect(() => {
    setPage(1);
  }, [perPage]);
  const perPageOptions = [5, 10, 15, 20, 25, 50];
  const totalPages = Math.ceil(Math.max(chain(operations?.length).divide(perPage).done(), 1));

  const handlePageClicked = (pageNumber: number) => setPage(Math.max(0, Math.min(pageNumber, totalPages)));
  const getPageByIndex = (index: number) => Math.ceil(chain(index + 1).divide(perPage).done());
  const [expanded, setExpanded] = useState(false);
  const handleExpansionToggled = () => setExpanded(!expanded);

  const { items } = usePagination({
    disabled: loading,
    count: totalPages,
    onChange: (e, p) => handlePageClicked(p),
    page,
    showFirstButton: true,
    showLastButton: true,
    boundaryCount: 1,
    siblingCount: 1,
  });

  return (
    <Accordion defaultActiveKey='0' activeKey={expanded ? '1' : '0'}>
      <Card>
        <Card.Header onClick={handleExpansionToggled}>
          <Row>
            <Col xs='11'>
              <span className='fs-5'>{labels.HistoricTransfers}</span>
            </Col>
            <Col xs='1' className='d-flex justify-content-end align-items-center'>
              {expanded ? <ExpandLess/> : <ExpandMore/>}
            </Col>
          </Row>
        </Card.Header>
        <Accordion.Collapse eventKey="1">
          <Card.Body>
            {!operations.length && !loading && <em>{labels.NoHistory}</em>}
            {loading && <div className='d-flex justify-content-center w-100'><Spinner animation='grow' size='sm' /></div>}
            <ListGroup variant='flush'>
              {operations
                .filter((_o, i) => getPageByIndex(i) === page)
                .map((o) => {
                  let request: IRequest;
                  let bankAccount: IBankDatumTrimmed;
                  if (requests?.length) {
                    request = requests.find(({ id }) => id === o.requestId);
                    if (request && bankAccounts?.length) {
                      bankAccount = bankAccounts.find(({ uuid }) => request.bankAccountUUID === uuid);
                    }
                  }
                  const effectiveMonth = DateTime.fromObject({ month: o.month, year: o.year }).toFormat('MMMM yyyy');
                  const requestedDay = request && DateTime.fromMillis(request.datetime).toLocaleString(DateTime.DATE_SHORT);
                  const postedDay = request && DateTime.fromObject({ day: o.day, month: o.month, year: o.year }).toLocaleString(DateTime.DATE_SHORT);
                  const transAmount = currency(o.amount);
                  const transClass = o.type === OperationType.Debit ? '' : 'text-success';
                  const requestInfo = request && `#${request.id}: ${request.status === RequestStatus.Recurring ? 'recurring' : ''} ${request.type} request submitted on ${requestedDay} for ${currency(request.amount)}. `;
                  const operationInfo = o && `Posted on ${postedDay}. `;
                  const bankInfo = bankAccount && `Transfer (less fees) sent to the account ending in ${bankAccount.accountEnding}${bankAccount.bankName ? ` at ${bankAccount.bankName}` : ''}. `;
                  const wireConfirmation = o.wireConfirmation && `Confirmation: ${o.wireConfirmation}. `;
                  return <ListGroupItem key={o.id}>
                    <div className='d-flex flex-row flex-wrap fs-6'>
                      <div className='col-8'>{effectiveMonth}</div>
                      <div className={`col-4 d-flex justify-content-end ${transClass}`}>{transAmount}</div>
                    </div>
                    <div className='d-flex flex-row flex-wrap'>
                      <div className='col-12'>
                        <span>{requestInfo}{operationInfo}</span>
                      </div>
                      <div className='col-12'>
                        <span>{bankInfo}{wireConfirmation}</span>
                      </div>
                    </div>
                  </ListGroupItem>;
                })}
            </ListGroup>
            <Row className='mt-2'>
              <Col>
                <Pagination>
                  {items.map((item, i) => {
                    if (item.type === 'page') {
                      return <Pagination.Item
                        key={i}
                        active={item.selected}
                        onClick={item.onClick}>
                        {item.page}
                      </Pagination.Item>;
                    }
                    if (item.type === 'first') {
                      return <Pagination.First
                        key={i}
                        onClick={item.onClick}
                      />;
                    }
                    if (item.type === 'last') {
                      return <Pagination.Last
                        key={i}
                        onClick={item.onClick}
                      />;
                    }
                    if (item.type === 'previous') {
                      return <Pagination.Prev
                        key={i}
                        onClick={item.onClick}
                      />;
                    }
                    if (item.type === 'next') {
                      return <Pagination.Next
                        key={i}
                        onClick={item.onClick}
                      />;
                    }
                    return null;
                  })}
                </Pagination>
              </Col>
              <Col>
                <InputGroup>
                  <InputGroup.Text>Per page</InputGroup.Text>
                  <Form.Select
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPerPage(+e.target.value)}
                    value={perPage}
                  >
                    {perPageOptions.map((perPageOption, i) => <option key={i} value={perPageOption}>{perPageOption}</option>)}
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
};

export default TransactionHistory;
