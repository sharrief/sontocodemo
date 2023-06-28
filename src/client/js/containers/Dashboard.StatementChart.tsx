/* eslint-disable no-param-reassign */
import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { Bar } from 'react-chartjs-2';
import { ChartOptions, ChartData } from 'chart.js';
import { DefaultPortfolioStatementsState } from '@store/state';
import { currency, currencyShort, formats } from '@helpers';
import { createSlice } from '@reduxjs/toolkit';
import {
  getLatestTradeMonth, useOperations, getStatementChartStatements, useStatements, useAccount,
} from '@admin/admin.store';
import FormRange from 'react-bootstrap/esm/FormRange';
import { Row, Col } from 'react-bootstrap';
import ZoomIn from '@mui/icons-material/ZoomIn';
import ZoomOut from '@mui/icons-material/ZoomOut';

export const PortfolioAccountsSlice = createSlice({
  name: 'PortfolioAccounts',
  initialState: DefaultPortfolioStatementsState,
  reducers: {
  },
});

function fillRange(start: number, end: number) {
  return Array(end - start + 1).fill('').map((_item, index) => start + index);
}

function AccountBalancesBarChart(props: { accountNumber: string}) {
  const {
    accountNumber,
  } = props;
  const { account } = useAccount(accountNumber);

  const { month: tradeMonth, year: tradeYear } = getLatestTradeMonth();
  const latestTradeDateTime = DateTime.fromObject({ month: tradeMonth, year: tradeYear });

  const { statements } = useStatements(account.accountNumber);
  const { operations } = useOperations(account.accountNumber);

  const [monthsBack, setMonthsBack] = useState(-6);

  const { balances, accumulatedOperations } = getStatementChartStatements(account, statements, operations);
  const maxBalance = balances.reduce((t, s) => Math.max(t, s.endBalance), 0);
  const minBalance = balances.reduce((t, s) => Math.min(t, s.endBalance), 99999999);

  const oldestStatementMonthsBack = (() => {
    if (balances?.length) {
      const { month, year } = balances[balances.length - 1];
      return Math.abs(DateTime.fromObject({ month, year }).diff(latestTradeDateTime, 'months').months);
    }
    return 0;
  })();

  const handleMonthsBackChanged = (value: number) => value !== null && setMonthsBack(value);

  const months = fillRange(0, Math.max(1, Math.abs(monthsBack)))
    .reverse().map((offsetBy) => DateTime.fromObject({ month: tradeMonth, year: tradeYear }).minus({ months: offsetBy }));

  const balancesByMonthsBack = months.map((date) => balances.find(({ month, year }) => date.month === month && date.year === year) || { endBalance: 0 });
  const operationsByMonthsBack = months.map((date) => accumulatedOperations.find(({ monthYear }) => date.toFormat('M-yyyy') === monthYear) || { total: 0 });

  const barData: ChartData = {
    labels: months.map((luxonMonth) => luxonMonth.toFormat(formats.chartMonth)),
    datasets: [
      {
        label: 'Deposits',
        type: 'line',
        fill: 'origin',
        data: operationsByMonthsBack.map(({ total }) => total),
        yAxisID: 'y-axis-1',
      },
      {
        label: 'Balance',
        type: 'line',
        fill: 0,
        backgroundColor: 'rgba(147,197,75,.3)',
        data: balancesByMonthsBack.map(({ endBalance }) => endBalance),
        borderColor: `rgba(236,188,30,${3 / 5})`,
        yAxisID: 'y-axis-1',
      },
    ],
  };
  const barOptions: ChartOptions = {
    legend: { display: false },
    responsive: true,
    aspectRatio: 2,
    maintainAspectRatio: false,
    tooltips: {
      mode: 'nearest',
      callbacks: {
        label: function tooltipCallback(item, { datasets }) {
          if (item.datasetIndex === 0) {
            return `${datasets[item.datasetIndex].label}: ${currency(Number(datasets[item.datasetIndex].data[item.index]))}`;
          }
          return `${datasets[item.datasetIndex].label}: ${currency(Number(datasets[item.datasetIndex].data[item.index]))}\nDividends: ${currency(Number(
            (+datasets[item.datasetIndex].data[item.index]) - (+datasets[item.datasetIndex - 1].data[item.index]),
          ))}`;
        },
      },
    },
    title: {
      display: false,
    },
    scales: {
      yAxes: [{
        id: 'y-axis-1',
        display: true,
        position: 'left',
        ticks: {
          beginAtZero: false,
          suggestedMin: minBalance,
          suggestedMax: maxBalance,
          maxTicksLimit: 6,
          callback: (value) => currencyShort(Number(value)),
        },
      }],
    },
  };

  return (
    <>
    <Row>
      <Col>
        <Bar data={barData} options={barOptions} />
      </Col>
    </Row>
    <Row>
      <Col>
        <div className='d-flex flex-direction-row align-items-center'>
          <ZoomOut style={{ fontSize: '1.2em', color: '#999', cursor: 'pointer' }} onClick={() => handleMonthsBackChanged(monthsBack - 1)}/>
          <FormRange min={-oldestStatementMonthsBack} max={-1} onChange={(e) => handleMonthsBackChanged(+e?.target?.value)} value={monthsBack} />
          <ZoomIn style={{ fontSize: '1.2em', color: '#999', cursor: 'pointer' }} onClick={() => handleMonthsBackChanged(monthsBack + 1)}/>
        </div>
      </Col>
    </Row>
    </>
  );
}

export default React.memo(AccountBalancesBarChart);
