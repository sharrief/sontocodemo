/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import FileSaver from 'file-saver';
import { DateTime } from 'luxon';
import { useSelector, useDispatch } from 'react-redux';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Bar } from 'react-chartjs-2';
import { ChartOptions, ChartData } from 'chart.js';
import CombinedState from '@store/state';
import Table from '@client/js/components/Table';
import { currency, formats } from '@helpers';
import { Portfolio as labels } from '@client/js/labels';
import {
  createSelector,
} from '@reduxjs/toolkit';
import {
  Alert, Card, Spinner,
} from 'react-bootstrap';
import * as Labels from '@labels';
import { AccountBalancesPieChart, AccountBalancesBarChart } from '@admin/Portfolio/Portfolio.Analytics.Charts';
import PortfolioManagerSelector from '@admin/Portfolio/Portfolio.ManagerSelector';
import PortfolioAnalyticsSlice from '@client/js/admin/Portfolio/Portfolio.Analytics.Slice';
import { initPortfolioAnalytics } from '@admin/Portfolio/Portfolio.Thunks';
import { RoleId } from '@interfaces';
import { useNavigate } from 'react-router-dom';
import { useTradesROI } from '../trades.store';
import { getUserInfo } from '../admin.store';

const selectPortfolioSummaryState = createSelector([
  (state: CombinedState) => state.portfolioSummaryState.inited,
  (state: CombinedState) => state.portfolioSummaryState.loading,
  (state: CombinedState) => state.portfolioSummaryState.feeRate,
  (state: CombinedState) => state.portfolioSummaryState.totalsByMonth,
  (state: CombinedState) => state.portfolioStatementsState.latestTradeMonth,
  (state: CombinedState) => state.managersState.selectedManagerIds,
  (state: CombinedState) => state.global.theme,
], (inited, loading, feeRate, totalsByMonth, latestTradeMonth, selectedManagerIds, theme) => ({
  inited, loading, feeRate, totalsByMonth, latestTradeMonth, selectedManagerIds, theme,
}));

