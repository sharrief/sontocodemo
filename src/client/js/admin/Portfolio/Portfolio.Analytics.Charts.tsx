/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector } from 'react-redux';
import { DateTime } from 'luxon';
import { Pie, Bar } from 'react-chartjs-2';
import { ChartOptions, ChartData, Chart } from 'chart.js';
import CombinedState, { DefaultPortfolioStatementsState } from '@store/state';
import { currency, percent, formats } from '@helpers';
import { Portfolio as labels } from '@client/js/labels';
import { createSelector } from 'reselect';
import { createSlice } from '@reduxjs/toolkit';

export const PortfolioAccountsSlice = createSlice({
  name: 'PortfolioAccounts',
  initialState: DefaultPortfolioStatementsState,
  reducers: {
  },
});

const selectPortfolioAccountsState = createSelector([
  (state: CombinedState) => state.portfolioSummaryState.totalsByMonth,
  (state: CombinedState) => state.managersState.selectedManagerIds,
  (state: CombinedState) => state.portfolioStatementsState.latestTradeMonth,
], (balances, selectedManagerIds, latestTradeMonth) => ({
  balances, selectedManagerIds, latestTradeMonth,
}));

function accountBalancesPieChart() {
  const {
    balances,
    selectedManagerIds,
  } = useSelector(selectPortfolioAccountsState);

  const statementsSortedByMonth = balances.slice()
    .sort(({ month: mA, year: yA }, { month: mB, year: yB }) => {
      const dateA = DateTime.fromFormat(`${mA}-${yA}`, 'M-yyyy');
      const dateB = DateTime.fromFormat(`${mB}-${yB}`, 'M-yyyy');
      return (dateA > dateB ? -1 : 1);
    });

  const [mostRecentMonth] = statementsSortedByMonth || [{
    month: Number(DateTime.now().toFormat('M')),
    year: Number(DateTime.now().toFormat('y')),
  }];
  const mostRecentMonthBalances = balances
    .filter(({ month, year, fmId }) => month === Number(mostRecentMonth.month)
      && year === Number(mostRecentMonth.year)
      && (selectedManagerIds.includes(fmId)))
    .sort(({ endBalance: a }, { endBalance: b }) => (a < b ? 1 : -1));

  const totalUnderManagement = mostRecentMonthBalances
    .reduce((total, statement) => total + statement.endBalance, 0);
  const lastMonthBalancesSortedForPie = mostRecentMonthBalances.slice().reverse();
  const pieData: ChartData = {
    labels: lastMonthBalancesSortedForPie
      .map(({ displayName }) => displayName),
    datasets: [{
      label: labels.AccountBalance,
      data: lastMonthBalancesSortedForPie.map(({ endBalance }) => endBalance),
      backgroundColor: lastMonthBalancesSortedForPie
        .map(({ endBalance }) => `rgba(50,93,136,${Math.max((endBalance / totalUnderManagement) * 10, 0.05)})`),
    }],
  };
  const pieOptions: ChartOptions = {
    ...Chart.defaults.pie,
    responsive: true,
    aspectRatio: 1,
    legend: { display: false },
    title: {
      display: true,
      text: labels.AccountBalances,
    },
    tooltips: {
      callbacks: {
        label: function tooltipCallback({ index }, data) {
          return `${data.labels[index]}: ${currency(Number(data.datasets[0].data[index]))} | ${percent(Number(data.datasets[0].data[index]) / totalUnderManagement)}`;
        },
      },
    },
  };

  return (
    <Pie data={pieData} options={pieOptions} />
  );
}

export const AccountBalancesPieChart = React.memo(accountBalancesPieChart);

function accountBalancesBarChart() {
  const {
    balances,
    selectedManagerIds,
    latestTradeMonth,
  } = useSelector(selectPortfolioAccountsState);

  const statementsSortedByMonth = balances.slice()
    .sort(({ month: mA, year: yA }, { month: mB, year: yB }) => {
      const dateA = DateTime.fromFormat(`${mA}-${yA}`, 'M-yyyy');
      const dateB = DateTime.fromFormat(`${mB}-${yB}`, 'M-yyyy');
      return (dateA > dateB ? -1 : 1);
    });

  const [mostRecentMonth] = statementsSortedByMonth || [{
    month: Number(DateTime.now().toFormat('M')),
    year: Number(DateTime.now().toFormat('y')),
  }];
  const mostRecentMonthBalances = balances
    .filter(({ month, year, fmId }) => month === Number(mostRecentMonth.month)
      && year === Number(mostRecentMonth.year)
      && (selectedManagerIds.includes(fmId)))
    .sort(({ endBalance: a }, { endBalance: b }) => (a < b ? 1 : -1));

  const monthsBack = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    .reverse().map((offsetBy) => DateTime.fromObject(latestTradeMonth).minus({ months: offsetBy }));
  const barData: ChartData = {
    labels: monthsBack.map((luxonMonth) => luxonMonth.toFormat(formats.chartMonth)),
    datasets: mostRecentMonthBalances.slice(0, 5).map((account, index) => ({
      label: `${account.displayName}`,
      type: 'line',
      fill: false,
      data: monthsBack.map((luxonMonth) => balances
        // TODO sort this once so we don't have to use filter
        .filter(({ userId, month, year }) => (
          userId === account.userId
          && luxonMonth.month === month
          && luxonMonth.year === year
        ))
        .map(({ endBalance }) => endBalance)),
      borderColor: `rgba(50,93,136,${(5 - index) / 5})`,
      yAxisID: 'y-axis-1',
    })),
  };
  const barOptions: ChartOptions = {
    responsive: true,
    aspectRatio: 2,
    maintainAspectRatio: false,
    tooltips: {
      mode: 'nearest',
      callbacks: {
        label: function tooltipCallback(item, data) {
          return `${data.datasets[item.datasetIndex].label}: ${currency(Number(data.datasets[0].data[item.index]))}`;
        },
      },
    },
    title: {
      display: true,
      text: labels.AccountsTop5,
    },
    scales: {
      yAxes: [{
        id: 'y-axis-1',
        display: true,
        position: 'left',
        ticks: {
          suggestedMax: mostRecentMonthBalances.length && mostRecentMonthBalances[0].endBalance,
          callback: (value) => currency(Number(value)),
        },
      }],
    },
  };

  return (
    <Bar data={barData} options={barOptions} />
  );
}

export const AccountBalancesBarChart = React.memo(accountBalancesBarChart);
