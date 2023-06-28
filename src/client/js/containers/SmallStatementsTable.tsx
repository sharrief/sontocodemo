import React, { useState, useEffect } from 'react';
import TransferIcon from '@mui/icons-material/SwapHorizontalCircle';
import SkipNext from '@mui/icons-material/SkipNext';
import SkipPrevious from '@mui/icons-material/SkipPrevious';
import TrendingDown from '@mui/icons-material/TrendingDown';
import TrendingFlat from '@mui/icons-material/TrendingFlat';
import TrendingUp from '@mui/icons-material/TrendingUp';
import DocumentIcon from '@mui/icons-material/Description';

import { DateTime } from 'luxon';
import {
  Accordion, Button, Col, Form, InputGroup, Row, Spinner,
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { currency, percent } from '@helpers';
import CombinedState from '@store/state';
import { useOperations, useStatements } from '../admin/admin.store';

const selector = createSelector([
  (state: CombinedState) => state.global.theme,
], (theme) => ({ theme }));

function SmallTable(props: {
  clickHandler: (month: number, year: number) => void;
  accountNumber: string;
}) {
  const { clickHandler, accountNumber } = props;
  const { theme } = useSelector(selector);
  const { statements, statementsLoading: loadingStatements } = useStatements(accountNumber);
  const latestStatement = statements.length && statements
    .reduce((latest, currSt) => {
      if (
        DateTime.fromFormat(`${latest.month}-${latest.year}`, 'M-yyyy')
          > (DateTime.fromFormat(`${currSt.month}-${currSt.year}`, 'M-yyyy'))
      ) { return latest; } return currSt;
    });
  const earliestStatement = statements.length && statements
    .reduce((latest, currSt) => {
      if (
        DateTime.fromFormat(`${latest.month}-${latest.year}`, 'M-yyyy')
          < (DateTime.fromFormat(`${currSt.month}-${currSt.year}`, 'M-yyyy'))
      ) { return latest; } return currSt;
    });
  const { operations, operationsLoading } = useOperations(accountNumber);
  const [selectedYearPage, setYearPage] = useState(latestStatement.year);
  const pageBack = () => { setYearPage(Math.max(earliestStatement.year, selectedYearPage - 1)); };
  const pageNext = () => { setYearPage(Math.min(latestStatement.year, selectedYearPage + 1)); };
  useEffect(() => {
    setYearPage(latestStatement.year);
  }, [statements]);
  if (loadingStatements) return <Spinner animation='grow' />;
  return <Col>
    <Row className='mb-2'>
      <Accordion className='statements-list-small'>
        {statements
          .filter(({ year: y }) => y === selectedYearPage)
          .map((statement) => {
            const statementDate = DateTime.fromObject({ month: statement.month, year: statement.year }).toFormat('MMMM yyyy');
            const {
              gainLoss, endBalance, openingBalance, grossReturn, feeTotal, month, year,
            } = statement;
            const opsTotal = operations && operations
              .filter(({ month: m, year: y }) => m === statement.month && y === statement.year)
              .reduce((t, o) => t + o.amount, 0);
            const textColor = (() => {
              if (gainLoss < 0) return 'text-danger';
              if (gainLoss > 0) return 'text-success';
              return '';
            })();
            const trend = (() => {
              if (gainLoss < 0) return <TrendingDown />;
              if (gainLoss > 0) return <TrendingUp />;
              return <TrendingFlat />;
            })();
            return <Accordion.Item eventKey={`${statement.id}`} key={statement.id} className={(theme === 'vapor' || theme === 'darkly') ? 'border-info border-1' : ''}>
            <Accordion.Header>
              <Row className='align-items-center justify-content-between w-100'>
                <Col>
                  <Row>
                    <Col>
                      {loadingStatements ? <Spinner animation='grow' size='sm' /> : <Row className='align-items-center'>
                        <Col xs={2} className={textColor}>{trend}</Col>
                        <Col>{currency(gainLoss)}</Col>
                        </Row>}
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      {operationsLoading ? <Spinner animation='grow' size='sm' /> : <Row className='align-items-center'>
                        <Col xs={2}><TransferIcon /></Col>
                        <Col>{currency(opsTotal)}</Col>
                        </Row>}
                    </Col>
                  </Row>
                </Col>
                <Col>
                  <Row>
                    <Col className='text-end'>{statementDate}</Col>
                  </Row>
                  <Row>
                    <Col className='text-end'>
                      <strong>{currency(endBalance)}</strong>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Accordion.Header>
            <Accordion.Body>
              <Row>
                <Col>
                  <Row>
                    <Col>
                      <span>Start</span>
                    </Col>
                    <Col className='text-end'>
                      <strong>{currency(openingBalance)}</strong>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <span>Gross</span>
                    </Col>
                    <Col className='text-end'>
                      <em>{currency(grossReturn)}</em>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <span>Fee</span>
                    </Col>
                    <Col className='text-end'>
                      <em>{` - ${currency(feeTotal)}`}</em>
                      <hr className='m-0'/>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <span>Net {openingBalance ? `(${percent((gainLoss / openingBalance))})` : null}</span>
                    </Col>
                    <Col className='text-end'>
                      {currency(gainLoss)}
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <span>Transfers</span>
                    </Col>
                    <Col className='text-end'>
                      {currency(opsTotal)}
                    </Col>
                  </Row>
                  <hr/>
                  <Row>
                    <Col>
                      <span>End:</span>
                    </Col>
                    <Col className='text-end'>
                      <strong>{currency(endBalance)}</strong>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row><Button onClick={() => clickHandler(month, year)}><DocumentIcon /> PDF</Button></Row>
            </Accordion.Body>
          </Accordion.Item>;
          })}
      </Accordion>
    </Row>
    <Row>
      <InputGroup>
        <Button onClick={pageBack}><SkipPrevious/></Button>
        <Form.Control className='text-center' readOnly value={selectedYearPage}/>
        <Button onClick={pageNext}><SkipNext /></Button>
      </InputGroup>
    </Row>
  </Col>;
}

export default React.memo(SmallTable);
