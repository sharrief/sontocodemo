import React, { useState } from 'react';
import {
  Accordion, Button,
  Card,
  Badge,
  BadgeProps,
  InputGroup,
  ButtonGroup,
  Form,
} from 'react-bootstrap';
import { chain, percent } from '@numbers';
import {
  CurrencyPair, ITradeEntry, TradeSide,
  TradeModel,
} from '@interfaces';
import { TradeAnalytics as labels } from '@labels';
import { $enum } from 'ts-enum-util';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import { ChartOptions, ChartData, Chart } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import pattern from 'patternomaly';

const pipsWithSign = (number: number) => Intl.NumberFormat('en-US', { signDisplay: 'always' }).format(number);

export const WinLossBadge = (props: {title: string; w?: string|number; l?: string|number; p?: string} & BadgeProps) => <Badge
  {...props}
  className={`${props.className} fs-6 d-flex justify-content-center align-items-center border border-secondary text-dark`} >
  <span>{props.title} {props.p
    ? <span className='text-success'>{props.p}</span>
    : <><span className='text-success'>{props.w}</span> - <span className='text-danger'>{props.l}</span></>
  }
  </span>
</Badge>;

const chartColors = {
  red: '255, 99, 132',
  orange: '255, 159, 64',
  yellow: '255, 205, 86',
  green: '75, 192, 75',
  blue: '54, 162, 235',
  purple: '153, 102, 255',
  gray: '201, 203, 207',
};

type TradeSummary = (ITradeEntry & {isProfit?: boolean; summaryPips?: number });

