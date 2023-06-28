/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import { DateTime } from 'luxon';
import { Cell } from 'react-table';
import { formats, currency, percent } from '@helpers';
import { IExpandedStatement } from '@interfaces';
import { accountStatementsLabels as labels } from '@client/js/labels';
import Chart from '@containers/Dashboard.StatementChart';
import SmallStatementsTable from '@containers/SmallStatementsTable';
import { useAccount, useStatements } from '@admin/admin.store';
import StatementDetails from '../StatementDetails';
import Table from '../Table';

export const AccountStatementsComponent = (props: {
  accountNumber: string;
}) => {
  const {
    accountNumber,
  } = props;
  const { account } = useAccount(accountNumber);
  const { obMonth, obYear } = account;
  const { statements, statementsLoading: loadingStatements } = useStatements(accountNumber);

  const [detailsMonth, setDetailsMonth] = useState<number>(null);
  const [detailsYear, setDetailsYear] = useState<number>(null);
  const clickedShowDetailsForMonth = (month: number, year: number) => {
    setDetailsMonth(month);
    setDetailsYear(year);
  };
  const closeDetails = () => {
    setDetailsYear(null);
    setDetailsMonth(null);
  };
  const rowClicked = (index: number) => {
    const { month, year } = statements?.[index];
    if (month && year) { clickedShowDetailsForMonth(month, year); }
  };

  const latestStatement = statements.length && statements
    .reduce((latest, currSt) => {
      if (
        DateTime.fromFormat(`${latest.month}-${latest.year}`, 'M-yyyy')
          > (DateTime.fromFormat(`${currSt.month}-${currSt.year}`, 'M-yyyy'))
      ) { return latest; } return currSt;
    });
  const latestStatementROI = (statements.length && latestStatement.netReturn && latestStatement.netReturn / latestStatement.openingBalance);
  const latestStatementDollars = latestStatement.netReturn;

  const YTDStatements = statements.filter(({ year }) => year === DateTime.now().year);
  const YTDROI = (YTDStatements.length && YTDStatements
    .reduce((t, s) => t * (1 + ((s.netReturn / s.openingBalance) || 0)), 1) - 1);
  const YTDDollars = (YTDStatements.length && YTDStatements
    .reduce((t, s) => t + (s.netReturn || 0), 0));

  const runningYearStatements = statements.filter(({ year, month }) => {
    const eachMonth = DateTime.fromObject({ month, year });
    const thisMonthLastYear = DateTime.now().minus({ year: 1 });
    return eachMonth.valueOf() >= thisMonthLastYear.valueOf();
  });
  const runningYearROI = (runningYearStatements.length && runningYearStatements
    .reduce((t, s) => t * (1 + ((s.netReturn / s.openingBalance) || 0)), 1) - 1);
  const runningYearDollars = (runningYearStatements.length && runningYearStatements
    .reduce((t, s) => t + s.netReturn, 0));

  const lifetimeROI = (statements.length
    && statements.reduce((t, s) => t * (1 + ((s.netReturn / s.openingBalance) || 0)), 1) - 1);
  const lifetimeDollars = (statements.length
    && statements.reduce((t, s) => t + s.netReturn, 1));

  const currentBal = !latestStatement ? 0 : latestStatement.endBalance;
  const currentBalDisplay = currency(currentBal);
  const currentStatementEndDate = DateTime.fromFormat(`${latestStatement.month || obMonth}-${latestStatement.year || obYear}`, 'M-yyyy')
    .minus({ month: latestStatement ? 0 : 1 })
    .endOf('month').toFormat(formats.lastStatementDate);

  const data = statements
    .map((s) => ({
      ...s,
      date: { month: s.month, year: s.year },
      credits: s.operations.reduce((total, { amount }) => (amount > 0 ? total + amount : total), 0),
      distributions: s.operations.reduce((total, { amount }) => (amount < 0 ? total + amount : total), 0),
    }))
    .sort((a, b) => {
      if (a.year > b.year) return -1;
      if (a.year === b.year) {
        if (a.month > b.month) return -1;
        if (a.month === b.month) return 0;
        if (a.month < b.month) return 1;
      }
      return 1;
    });

  return (
    <>
      <div>
        <Row>
          <Col xs={12} sm='auto'>
            <Row className='mb-2'>
              <Col xs='auto' className='d-flex align-items-center'>
                <span className='fs-5'><strong>{currentBalDisplay}</strong></span>
              </Col>
              <Col className='d-flex align-items-center justify-content-end justify-content-sm-start'>
                <span className='fs-6'>{labels.BalanceHeader.replace(/\{1\}/, currentStatementEndDate)}</span>
              </Col>
            </Row>
          </Col>
          <Col xs={12} sm='auto'>
            <Row>
            {statements?.length ? <>
                <Col xs={12} sm={6}>
                  <Row>
                    <Col xs='4'>
                      <span>{labels.LastStatementReturn}:</span>
                    </Col>
                    <Col xs='5'>
                        <Badge bg='success'>{currency(latestStatementDollars)}</Badge>
                    </Col>
                    <Col xs='3'>
                        <Badge bg='info'>{percent(latestStatementROI)}</Badge>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs='4'>
                      <span>{labels.YTDReturn}:</span>
                    </Col>
                    <Col xs='5'>
                      <Badge bg='success'>{currency(YTDDollars)}</Badge>
                    </Col>
                    <Col xs='3'>
                      <Badge bg='info'>{percent(YTDROI)}</Badge>
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} sm={6}>
                  <Row>
                    <Col xs='4'>
                      <span>{labels.RunningYearROI}:</span>
                    </Col>
                    <Col xs='5'>
                      <Badge bg='success'>{currency(runningYearDollars)}</Badge>
                    </Col>
                    <Col xs='3'>
                      <Badge bg='info'>{percent(runningYearROI)}</Badge>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs='4'>
                      <span>{labels.LifetimeReturn}:</span>
                    </Col>
                    <Col xs='5'>
                      <Badge bg='success'>{currency(lifetimeDollars)}</Badge>
                    </Col>
                    <Col xs='3'>
                      <Badge bg='info'>{percent(lifetimeROI)}</Badge>
                    </Col>
                  </Row>
                </Col>
              </> : null}
            </Row>
          </Col>
        </Row>
        <Row className='mt-2'><Col>
          <Chart accountNumber={accountNumber}/>
        </Col></Row>
        <hr />
        <Row>
          {statements && !statements.length && !loadingStatements
            ? <em>{labels.NoStatements}</em>
            : <>
                <div className='d-none d-lg-flex'>
                  <Table
                    id='accountStatements'
                    loading={loadingStatements}
                    rowClickHandler={rowClicked}
                    manualPagination={false}
                    initialPageSize={5}
                    disableSearch={true}
                    data={data}
                    itemLabelPlural='statements'
                    columns={
                    [
                      {
                        accessor: 'date',
                        Header: labels.Statements.Date,
                        disableGlobalFilter: true,
                        disableFilters: true,
                        Cell: function DateCell({ value: { month, year } }: Cell<IExpandedStatement,
                          { month: number;
                            year: number;
                          }>) {
                          return (
                          <span>
                            {DateTime.fromFormat(`${month}-${year}`, 'M-yyyy').toFormat(formats.statementDate)}
                          </span>
                          );
                        },
                      },
                      {
                        accessor: 'openingBalance',
                        Header: labels.Statements.OpeningBalance,
                        disableGlobalFilter: true,
                        disableFilters: true,
                        Cell: function OpeningBalanceCell({ value: openingBalance }: Cell<IExpandedStatement, IExpandedStatement['openingBalance']>) {
                          return (currency(openingBalance));
                        },
                      },
                      {
                        accessor: 'grossReturn',
                        Header: labels.Statements.DividendAmount,
                        disableGlobalFilter: true,
                        disableFilters: true,
                        Cell: function GrossReturnCell({ value: grossReturn }: Cell<IExpandedStatement, IExpandedStatement['grossReturn']>) {
                          return (currency(grossReturn));
                        },
                      },
                      {
                        accessor: 'feeTotal',
                        Header: labels.Statements.PerformanceFee,
                        disableGlobalFilter: true,
                        disableFilters: true,
                        Cell: function FeeTotalCell({ value: feeTotal }: Cell<IExpandedStatement, IExpandedStatement['feeTotal']>) {
                          return (currency(feeTotal));
                        },
                      },
                      {
                        accessor: 'netReturn',
                        Header: labels.Statements.NetReturn,
                        disableGlobalFilter: true,
                        disableFilters: true,
                        Cell: function NetReturnCell({
                          row: { values: { openingBalance } },
                          value: netReturn,
                        }: Cell<IExpandedStatement, IExpandedStatement['netReturn']>) {
                          return (<span>{currency(netReturn)}&nbsp;|&nbsp;{percent((openingBalance && netReturn) ? netReturn / openingBalance : 0)}</span>);
                        },
                      },
                      {
                        accessor: 'credits',
                        Header: labels.Statements.Credits,
                        disableGlobalFilter: true,
                        disableFilters: true,
                        Cell: function CreditsCell({ value }: Cell<IExpandedStatement, number>) {
                          return (currency(value));
                        },
                      },
                      {
                        accessor: 'distributions',
                        Header: labels.Statements.Distributions,
                        disableGlobalFilter: true,
                        disableFilters: true,
                        Cell: function DistributionsCell({ value }: Cell<IExpandedStatement, number>) {
                          return (currency(value));
                        },
                      },
                      {
                        accessor: 'endBalance',
                        Header: labels.Statements.ClosingBalance,
                        disableGlobalFilter: true,
                        disableFilters: true,
                        Cell: function EndBalanceCell({ value }: Cell<IExpandedStatement, IExpandedStatement['endBalance']>) {
                          return (currency(value));
                        },
                      },
                    ]}
                    cardHeaderColumns={['date']}
                    cardLabels={true}
                  />
                </div>
                <div className='d-flex d-lg-none'>
                  <SmallStatementsTable
                    clickHandler={clickedShowDetailsForMonth}
                    accountNumber={accountNumber}
                  />
                </div>
              </>
        }
        </Row>
        <hr/>
      </div>
      {!!(detailsMonth && detailsYear) && <StatementDetails month={detailsMonth} year={detailsYear} accountNumber={accountNumber} handleClose={closeDetails}/>}
    </>
  );
};

export default AccountStatementsComponent;
