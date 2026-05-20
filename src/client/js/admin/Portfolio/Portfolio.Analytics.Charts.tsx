/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector } from 'react-redux';
import { DateTime } from 'luxon';
import { Pie, Bar, ChartData, ChartOptions } from 'chart.js';
import { Chart as ChartJS } from 'chart.js';
import CombinedState, { DefaultPortfolioStatementsState } from '@store/state';
import { currency, percent, formats } from '@helpers';
import { Portfolio as labels } from '@client/js/labels';
import { createSelector } from 'reselect';
import { createSlice } from '@reduxjs/toolkit';

ChartJS.register(
  'bar',
  'line',
  'pie',
  'linear',
  'categoryScale',
  'arc',
  'legend',
  'title',
  'tooltip',
);

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
  const pieData: ChartData<'pie'> = {
    labels: lastMonthBalancesSortedForPie
      .map(({ displayName }) => displayName),
    datasets: [{
      label: labels.AccountBalance,
      data: lastMonthBalancesSortedForPie.map(({ endBalance }) => endBalance),
      backgroundColor: lastMonthBalancesSortedForPie
        .map(({ endBalance }) => `rgba(50,93,136,${Math.max((endBalance / totalUnderManagement) * 10, 0.05)})`),
    }],
  };
  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    aspectRatio: 1,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function tooltipLabel(context: { data: { labels?: string[]; datasets?: { data?: number[] }[] }; dataIndex: number }) {
            const data = context.data;
            const idx = context.dataIndex;
            return `${data.labels![idx]}: ${currency(Number(data.datasets![0].data![idx]))} | ${percent(Number(data.datasets![0].data![idx]) / totalUnderManagement)}`;
          },
        },
      },
      title: {
        display: true,
        text: labels.AccountBalances,
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
  const barData: ChartData<'line'> = {
    labels: monthsBack.map((luxonMonth) => luxonMonth.toFormat(formats.chartMonth)),
    datasets: mostRecentMonthBalances.slice(0, 5).map((account, index) => ({
      label: `${account.displayName}`,
      type: 'line' as const,
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
      yAxis: 'y-axis-1',
    })),
  };
  const barOptions: ChartOptions<'line'> = {
    responsive: true,
    aspectRatio: 2,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'nearest' as const,
        callbacks: {
          label: function tooltipLabel(context: { dataset: { label?: string; data?: number[] }; dataIndex: number; chart: { data: { datasets: { label?: string; data?: number[] }[] } } }) {
            const data = context.chart.data;
            return `${data.datasets![context.datasetIndex].label}: ${currency(Number(data.datasets![0].data![context.dataIndex]))}`;
          },
        },
      },
      title: {
        display: true,
        text: labels.AccountsTop5,
      },
    },
    scales: {
      'y-axis-1': {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          suggestedMax: mostRecentMonthBalances.length && mostRecentMonthBalances[0].endBalance,
          callback: (value: number) => currency(Number(value)),
        },
      },
    },
  };

  return (
    <Bar data={barData} options={barOptions} />
  );
}

export const AccountBalancesBarChart = React.memo(accountBalancesBarChart);