const TradeLog = (props: { trades: ITradeEntry[]; show: boolean}) => {
  const { trades: selectedBookTrades, show } = props;

  let longTrades = 0;
  let longProfitTrades = 0;
  let shortTrades = 0;
  let shortProfitTrades = 0;

  let totalBookPips = 0;

  const [sliceBy, setSliceBy] = useState<keyof typeof selectedBookTrades[0]>('symbol');
  const handleSliceByCurrencyClicked = () => {
    if (sliceBy !== 'symbol') setSliceBy('symbol');
  };
  const handleSliceByModelClicked = () => {
    if (sliceBy !== 'model') setSliceBy('model');
  };

  const pipsBySlice: {
    [slice: string]: {
      Long: { w: number; l: number; pw: number; pl: number };
      Short: { w: number; l: number; pw: number; pl: number };
    };
  } = {};
  const sliceKeys = $enum(sliceBy === 'symbol' ? CurrencyPair : TradeModel);
  sliceKeys.forEach((slice) => {
    pipsBySlice[slice] = {
      Long: {
        w: 0, l: 0, pw: 0, pl: 0,
      },
      Short: {
        w: 0, l: 0, pw: 0, pl: 0,
      },
    };
  });
  let minMaxPips = 0;
  let maxWinsLosses = 0;

  const selectedBookTradesSummary: TradeSummary[] = [];
  // eslint-disable-next-line no-unused-expressions
  selectedBookTrades?.forEach(({
    entry, exits, pips, side, symbol, model, bookNumber, ...rest
  }) => {
    const isLong = side === TradeSide.Long;
    let thisTradePips = 0;
    const thisTradeSummary: TradeSummary = {
      entry, exits, pips, side, symbol, model, bookNumber, ...rest,
    };
    if (entry) {
      const exitPriceDiffs = exits?.map((exitPrice) => {
        if (!exitPrice) return 0;
        return (isLong ? chain(exitPrice).subtract(entry || 0).done() : chain(entry || 0).subtract(exitPrice).done());
      });
      const exitTotal = chain(exitPriceDiffs?.reduce((sum, curr) => sum + curr, 0) || 0)
        .multiply(4).round(2)
        .done();
      thisTradePips = exitTotal;
    } else {
      thisTradePips = pips?.reduce((sum, pip) => sum + pip, 0);
    }
    const isProfit = thisTradePips > 0;
    thisTradeSummary.isProfit = isProfit;
    thisTradeSummary.summaryPips = thisTradePips;
    selectedBookTradesSummary.push(thisTradeSummary);
    const sliceKey = sliceBy === 'symbol' ? symbol : model;
    const sliceData = pipsBySlice[sliceKey];
    let p = sliceData?.Long?.pw + sliceData?.Long?.pl + sliceData?.Short?.pw + sliceData?.Short?.pl;
    let pw = 0;
    let pl = 0;
    let wl = sliceData?.Long?.w + sliceData?.Long?.l + sliceData?.Short?.w + sliceData?.Short?.l;
    let w = 0;
    let l = 0;
    if (isLong) {
      longTrades += 1;
      if (isProfit) {
        w = sliceData?.Long?.w + 1;
        wl += 1;
        longProfitTrades += 1;
        pw = sliceData?.Long?.pw + thisTradePips;
        p += thisTradePips;
        pipsBySlice[sliceKey] = {
          ...sliceData,
          Long: {
            ...sliceData?.Long,
            w,
            pw,
          },
        };
      } else {
        pl = sliceData?.Long?.pl + thisTradePips;
        l = sliceData?.Long?.l + 1;
        wl += 1;
        pipsBySlice[sliceKey] = {
          ...sliceData,
          Long: {
            ...sliceData?.Long,
            l,
            pl,
          },
        };
      }
    }
    if (!isLong) {
      shortTrades += 1;
      if (isProfit) {
        shortProfitTrades += 1;
        p = sliceData?.Short?.pw + thisTradePips;
        w = sliceData?.Short?.w + 1;
        wl += 1;
        pipsBySlice[sliceKey] = {
          ...sliceData,
          Short: {
            ...sliceData?.Short,
            w,
            pw: p,
          },
        };
      } else {
        p = sliceData?.Short?.pl + thisTradePips;
        l = sliceData?.Short?.l + 1;
        wl += 1;
        pipsBySlice[sliceKey] = {
          ...sliceData,
          Short: {
            ...sliceData?.Short,
            l,
            pl: p,
          },
        };
      }
    }
    if (minMaxPips < p) minMaxPips = p;
    if (wl > maxWinsLosses) maxWinsLosses = wl;
    totalBookPips += thisTradePips;
  });

  const pipsChartLabels = sliceKeys.map((k) => k);
  const slicePieData: ChartData = {
    labels: pipsChartLabels,
    datasets: [{
      label: 'Proportion',
      type: 'pie',
      backgroundColor: [
        `rgba(${chartColors.red}, .2)`,
        `rgba(${chartColors.orange}, .2)`,
        `rgba(${chartColors.yellow}, .2)`,
        `rgba(${chartColors.green}, .2)`,
        `rgba(${chartColors.blue}, .2)`,
        `rgba(${chartColors.purple}, .2)`,
        `rgba(${chartColors.gray}, .2)`,
        pattern.draw('line', `rgba(${chartColors.red}, .2)`),
        pattern.draw('line', `rgba(${chartColors.orange}, .2)`),
        pattern.draw('line', `rgba(${chartColors.yellow}, .2)`),
        pattern.draw('line', `rgba(${chartColors.green}, .2)`),
        pattern.draw('line', `rgba(${chartColors.blue}, .2)`),
        pattern.draw('line', `rgba(${chartColors.purple}, .2)`),
        pattern.draw('line', `rgba(${chartColors.gray}, .2)`),
      ],
      data: sliceKeys.map((sliceKey) => {
        const { Long, Short } = pipsBySlice[sliceKey];
        return (Long.w + Long.l + Short.w + Short.l);
      }),
    }],
  };
  const slicePieOptions: ChartOptions = {
    ...Chart.defaults.pie,
  };
  const pipWLChartData: ChartData = {
    labels: pipsChartLabels,
    datasets: [
      {
        label: 'Wins',
        backgroundColor: `rgba(${chartColors.green}, .2)`,
        borderColor: `rgb(${chartColors.green})`,
        borderWidth: 1,
        stack: 'WL',
        yAxisID: 'WL-axis',
        data: sliceKeys.map((sliceKey) => {
          const { Long, Short } = pipsBySlice[sliceKey];
          return (Long.w + Short.w);
        }),
      },
      {
        label: 'Losses',
        backgroundColor: `rgba(${chartColors.red}, .2)`,
        borderColor: `rgb(${chartColors.red})`,
        borderWidth: 1,
        stack: 'WL',
        yAxisID: 'WL-axis',
        data: sliceKeys.map((sliceKey) => {
          const { Long, Short } = pipsBySlice[sliceKey];
          return (Long.l + Short.l);
        }),
      },
      {
        label: 'Pips',
        backgroundColor: `rgba(${chartColors.yellow}, .2)`,
        borderColor: `rgb(${chartColors.yellow})`,
        borderWidth: 1,
        stack: 'pips',
        yAxisID: 'pips-axis',
        data: sliceKeys.map((sliceKey) => {
          const { Long, Short } = pipsBySlice[sliceKey];
          return (Long.pw + Long.pl + Short.pw + Short.pl);
        }),
      },
    ],
  };
  const pipWLChartOptions: ChartOptions = {
    ...Chart.defaults.bar,
    scales: {
      yAxes: [{
        id: 'WL-axis',
        scaleLabel: { display: true, labelString: 'Trades' },
        stacked: true,
        gridLines: false,
        ticks: {
          max: maxWinsLosses,
          min: -maxWinsLosses,
        },
      },
      {
        id: 'pips-axis',
        scaleLabel: { display: true, labelString: 'Pips' },
        position: 'right',
        ticks: {
          max: minMaxPips,
          min: -minMaxPips,
        },
      }],
    },
  };

  const bookNumbers = selectedBookTrades.reduce((allBookNumbers, t) => {
    if (allBookNumbers.includes(t.bookNumber)) return allBookNumbers;
    return [...allBookNumbers, t.bookNumber];
  }, [] as number[]).sort((a, b) => (+a > +b ? 1 : -1));
  const [showAverage, setShowAverage] = useState(true);
  const handleToggleShowAverage = () => setShowAverage(!showAverage);
  const timeChartOptions: ChartOptions = {
    ...Chart.defaults.bar,
    scales: {
      yAxes: [{
        id: 'WL-axis',
        scaleLabel: { display: true, labelString: showAverage ? 'Avg Win/Loss ratio' : 'Book Wins & Losses' },
        gridLines: false,
      },
      {
        id: 'pips-axis',
        scaleLabel: { display: true, labelString: showAverage ? 'Avg pips per trade' : 'Book pip total' },
        position: 'right',
      }],
    },
  };
  const timeChartDataSeries = bookNumbers.map((b) => {
    const ts = selectedBookTradesSummary.filter((t) => t.bookNumber === b);
    const wins = ts.reduce((total, t) => (t.isProfit ? total + 1 : total), 0);
    const losses = ts.reduce((total, t) => (!t.isProfit ? total + 1 : total), 0);
    const pips = ts.reduce((total, t) => total + t.summaryPips, 0);
    return {
      bookNumber: b, wins, losses, pips,
    };
  }).sort((a, b) => (+a.bookNumber > +b.bookNumber ? 1 : -1));
  const timeChartAverageDataSeries = bookNumbers.sort().reduce(
    (averagePerBook, b, bookIndex) => {
      const currentBookAverages = bookIndex > 0
        ? { ...averagePerBook[bookIndex - 1] }
        : {
          wins: 0, losses: 0, pips: 0, count: 0, bookNumber: b,
        };
      const ts = selectedBookTradesSummary.filter((t) => t.bookNumber === b);
      const wins = ts.reduce((total, t) => (t.isProfit ? total + 1 : total), 0);
      const losses = ts.reduce((total, t) => (!t.isProfit ? total + 1 : total), 0);
      const pips = ts.reduce((total, t) => total + t.summaryPips, 0);
      const count = ts.length;
      currentBookAverages.count += count;
      currentBookAverages.wins += wins;
      currentBookAverages.losses += losses;
      currentBookAverages.pips += pips;
      currentBookAverages.bookNumber = b;

      return [...averagePerBook, currentBookAverages];
    }, [] as {
    bookNumber: number;
    wins: number;
    losses: number;
    pips: number;
    count: number;
  }[],
  )
    .sort((a, b) => (+a.bookNumber > +b.bookNumber ? 1 : -1));

  const averageOrPerBookData = showAverage
    ? timeChartAverageDataSeries.map(({
      wins, losses, pips, count, ...rest
    }) => ({
      ...rest,
      wins: wins / count,
      losses: losses / count,
      pips: pips / count,
    }))
    : timeChartDataSeries;
  const timeChartData: ChartData = {
    labels: averageOrPerBookData.map(({ bookNumber }) => `${bookNumber}`),
    datasets: [
      {
        label: 'Wins',
        type: 'line',
        backgroundColor: `rgba(${chartColors.green}, .2)`,
        borderColor: `rgb(${chartColors.green})`,
        borderWidth: 1,
        stack: 'WL',
        yAxisID: 'WL-axis',
        data: averageOrPerBookData.map(({ wins }) => (wins)),
      },
      {
        label: 'Losses',
        type: 'line',
        backgroundColor: `rgba(${chartColors.red}, .2)`,
        borderColor: `rgb(${chartColors.red})`,
        borderWidth: 1,
        stack: 'WL',
        yAxisID: 'WL-axis',
        data: averageOrPerBookData.map(({ losses }) => (losses)),
      },
      {
        label: 'Pips',
        type: 'line',
        backgroundColor: `rgba(${chartColors.yellow}, .2)`,
        borderColor: `rgb(${chartColors.yellow})`,
        borderWidth: 1,
        stack: 'pips',
        yAxisID: 'pips-axis',
        data: averageOrPerBookData.map(({ pips }) => (pips)),
      },
    ],
  };

  return <Accordion className='col-12 mt-2' defaultActiveKey='' activeKey={ show ? 'open' : '' }>
        <Card>
          {/* <Card.Header className='d-flex flex-row flex-wrap justify-content-center justify-content-sm-start'>
          <Button className='col d-flex justify-content-center justify-content-sm-end' variant='link' onClick={() => onToggleAnalysis()}>{k ? <KeyboardArrowUp/> : <KeyboardArrowDown/>}</Button>
          </Card.Header> */}
          <style>{`
            .trade-analytics {
              display: grid;
              grid-column-gap: 1em;
              grid-template-columns: 
                minmax(33%, auto)
                minmax(33%, auto)
                minmax(33%, auto);
            }
            .trade-analytics .trade-analytics-item {
              height: 100%;
              width: 100%;
            }
            @media(min-width: 992px) {
              .trade-analytics .trade-analytics-item {
                height: 100%;
                width: 45%;
              }
            }
            @media(min-width: 1400px) {
              .trade-analytics .trade-analytics-item {
                height: 100%;
                width: 32%;
              }
            }
          `}</style>
          <Accordion.Collapse eventKey='open'>
            <Card.Body className='trade-analytics d-flex flex-row flex-wrap' >
              <div className='col-12 d-flex flex-row flex-wrap'>
                <ButtonGroup className='col-12 col-sm-auto mb-1 me-sm-1'>
                  <Button
                    variant={sliceBy === 'symbol' ? 'secondary' : 'outline-secondary'}
                    onClick={handleSliceByCurrencyClicked}
                    >
                    {labels.currencies}
                  </Button>
                  <Button
                    variant={sliceBy === 'model' ? 'secondary' : 'outline-secondary'}
                    onClick={handleSliceByModelClicked}
                    >
                    {labels.models}
                  </Button>
                </ButtonGroup>
                <Badge
                  className={'col-6 col-sm-auto mb-1 me-sm-1 fs-6 d-flex justify-content-center align-items-center border border-secondary text-dark'}
                >
                  <span className='me-1'>{labels.Trades}</span>
                  <span className='me-1 text-dark'>{longTrades + shortTrades}</span>|<span className='ms-1 text-success'>{percent((longProfitTrades + shortProfitTrades) / (longTrades + shortTrades))}</span>
                </Badge>
                <WinLossBadge className='col-6 col-sm-auto mb-1 me-sm-1' title={labels.Pips} p={pipsWithSign(totalBookPips)}/>
                <WinLossBadge className='col-6 col-sm-auto mb-1 me-sm-1' title={labels.Long} w={longProfitTrades} l={longTrades - longProfitTrades}/>
                <WinLossBadge className='col-6 col-sm-auto mb-1 me-sm-1' title={labels.Short} w={shortProfitTrades} l={shortTrades - shortProfitTrades}/>
                <ButtonGroup className='col-12 col-sm-auto mb-1'>
                  <Button
                    variant={showAverage ? 'secondary' : 'outline-secondary'}
                    onClick={handleToggleShowAverage}
                  >Average</Button>
                  <Button
                    variant={!showAverage ? 'secondary' : 'outline-secondary'}
                    onClick={handleToggleShowAverage}
                  >Per Book</Button>
                </ButtonGroup>
              </div>
              <div className='trade-analytics-item'>
                <Bar data={pipWLChartData} options={pipWLChartOptions} />
              </div>
              <div className='trade-analytics-item'>
                <Pie data={slicePieData} options={slicePieOptions} />
              </div>
              <div className='trade-analytics-item'>
                <Bar data={timeChartData} options={timeChartOptions} />
              </div>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>;
};

export default React.memo(TradeLog);
