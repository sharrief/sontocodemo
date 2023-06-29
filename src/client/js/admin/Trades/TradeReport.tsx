import { percent } from '@client/js/core/helpers';
import { ITrade } from '@interfaces';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import Delete from '@mui/icons-material/Delete';
import Restore from '@mui/icons-material/Restore';
import PostAdd from '@mui/icons-material/PostAdd';
import { DateTime, Info as DateTimeInfo } from 'luxon';
import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  ButtonGroup,
  ButtonToolbar,
  Card, Col, Dropdown, DropdownButton, InputGroup, Row, Spinner,
} from 'react-bootstrap';
import { TradeReport as labels } from '@labels';
import { useDispatch } from 'react-redux';
import ConfirmationDialog from '@components/ConfirmationDialog';
import { UnpublishTradeReport, useUnpublishedTrades } from '../trades.store';
import TradeReportDialog from './TradeReport.DayDialog';
import DeleteReport from './TradeReport.DeleteMonth';
import PublishMonth from './TradeReport.PublishMonth';
import { WinLossBadge } from './TradeAnalysis';

const TradeReport = () => {
  const { trades, tradesLoading, refreshTrades } = useUnpublishedTrades();
  const dispatch = useDispatch();

  type MonthNameAndInterest = { dateValue: number; name: string; interest: number; published: boolean }
  const [availableMonths, setAvailableMonths] = useState<MonthNameAndInterest[]>([]);
  const availableMonthNames = DateTimeInfo.months('long');

  const interestByYearByMonth = trades?.reduce((years, t) => {
    const months = years[t.year];
    const monthIndex = Math.max(0, t.month - 1);
    let n: MonthNameAndInterest[] = [];
    if (months) {
      n = [...months];
    }
    if (!n[monthIndex]) {
      const { published } = t;
      n[monthIndex] = {
        name: availableMonthNames[monthIndex],
        interest: t.interest,
        published,
        dateValue: DateTime.fromObject({ month: t.month, year: t.year }).valueOf(),
      };
    } else {
      const { published } = t;
      n[monthIndex] = { ...n[monthIndex], interest: n[monthIndex].interest + t.interest, published: published && n[monthIndex].published };
    }
    return { ...years, [t.year]: n };
  }, {} as {[year: number]: MonthNameAndInterest[] }) || {};

  const interestByYear = Object.keys(interestByYearByMonth).reduce((years, key) => {
    const year = interestByYearByMonth[+key];
    if (year) { return { ...years, [+key]: year.reduce((t, { interest }) => t * (1 + interest / 100), 1) - 1 }; }
    return years;
  }, {} as { [year: number]: number });

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [filteredYear, setFilteredYear] = useState<number>();

  useEffect(() => {
    if (trades?.length) {
      const y = trades?.reduce((allYears, t) => {
        if (!allYears.includes(t.year)) return [...allYears, t.year];
        return allYears;
      }, [] as number[])
        .sort().reverse();
      setAvailableYears(y);
      setFilteredYear(y[0]);
    }
  }, [trades]);

  const filteredYearDropdownTitle = <>{filteredYear} | {tradesLoading
    ? <Spinner animation='grow' size='sm' />
    : percent(interestByYear[filteredYear])
  }</>;

  const [filteredMonthIndex, setFilteredMonthIndex] = useState<number>(0);
  const filteredMonth = availableMonths[filteredMonthIndex];
  const published = filteredMonth?.published;
  useEffect(() => {
    const m = interestByYearByMonth[filteredYear];
    if (trades?.length && availableYears?.length && m) {
      setAvailableMonths(m);
      setFilteredMonthIndex(Math.max(0, m.length - 1));
    }
  }, [filteredYear, trades]);

  const getMonthDropdownTitle = (month: MonthNameAndInterest) => <>{month?.published ? <CheckCircleOutlineOutlined/> : <PostAdd/>} {month?.name} | {percent(month?.interest / 100)}</>;

  const filteredMonthDropdownTitle = availableMonths.length
    ? getMonthDropdownTitle(availableMonths[filteredMonthIndex])
    : <Spinner size='sm' animation='grow' />;

  const getTradeRowContent = ({ symbol, interest }: ITrade) => <>
    <Col className='d-flex'>{symbol}</Col>
    <Col className={interest > 0 ? 'text-success' : 'text-danger'}>{percent(interest / 100)}</Col>
  </>;

  const [filteredTrades, setFilteredTrades] = useState<ITrade[]>([]);
  useEffect(() => {
    if (!trades?.length) return;
    const t = trades.filter(({ year, month }) => year === filteredYear && month === (filteredMonthIndex + 1));
    setFilteredTrades(t);
  }, [filteredMonthIndex, trades]);

  const currentMonthDate = DateTime.fromObject({ month: filteredMonthIndex + 1, year: filteredYear });
  const days: number[] = Array.from(Array(currentMonthDate?.daysInMonth));
  const {
    gain, gainCount, loss, lossCount,
  } = filteredTrades.reduce((all, t) => {
    if (t.interest > 0) {
      return {
        ...all,
        gain: all.gain + t.interest,
        gainCount: all.gainCount + 1,
      };
    }
    return {
      ...all,
      loss: all.loss + t.interest,
      lossCount: all.lossCount + 1,
    };
  }, {
    gain: 0, gainCount: 0, loss: 0, lossCount: 0,
  });

  const [dialogDay, setDialogDay] = useState<number>();
  const [dialogMonth, setDialogMonth] = useState<number>();
  const [dialogYear, setDialogYear] = useState<number>();
  const [showDialog, setShowDialog] = useState(false);
  const handleEditDateClicked = (year: number, month: number, day: number) => {
    setDialogDay(day);
    setDialogMonth(month);
    setDialogYear(year);
    setShowDialog(true);
  };
  const handleDialogClosed = () => {
    setShowDialog(false);
    setDialogDay(0);
    setDialogMonth(0);
    setDialogYear(0);
  };

  const [deleteMonth, setDeleteMonth] = useState(0);
  const [deleteYear, setDeleteYear] = useState(0);
  const handleDeleteReportClicked = () => {
    const { month, year } = DateTime.fromMillis(filteredMonth.dateValue);
    setDeleteMonth(month);
    setDeleteYear(year);
  };
  const handleDeleteReportClosed = () => {
    setDeleteMonth(0);
    setDeleteYear(0);
  };

  const [publishMonth, setPublishMonth] = useState(0);
  const [publishYear, setPublishYear] = useState(0);
  const handlePublishReportClicked = () => {
    const { month, year } = DateTime.fromMillis(filteredMonth.dateValue);
    setPublishMonth(month);
    setPublishYear(year);
  };
  const handlePublishReportClosed = () => {
    setPublishMonth(0);
    setPublishYear(0);
  };

  const [unpublishMonth, setUnpublishMonth] = useState(0);
  const [unpublishYear, setUnpublishYear] = useState(0);
  const [busyUnpublishing, setBusyUnpublishing] = useState(false);
  const handleUnpublishReportClicked = () => {
    const { month, year } = DateTime.fromMillis(filteredMonth.dateValue);
    setUnpublishMonth(month);
    setUnpublishYear(year);
  };
  const handleUnpublishReportClosed = () => {
    setUnpublishMonth(0);
    setUnpublishYear(0);
  };
  const handleUnpublishReportConfirmed = async () => {
    if (unpublishMonth && unpublishYear) {
      setBusyUnpublishing(true);
      await UnpublishTradeReport(unpublishMonth, unpublishYear, dispatch);
      setBusyUnpublishing(false);
      handleUnpublishReportClosed();
      refreshTrades();
    }
  };

  const latestYear = Math.max(...availableYears);
  const latestMonthSelected = filteredMonthIndex === availableMonths.length - 1 && filteredYear === Math.max(...availableYears);
  const latestYearMonths = interestByYearByMonth[latestYear] || [];
  const latestReportIsPublished = latestYearMonths[latestYearMonths?.length - 1]?.published;
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);
  const handleNewReport = () => {
    if (latestReportIsPublished) {
      setShowNewReportDialog(true);
    }
  };
  const handleNewReportDialogClosed = () => {
    setShowNewReportDialog(false);
  };

  const firstDay = currentMonthDate.set({ day: 1 });
  const { weekday } = firstDay;
  const prevMonthWeek = [...Array(weekday).keys()].map((i) => {
    const prevMonthDay = firstDay
      .minus({ days: (weekday - i) })
      .toLocaleString({ weekday: 'short', month: 'short', day: 'numeric' });
    return <Card key={i} bg='secondary'>
      <Card.Header>{prevMonthDay}</Card.Header>
    </Card>;
  });

  return <>
    <TradeReportDialog
      day={dialogDay}
      month={dialogMonth}
      monthPublished={published}
      year={dialogYear}
      show={showDialog}
      handleClose={handleDialogClosed}
    />
    <TradeReportDialog
      show={showNewReportDialog}
      handleClose={handleNewReportDialogClosed}
    />
    <PublishMonth
      month={publishMonth}
      year={publishYear}
      interest={filteredMonth?.interest}
      handleClose={handlePublishReportClosed}
    />
    <DeleteReport
      month={deleteMonth}
      year={deleteYear}
      handleClose={handleDeleteReportClosed}
    />
    <ConfirmationDialog
      show={!!(unpublishMonth && unpublishYear)}
      title={labels.UnpublishTradeReport}
      cancelLabel={labels.cancel}
      onCancel={handleUnpublishReportClosed}
      acceptLabel={labels.Unpublish}
      canAccept={!busyUnpublishing}
      busy={busyUnpublishing}
      onAccept={handleUnpublishReportConfirmed}
    >{labels.UnpublishTradeReportInstruction(DateTime.fromObject({ month: unpublishMonth, year: unpublishYear }).toFormat('MMMM yyyy'))}</ConfirmationDialog>
    <div className='mb-2 align-items-center d-flex flex-row flex-wrap'>
      <ButtonGroup className='mb-2 mb-sm-0 me-2 col-12 col-sm-auto'>
        <DropdownButton
          as={ButtonGroup}
          id='filteredYearDropdownButton'
          title={filteredYearDropdownTitle}
          onSelect={(y) => setFilteredYear(+y)}
          variant='outline-secondary'
          className='col-6 col-sm-auto'
        >
          {availableYears?.map((y) => <Dropdown.Item
            key={y}
            eventKey={y}
            active={y === filteredYear}
          >
            {y} | {percent(interestByYear[y])}
          </Dropdown.Item>)}
        </DropdownButton>
        <DropdownButton
          as={ButtonGroup}
          id='filteredMonthDropdownButton'
          title={filteredMonthDropdownTitle}
          onSelect={(m) => setFilteredMonthIndex(+m)}
          variant={filteredMonth?.published ? 'outline-secondary' : 'outline-info'}
          className='col-6 col-sm-auto'

        >
          {availableMonths?.map((m, i) => <Dropdown.Item
            key={i}
            eventKey={i}
            active={i === filteredMonthIndex}
          >
            {getMonthDropdownTitle(m)}
          </Dropdown.Item>)}
        </DropdownButton>
      </ButtonGroup>
      <ButtonGroup className='mb-2 mb-sm-0 me-2 col-12 col-sm-auto'>
          {(published && latestMonthSelected)
            ? <Button
              disabled={!latestMonthSelected}
              onClick={handleUnpublishReportClicked}
              className='col-6 col-sm-auto'
            >
              <Restore /> {labels.Unpublish}
            </Button>
            : <Button
              disabled={published}
              onClick={handlePublishReportClicked}
              className='col-6 col-sm-auto'
            >
              <CheckCircleOutlineOutlined /> {labels.Publish}
            </Button>
          }
          {(latestMonthSelected && filteredMonth?.published)
            ? <Button
                disabled={!latestMonthSelected && !filteredMonth?.published}
                variant='success'
                onClick={handleNewReport}
                className='col-6 col-sm-auto'
              ><PostAdd /> {labels.NewReport}</Button>
            : <Button
              disabled={!latestMonthSelected || filteredMonth?.published}
              variant='danger'
              onClick={handleDeleteReportClicked}
              className='col-6 col-sm-auto'
            ><Delete /> {labels.Delete}</Button>
          }
      </ButtonGroup>
      <InputGroup className='col-12 col-sm-auto w-auto'>
          <InputGroup.Text
            className={'bg-white col-6 d-flex justify-content-center align-items-center border border-secondary text-success'}
          >
            {percent(gain / 100)} | {gainCount}
          </InputGroup.Text>
          <InputGroup.Text
            className={'bg-white col-6 d-flex justify-content-center align-items-center border border-secondary text-danger'}
          >
            {percent(loss / 100)} | {lossCount}
          </InputGroup.Text>
          {/* <Col xs='auto'><span className='text-success'>{percent(gain / 100)} | {gainCount}</span></Col> */}
          {/* <Col xs='auto'><span className='text-danger'>{percent(loss / 100)} | {lossCount}</span></Col> */}
      </InputGroup>
    </div>
    <style>{`
      .trade-report-calendar .card {
        margin-bottom: 0.5rem;
      }
      @media (min-width: 768px) {
        .trade-report-calendar {
          display: grid;
          grid-template-columns: 
            minmax(14%, auto)
            minmax(14%, auto)
            minmax(14%, auto)
            minmax(14%, auto)
            minmax(14%, auto)
            minmax(14%, auto)
            minmax(14%, auto);
        }
        .trade-report-calendar .card {
          height: 100%;
          border-radius: 0px;
          margin-bottom: 0;
        }
      }
    `}</style>
      <div className='trade-report-calendar'>
        {weekday < 7 ? prevMonthWeek : null}
        {days.map((_d, dayIndex) => {
          const dayDate = currentMonthDate.set({ day: dayIndex + 1 });
          const dateString = dayDate
            .toLocaleString({ weekday: 'short', month: 'short', day: 'numeric' });
          const dayTrades = filteredTrades?.filter(({ day }) => day === (dayIndex + 1));

          const { day, year, month } = dayDate;
          return <div key={dayIndex}>
            <Card>
              <Card.Header className='d-flex flex-row justify-content-between align-items-center'>
                <a
                  href=''
                  onClick={(e) => { e.preventDefault(); handleEditDateClicked(year, month, day); }}
                >
                  {dateString}
                </a>
              </Card.Header>
              <Card.Body>{
                dayTrades?.map((t) => <Row key={t.id}>
                  {getTradeRowContent(t)}
                </Row>)
              }</Card.Body>
            </Card>
        </div>;
        })}</div>
  </>;
};

export default TradeReport;
