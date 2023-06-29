import ResponsiveModal from '@client/js/components/Modal';
import { NewTrade as INewTrade, AssetSymbol, ITrade } from '@interfaces';
import React, { useEffect, useState } from 'react';
import { TradeReport as Labels, TradeReport as labels } from '@labels';
import {
  Alert,
  Button, Col, Container, Form, InputGroup, Row, Spinner,
} from 'react-bootstrap';
import { DateTime, Info as DateTimeInfo } from 'luxon';
import { $enum } from 'ts-enum-util';
import { percent } from '@client/js/core/helpers';
import Add from '@mui/icons-material/Add';
import GetApp from '@mui/icons-material/GetApp';
import Remove from '@mui/icons-material/Remove';
import Delete from '@mui/icons-material/Delete';
import NumberFormat from 'react-number-format';
import { useDispatch } from 'react-redux';
import { mutate } from 'swr';
import { API } from '@api';
import { getLatestTradeMonth } from '../admin.store';
import { useUnpublishedTrades, SaveNewReportTrade } from '../trades.store';

type NewTrade = INewTrade & { uuid?: string }

const TradeReportDialog = (props: {
  month?: number;
  monthPublished?: boolean;
  year?: number;
  day?: number;
  show: boolean;
  handleClose: () => void;
}) => {
  const { show, handleClose, monthPublished } = props;
  const dispatch = useDispatch();
  const { month: latestMonth, year: latestYear } = getLatestTradeMonth();
  const [currentDate, setCurrentDate] = useState<DateTime>(DateTime.fromObject({ month: 12, year: 2016 }));
  const [day, setDay] = useState(currentDate.day);
  const [month, setMonth] = useState(currentDate.month);
  const [year, setYear] = useState(currentDate.year);
  useEffect(() => {
    const newDate = DateTime
      .fromObject({ month: props.month || latestMonth || 12, year: props.year || latestYear || 2016, day: props.day || 1 })
      .plus({ month: props.month ? 0 : 1 });
    setCurrentDate(newDate);
    setDay(newDate.day);
    setMonth(newDate.month);
    setYear(newDate.year);
  }, [latestMonth, latestYear]);

  const { trades: allTrades } = useUnpublishedTrades();

  const [trades, setTrades] = useState<ITrade[]>([]);
  const [busy, setBusy] = useState(false);
  const canSave = !busy;
  const canChangeTrades = !monthPublished;

  useEffect(() => {
    if (props.day) setDay(props.day);
    if (props.month) setMonth(props.month);
    if (props.year) setYear(props.year);
    if (props.month && props.year) {
      setTrades(allTrades
        .filter(({ month: tMonth, year: tYear, day: tDay }) => (
          props.month === tMonth
          && props.year === tYear
          && props.day === tDay)));
    }
  }, [props.day, props.month, props.year]);

  const [symbol, setSymbol] = useState(AssetSymbol.ABCDE);
  const [interest, setInterest] = useState(0);
  const [isPositive, setIsPositive] = useState(true);
  const newTradeInput = {
    day, symbol, interest,
  };

  // eslint-disable-next-line no-nested-ternary
  const getNewTradeString = (trade: NewTrade) => <>
    <span className='pe-1'>{trade.symbol}</span>
    {// eslint-disable-next-line no-nested-ternary
    <span className={trade.interest === 0 ? '' : trade.interest > 0 ? 'text-success' : 'text-danger'}>
      {percent((+`${trade.interest}` / 100))}
    </span>
    }
    <span className='ps-1'>{
    DateTime.fromObject({ month, year, day: trade.day })
      .toLocaleString({
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })}</span></>;

  const months = DateTimeInfo.months('short');
  const days = Array.from(Array(currentDate.daysInMonth));
  const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023];
  const reportTotalInterest = trades.reduce((total, t) => +t.interest + total, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!+interest) return;
    const newTrade: ITrade = {
      interest: isPositive ? interest : -interest,
      symbol,
      id: Math.floor(Math.random() * 1000),
      year,
      month,
      day,
      created: DateTime.now().valueOf(),
      createdId: 0,
      deleted: false,
      published: false,
    };
    setTrades([...trades, newTrade]);
    setInterest(0);
  };
  const handleDelete = (_id: number) => {
    setTrades(trades.filter(({ id }) => (id !== _id)));
  };
  const handleToggleIsPositive = () => setIsPositive(!isPositive);
  const handleSaveReport = async () => {
    setBusy(true);
    const success = await SaveNewReportTrade(year, month, props.day, trades, dispatch);
    // if (success) {
    //   mutate(API.Trades.Find.Route);
    // }
    handleClose();
    setBusy(false);
  };
  const smallHeaderClassName = 'fs-6';

  useEffect(() => {
    if (!show) {
      setTrades([]);
      setDay(1);
      setMonth(currentDate.month);
      setYear(currentDate.year);
      setInterest(0);
      setSymbol(AssetSymbol.ABCDE);
    }
  }, [show]);
  return <ResponsiveModal
    show={show}
    handleClose={handleClose}
    header={<span className='fs-5'>{Labels.reportDialogHeader}</span>}
    body={<Container fluid className='pb-5'>
      {!canChangeTrades
        ? <Alert variant='info'>
          {labels.CannotChangePublishedReport}
        </Alert> : null }
      <Form onSubmit={(e) => handleAdd(e)}>
      {(!props.year && show) ? <><Row>
        <Col>
          <div className={smallHeaderClassName}>{Labels.year}</div>
          {years.map((y) => <Button
            disabled={!!trades?.length}
            className='col-3'
            variant={year === y ? 'primary' : 'outline-primary'}
            active={year === y}
            onClick={() => setYear(y)}
            key={y}
          >
            {y}
          </Button>)}
        </Col>
      </Row>
      <hr /></> : null}
      {(!props.month && show) ? <><Row>
        <Col>
          <div className={smallHeaderClassName}>{Labels.month}</div>
          {months.map((m, mIndex) => <Button
            disabled={!!trades?.length}
            className='col-3'
            variant={month === mIndex + 1 ? 'primary' : 'outline-primary'}
            active={month === mIndex + 1}
            onClick={() => setMonth(mIndex + 1)}
            key={mIndex}
          >
            {m}
          </Button>)}
        </Col>
      </Row>
      <hr /></> : null }
      {(!props.day && show) ? <><Row>
        <Col>
          <div className={smallHeaderClassName}>{Labels.day}</div>
          {days.map((_, d) => {
            const dayDate = DateTime.fromObject(({ month, day: d + 1, year }));
            return <Button
              className='col col-3'
              variant='outline-primary'
              active={day === d + 1}
              key={d}
              onClick={() => setDay(d + 1)}
            >{dayDate.toLocaleString({ weekday: 'short', day: 'numeric' })}</Button>;
          })}
        </Col>
      </Row>
      <hr /></> : null }
      <Row>
        <Col>
          <div className={smallHeaderClassName}>{Labels.symbol}</div>
          {$enum(AssetSymbol).map((c, cIndex) => <Button
            className='col-3'
            variant='outline-primary'
            active={symbol === c}
            onClick={() => setSymbol(c)}
            key={cIndex}
          >
            {c}
          </Button>)}
        </Col>
      </Row>
      <hr />
      <Row>
        <Col>
          <div><span className={smallHeaderClassName}>{Labels.interest}</span> <em className='fs-8 text-danger'>{!+interest && Labels.specifyInterest}</em></div>
          <InputGroup>
            <Button active={isPositive} variant={isPositive ? 'success' : 'outline-success'} onClick={handleToggleIsPositive}><Add/></Button>
            <Button active={!isPositive} variant={!isPositive ? 'danger' : 'outline-danger'} onClick={handleToggleIsPositive}><Remove/></Button>
            {<Form.Control
              as={NumberFormat}
              value={interest}
              displayType='input'
              format={'#.###'}
              onValueChange={({ formattedValue }) => setInterest(formattedValue)}
            />}
            <InputGroup.Text>%</InputGroup.Text>
          </InputGroup>
        </Col>
      </Row>
      <Row className='mt-2'>
        <span>{Labels.newTrade}</span>
        <InputGroup>
        <InputGroup.Text className='col-10'>
          {getNewTradeString({ ...newTradeInput, interest: +newTradeInput.interest * (isPositive ? 1 : -1) })}
        </InputGroup.Text>
        <Button className='col-2' disabled={!+interest || !canChangeTrades} type='submit'><GetApp /></Button>
        </InputGroup>
      </Row>
      </Form>
      <hr />
      <div className={smallHeaderClassName}>{currentDate.toLocaleString({ month: 'long', year: 'numeric', day: 'numeric' })} {Labels.gainLoss}: {percent(reportTotalInterest / 100)}</div>
      {trades.length ? trades
        .sort((a, b) => {
          const dateA = DateTime.fromObject({ month: a.month, day: a.day, year: a.year });
          const dateB = DateTime.fromObject({ month: b.month, day: b.day, year: b.year });
          return dateA.toMillis() > dateB.toMillis() ? 1 : -1;
        })
        .map((t) => <Row key={t.id} className='d-flex'>
        <InputGroup className='w-100'>
          <InputGroup.Text className='col-10'>{getNewTradeString(t)}</InputGroup.Text>
          <Button className='col-2' onClick={() => handleDelete(t.id)} variant='danger' disabled={!canChangeTrades}><Delete /></Button>
        </InputGroup>
      </Row>) : <div>{Labels.noTradesForDay}</div>}
    </Container>}
    footer={<Row className='d-flex justify-content-between w-100 mx-0'>
        <Button className='col-auto' onClick={handleClose} variant='secondary'>{Labels.cancel}</Button>
        <Button className='col-auto' disabled={!canSave || !canChangeTrades} onClick={handleSaveReport}>{busy ? <Spinner size='sm' animation='grow'/> : Labels.saveReport}</Button>
      </Row>}
  />;
};

export default TradeReportDialog;