function PortfolioSummary() {
  const { userinfo } = getUserInfo();
  const {
    inited,
    loading,
    feeRate,
    totalsByMonth,
    selectedManagerIds,
    theme,
  } = useSelector(selectPortfolioSummaryState);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const setManagerFeeRate = (newFeeRate: number) => dispatch(
    PortfolioAnalyticsSlice.actions.setFeeRate(Math.min(newFeeRate, 30)),
  );
  const isDirectorOrSeniorTrader = [RoleId.admin, RoleId.director, RoleId.seniorTrader].includes(userinfo?.roleId);
  useEffect(() => {
    if (userinfo && !isDirectorOrSeniorTrader) {
      navigate(-1);
    }
  }, [userinfo]);

  useEffect(() => {
    if (!inited) {
      dispatch(initPortfolioAnalytics());
    }
  }, [inited]);

  const { tradeMonths } = useTradesROI();

  const monthlyStatements = (tradeMonths?.map(({ month, year, interest }) => ({ month: DateTime.fromObject({ month, year }), interest })) ?? [])
    .sort(({ month: monthA }, { month: monthB }) => {
      if (
        monthA.valueOf() > monthB.valueOf()
      ) return 1;
      return -1;
    })
    .map(({ month: luxonMonth }) => ({
      month: luxonMonth,
      statements: totalsByMonth
        .filter(({ month, year, fmId }) => (
          (selectedManagerIds?.length === 0 || selectedManagerIds.includes(fmId))
        && month === luxonMonth.month
        && year === luxonMonth.year
        ))
        .map((statement) => ({
          ...statement,
          gainLoss: statement.gainLoss / 0.7,
        })),
    }));
  const monthlyGainLossMinMax = {
    suggestedMin: -10000,
    suggestedMax: 10000,
    callback: (value: number) => currency(value),
  };
  const monthlyEndBalanceMinMax = {
    suggestedMin: 10000,
    suggestedMax: 100000,
    callback: (value: number) => currency(value),
  };
  const monthlyGainLoss = monthlyStatements
    .map(({ statements }) => {
      monthlyGainLossMinMax.suggestedMin = statements
        .reduce((min, statement) => Math.min(min, statement.gainLoss), Number.POSITIVE_INFINITY);
      monthlyGainLossMinMax.suggestedMax = statements
        .reduce((max, statement) => Math.max(max, statement.gainLoss), Number.NEGATIVE_INFINITY);
      return statements
        .reduce((total, statement) => total + statement.gainLoss, 0);
    });
  const monthlyCommission = monthlyGainLoss
    .map((gainLoss) => gainLoss * (feeRate / 100));
  const monthlyPerfFee = monthlyGainLoss
    .map((gainLoss) => gainLoss * (0.3 - (feeRate / 100)));
  const monthlyEndBalance = monthlyStatements
    .map(({ statements }) => {
      monthlyEndBalanceMinMax.suggestedMin = statements
        .reduce((min, statement) => Math.min(min, statement.endBalance), 0);
      monthlyEndBalanceMinMax.suggestedMax = statements
        .reduce((max, statement) => Math.max(max, statement.endBalance), 0);
      return statements
        .reduce((total, statement) => total + statement.endBalance, 0);
    });
  const barData: ChartData = {
    labels: monthlyStatements.map(({ month }) => month.toFormat(formats.chartMonth)),
    datasets: [{
      label: 'Net gain/Loss',
      type: 'bar',
      data: monthlyGainLoss.map((gross) => gross * 0.7),
      xAxisID: 'x-axis-1',
      yAxisID: 'y-axis-1',
      fill: true,
      backgroundColor: 'rgba(236, 188, 30, .9)',
      borderColor: 'rgb(99,99,99)',
      stack: 'gainloss',
    },
    {
      label: 'Incentive fee',
      type: 'bar',
      data: monthlyPerfFee,
      xAxisID: 'x-axis-1',
      yAxisID: 'y-axis-1',
      fill: true,
      backgroundColor: 'rgba(236, 188, 30, .7)',
      borderColor: 'rgb(99,99,99)',
      stack: 'gainloss',
    },
    {
      label: 'Commission',
      type: 'bar',
      data: monthlyCommission,
      xAxisID: 'x-axis-1',
      yAxisID: 'y-axis-1',
      fill: true,
      backgroundColor: 'rgba(236, 188, 30, .5)',
      borderColor: 'rgb(99,99,99)',
      stack: 'gainloss',
    },
    {
      label: 'Under management',
      type: 'line',
      data: monthlyEndBalance,
      yAxisID: 'y-axis-2',
      fill: false,
      borderColor: 'rgb(124, 65, 33)',
      backgroundColor: 'rgb(124, 65, 33)',

    },
    ],
  };
  const barOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    tooltips: {
      mode: 'nearest',
      callbacks: {
        label: function tooltipCallback(item, data) {
          return `${data.datasets[item.datasetIndex].label}: ${currency(Number(item.yLabel))}`;
        },
      },
    },
    title: {
      display: true,
      text: labels.PortfolioSummary,
    },
    scales: {
      xAxes: [
        {
          id: 'x-axis-1',
          stacked: true,
        },
      ],
      yAxes: [
        {
          id: 'y-axis-1',
          display: true,
          position: 'left',
          gridLines: {
            display: true,
          },
          stacked: true,
          ticks: monthlyGainLossMinMax,
          scaleLabel: { display: true, labelString: labels.GainLoss },
        },
        {
          id: 'y-axis-2',
          display: true,
          position: 'right',
          gridLines: {
            display: true,
          },
          ticks: monthlyEndBalanceMinMax,
          scaleLabel: { display: true, labelString: labels.UnderManagement },
        },
      ],
    },
  };

  const tableData = monthlyStatements
    .map(({ month, statements }) => {
    // TODO reduce code duplication
      const { eB: endBalance, gL: gainLoss, nO: netOperations } = statements
        .reduce(({ eB, gL, nO }, statement) => ({
          eB: eB + statement.endBalance,
          gL: gL + statement.gainLoss,
          nO: nO + statement.netOperations,
        }), { eB: 0, gL: 0, nO: 0 });
      const netGainLoss = gainLoss * 0.7;
      const commission = gainLoss * (feeRate / 100);
      const incentiveFee = gainLoss * (0.3 - (feeRate / 100));
      return {
        month: month.toFormat('MMM'),
        year: month.toFormat('yyyy'),
        endBalance: currency(endBalance),
        gainLoss: currency(gainLoss),
        netGainLoss: currency(netGainLoss),
        incentiveFee: currency(incentiveFee),
        commission: currency(commission),
        netOperations: currency(netOperations),
      };
    }).reverse();
  const tableColumns = [{
    Header: 'Month',
    accessor: 'month',
    disableGlobalFilter: true,
    disableFilters: true,
  }, {
    Header: 'Year',
    accessor: 'year',
    disableGlobalFilter: true,
    disableFilters: true,
  }, {
    Header: 'Gross gain/loss',
    accessor: 'gainLoss',
    disableGlobalFilter: true,
    disableFilters: true,
  }, {
    Header: `Incentive fee (${(30 - feeRate)}% of Gain/Loss)`,
    accessor: 'incentiveFee',
    disableGlobalFilter: true,
    disableFilters: true,
  }, {
    Header: `Commission (${feeRate}% of Gain/Loss)`,
    accessor: 'commission',
    disableGlobalFilter: true,
    disableFilters: true,
  }, {
    Header: 'Net gain/loss',
    accessor: 'netGainLoss',
    disableGlobalFilter: true,
    disableFilters: true,
  }, {
    Header: 'Net transactions',
    accessor: 'netOperations',
    disableGlobalFilter: true,
    disableFilters: true,
  }, {
    Header: 'Under management',
    accessor: 'endBalance',
    disableGlobalFilter: true,
    disableFilters: true,
  },
  ];
  const exportHandler = () => {
    const lines = ['Month,Year,Gross gain/loss,Incentive fee,Commission,Net gain/loss,Net transactions,Under management\n'];
    lines.push(...monthlyStatements.map(({ month: date, statements }) => {
      const { eB: endBalance, gL: gainLoss, nO: netOperations } = statements
        .reduce(({ eB, gL, nO }, statement) => ({
          eB: eB + statement.endBalance,
          gL: gL + statement.gainLoss,
          nO: nO + statement.netOperations,
        }), { eB: 0, gL: 0, nO: 0 });
      const netGainLoss = gainLoss * 0.7;
      const commission = gainLoss * (feeRate / 100);
      const incentiveFee = gainLoss * (0.3 - (feeRate / 100));
      const month = date.toFormat('MMM');
      const year = date.toFormat('yyyy');
      return `${month}, ${year}, ${gainLoss}, ${incentiveFee}, ${commission}, ${netGainLoss}, ${netOperations}, ${endBalance}\n`;
    }));
    const file = new Blob(lines, { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(file, 'portfolio exported.csv');
  };

  return (
    <Container fluid className='px-0 px-md-3'>
    <Row className='mt-2'>
      <Col xs='12' sm='auto' className='mt-2 mt-sm-0'>
        <InputGroup>
          <InputGroup.Text>
            {labels.ManagerFeeRate}
          </InputGroup.Text>
          <Form.Control
            type='number'
              placeholder='Specify the manager fee percentage'
              value={feeRate.toString()}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setManagerFeeRate(Number(e.target.value)) }
            />
        <InputGroup.Text>%</InputGroup.Text>
        </InputGroup>
      </Col>
      <Col xs='12' sm='auto'>
        <PortfolioManagerSelector />
      </Col>
    </Row>
    {loading && <Row className='mt-2'>
      <Col><Alert variant='primary'>{`${Labels.Portfolio.Loading}`} <Spinner animation='grow' size='sm'/></Alert></Col>
    </Row>}
    <Row className='my-1 g-0' style={{ minHeight: 400 }}>
      <Col>
        <Card style={{ width: '100%', minHeight: '400px' }}>
          <Card.Body>
            <Bar data={barData} options={barOptions} />
          </Card.Body>
        </Card>
      </Col>
    </Row>
    <Row className='g-0 mb-1 justify-content-between'>
      <Col md={6} className='pr-0 pr-md-1'>
        <Card style={{ width: '100%', minHeight: '400px' }}>
          <Card.Body>
            <AccountBalancesPieChart/>
          </Card.Body>
        </Card>
      </Col>
      <Col md={6} className='pl-0 pl-md-1'>
        <Card style={{ width: '100%', minHeight: '400px' }}>
          <Card.Body>
            <AccountBalancesBarChart />
          </Card.Body>
        </Card>
        </Col>
    </Row>
    <Row>
      <Col>
        <Table
        id='portfolioAnalytics'
        rowClickHandler={null}
        manualPagination={false}
        initialPageSize={12}
        disableSearch={true}
        cardHeaderColumns={['month', 'year']}
        cardLabels={true}
        itemLabelPlural='Statements'
        data={tableData}
        columns={React.useMemo(() => tableColumns, [tableColumns])}
        theme={theme}
        exportHandler={exportHandler}
        />
      </Col>
    </Row>
  </Container>
  );
}

export default React.memo(PortfolioSummary);
