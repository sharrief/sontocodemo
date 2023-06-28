import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import {
  Accordion, Dropdown, DropdownButton,
  Button,
  Card,
  ButtonGroup,
  Badge,
  BadgeProps,
  Row,
  Col,
  InputGroup,
  Form,
} from 'react-bootstrap';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import NoteIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import { chain } from '@numbers';
import {
  calcPips, ITradeEntry, TradeSide,
} from '@interfaces';
import { API } from '@api';
import { useDispatch } from 'react-redux';
import ResponsiveModal from '@client/js/components/Modal';
import Assessment from '@mui/icons-material/Assessment';
import CheckCircle from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import { TradeAnalytics as analyticsLabels } from '@labels';
import { useTradeLogBook, useTradeLogBookNames } from './TradeLog.fetchers';
import TradeLogEntryDialog from './TradeLog.EntryDialog';
import { handleMessageAndError } from '../admin.store';
import TradeAnalysis from './TradeAnalysis';

const pipsWithSign = (number: number) => Intl.NumberFormat('en-US', { signDisplay: 'always' }).format(number);

const TradeLog = () => {
  const [selectedBookName, setSelectedBookName] = useState('');
  const { bookNames, bookNamesLoading } = useTradeLogBookNames();
  useEffect(() => {
    if (bookNames.length) {
      setSelectedBookName(bookNames[0]);
    }
  }, [bookNames]);
  const { bookTrades, mutate: refresh, booksLoading } = useTradeLogBook(selectedBookName);
  const bookNumbers = bookTrades?.reduce((all, { bookNumber }) => (all.includes(bookNumber) ? all : [...all, bookNumber]), [] as number[]).reverse() || [];
  const bookNumberDates = bookNumbers.map((bookNum) => {
    const ts = bookTrades.filter(({ bookNumber }) => bookNum === bookNumber);
    const first = ts.reduce((earliest, t) => (t.date < earliest.date ? t : earliest));
    const last = ts.reduce((latest, t) => (t.date > latest.date ? t : latest));
    return { start: first.date, last: last.date };
  });
  const [selectedBookNumbers, setSelectedBookNumbers] = useState<number[]>(bookNumbers?.length ? [1] : []);
  const [fromSelectedBook, setFromSelectedBook] = useState(0);
  const [toSelectedBook, setToSelectedBook] = useState(0);
  const handleSetFromBook = (book: number) => {
    setFromSelectedBook(book);
    setSelectedBookNumbers([book, ...bookNumbers.filter((b) => (b > book && (toSelectedBook ? b <= toSelectedBook : true)))]);
  };
  const handleSetToBook = (book: number) => {
    setToSelectedBook(book);
    setSelectedBookNumbers([...bookNumbers.filter((b) => (b < book && (fromSelectedBook ? b >= fromSelectedBook : true))), book]);
  };

  const booksSelected = selectedBookNumbers;
  const selectedBookTrades = bookTrades?.filter(({ bookNumber }) => selectedBookNumbers.includes(bookNumber));
  const changeBookName = (trader: string) => {
    setSelectedBookName(trader);
  };
  useEffect(() => {
    if (selectedBookName && bookTrades && !booksLoading) {
      const lastBook = Math.max(...bookNumbers);
      setSelectedBookNumbers([lastBook]);
      setFromSelectedBook(lastBook);
      setToSelectedBook(lastBook);
    }
  }, [selectedBookName, bookTrades, booksLoading]);

  const toggleSelectBookNumber = (book: string) => {
    setSelectedBookNumbers([+book]);
    setFromSelectedBook(+book);
    setToSelectedBook(+book);
  };

  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(true);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [idToDelete, setIdToDelete] = useState(0);
  const tradeToDelete = bookTrades?.find((t) => t.id === idToDelete);
  const dispatch = useDispatch();
  useEffect(() => {
    if (bookNamesLoading || booksLoading || deleting) {
      setBusy(true);
    } setBusy(false);
  }, [bookNamesLoading, booksLoading, deleting]);
  const deleteTradeEntry = async () => {
    setDeleting(true);
    const { id: deletedId, error } = await API.TradeLog.DeleteTradeEntry.post({ id: idToDelete });
    if (error) handleMessageAndError({ error }, dispatch);
    if (deletedId) {
      refresh({ bookTrades: bookTrades?.filter(({ id: i }) => i !== deletedId) }, false);
    }
    setIdToDelete(0);
    setDeleting(false);
    setShowDeletePrompt(false);
  };
  const promptToDelete = (id: number) => {
    setIdToDelete(id);
    setShowDeletePrompt(true);
  };
  const cancelPromptToDelete = () => {
    setIdToDelete(0);
    setShowDeletePrompt(false);
  };

  const [showAnalysis, setShowAnalysis] = useState(false);
  const handleToggleShowAnalysis = () => setShowAnalysis(!showAnalysis);

  const selectedBookNumbersSummary = selectedBookNumbers?.length > 1 ? `${fromSelectedBook} to ${toSelectedBook}` : fromSelectedBook;

  return <>
    <ResponsiveModal
      show={showDeletePrompt}
      handleClose={() => { cancelPromptToDelete(); }}
      header={<span className='fs-5'>Are you sure?</span>}
      body={<span>Just to confirm, do you want to delete trade entry {tradeToDelete?.bookName} {tradeToDelete?.bookNumber}.{tradeToDelete?.tradeNumber}?</span>}
      footer={<div className='d-flex justify-content-between w-100'>
        <div><Button variant='secondary' onClick={() => { cancelPromptToDelete(); }}>No</Button></div>
        <div className='d-flex align-items-end'><Button variant='danger' onClick={() => { deleteTradeEntry(); }}>Yes</Button></div>
      </div>}
    />
    <div className='d-flex flex-row justify-content-between'>
      <Row className='g-0 w-100'>
        <Col xs='12' sm='auto' className='me-2'>
        <ButtonGroup className='w-100'>
          <DropdownButton
            as={ButtonGroup}
            onSelect={changeBookName}
            title={selectedBookName || 'Select a book'}
            variant='outline-secondary'
            className='col'
          >
            {bookNames.map((bookName) => <Dropdown.Item key={bookName} eventKey={bookName} disabled={busy}>{bookName}</Dropdown.Item>)}
          </DropdownButton>
          <DropdownButton
            as={ButtonGroup}
            disabled={!selectedBookName}
            onSelect={toggleSelectBookNumber}
            title={booksSelected ? `Book: ${selectedBookNumbersSummary}` : 'Select a book'}
            variant='outline-secondary'
            className='col'
            autoClose={false}
          >
            <InputGroup>
            <InputGroup.Text>From</InputGroup.Text>
            <Form.Select
              value={fromSelectedBook}
              onChange={({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => handleSetFromBook(+value)}
            >{bookNumbers.filter((b) => (toSelectedBook ? b <= toSelectedBook : true)).map((b) => (
              <option key={b}>{b}</option>
            ))}</Form.Select>
            <InputGroup.Text>To</InputGroup.Text>
            <Form.Select
              value={toSelectedBook}
              onChange={({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => handleSetToBook(+value)}
            >{bookNumbers.filter((b) => (fromSelectedBook ? b >= fromSelectedBook : true)).map((b) => (
              <option key={b}>{b}</option>
            ))}</Form.Select>
            </InputGroup>
            {bookNumbers?.map((book, i) => {
              const selected = selectedBookNumbers.includes(+book);
              return <Dropdown.Item
              key={`${selectedBookName}-${book}`}
              eventKey={book}
              disabled={busy}
              active={selected}
              >
                {selected ? <CheckCircle/> : <RadioButtonUncheckedOutlined/>} {book}: {DateTime.fromMillis(bookNumberDates[i].start).toFormat('D')} - {DateTime.fromMillis(bookNumberDates[i].last).toFormat('D')}
              </Dropdown.Item>;
            })}
          </DropdownButton>
          <ButtonGroup className='col-auto'>
            {selectedBookTrades ? <TradeLogEntryDialog bookName={selectedBookName} busy={busy}/> : null}
            <Button
                className='d-flex col-auto align-items-center'
                onClick={handleToggleShowAnalysis}
                variant={showAnalysis ? 'info' : 'outline-info'}
              ><Assessment/> <span className='d-none d-md-block'>{analyticsLabels.title}</span></Button>
          </ButtonGroup>
        </ButtonGroup>
        </Col>
      <TradeAnalysis trades={selectedBookTrades} show={showAnalysis} />
      </Row>
    </div>
    <style>{`
        .trade-log {
          display: grid;
          grid-column-gap: 1em;
          grid-row-gap: 1em;
          grid-template-columns: 
            minmax(25%, auto)
            minmax(25%, auto)
            minmax(25%, auto)
            minmax(25%, auto);
        }
        .trade-log .trade-card {
          height: 100%;
          width: 100%;
          margin-bottom: 0;
        }
        @media(min-width: 576px) {
          .trade-log .trade-card {
            height: 100%;
            width: 48%;
          }
        }
        @media(min-width: 768px) {
          .trade-log .trade-card {
            height: 100%;
            width: 30%;
          }
        }
        @media(min-width: 992px) {
          .trade-log .trade-card {
            height: 100%;
            width: 23%;
          }
        }
        @media(min-width: 1400px) {
          .trade-log .trade-card {
            height: 100%;
            width: 19%;
          }
        }
        
    `}</style>
    <div className='d-flex flex-row flex-wrap mt-2 g-0 trade-log'>
        {selectedBookTrades?.map((trade) => {
          const {
            id, bookName, bookNumber, tradeNumber, symbol, date, side, model, notes, image1, image2, entry, exits,
          } = trade;
          const key = `${bookNumber}.${tradeNumber}`;
          const isLong = side === TradeSide.Long;
          const textColor = isLong ? 'text-primary' : 'text-info';
          const borderColor = isLong ? 'border-primary' : 'border-info';
          const pipProfitLoss = exits.reduce((total, curr) => total + calcPips(entry, curr, side, symbol), 0);
          const { headerPipClass } = (() => {
            let c = '';
            if (isLong) {
              if (pipProfitLoss > 0) { c = 'text-success'; }
              if (pipProfitLoss < 0) { c = 'text-danger'; }
              return { headerPipClass: c };
            }
            if (pipProfitLoss < 0) { c = 'text-success'; }
            if (pipProfitLoss > 0) { c = 'text-danger'; }
            return { headerPipClass: c };
          })();

          return <Card key={key} className={`${borderColor} trade-card`}>
          <Card.Header>
            <div className='d-flex flex-row align-items-center justify-content-between'>
              <div>(#{id}) {bookName}: {key} {symbol} <span className={headerPipClass}>({
              pipsWithSign(chain(pipProfitLoss).done())
            })</span></div>
              <div className='d-flex align-items-end'>
                <Button
                variant='link'
                onClick={() => promptToDelete(id)}
                ><DeleteIcon/>
                </Button></div>
            </div>
          </Card.Header>
        <Card.Body>
          <div className='d-flex flex-column w-100'>
            <div className='d-flex flex-row'>
              <div className='col-6'><span className={textColor}>{side}</span> <span>{model}</span></div>
              <div className='d-flex flex-column col-6 align-items-end'>{DateTime.fromMillis(date).toLocaleString(DateTime.DATE_SHORT)}</div>
            </div>
            { !!(trade?.entry) && <ExitSummary tradeEntry={trade} />}
            {!trade?.entry && <PipSummary tradeEntry={trade} />}
          </div>
          <div className='d-flex flex-column'>
            {notes
              && <Accordion>
                <Accordion.Item eventKey='notes'>
                  <Accordion.Header><NoteIcon/> Notes</Accordion.Header>
                  <Accordion.Body>{notes}</Accordion.Body>
                </Accordion.Item>
              </Accordion>
            }
            <div className='d-flex flex-row'>
              {image1 && <Button className='me-2' onClick={() => window.open(image1)}>Image 1</Button>}
              {image2 && <Button onClick={() => window.open(image2)}>Image 2</Button>}
            </div>
          </div>
          </Card.Body>
        </Card>;
        })}
    </div>
  </>;
};

const ExitSummary = (props: { tradeEntry: ITradeEntry }) => {
  const {
    bookNumber, tradeNumber, symbol, entry, side: position, exits,
  } = props.tradeEntry;
  const key = `${bookNumber}.${tradeNumber}`;
  if (!entry) return null;
  const isLong = position === TradeSide.Long;
  const textColor = isLong ? 'text-primary' : 'text-info';
  const exitPips: number[] = exits?.map((exitPrice) => {
    if (!exitPrice) return 0;
    return (isLong ? chain(exitPrice).subtract(entry || 0).done() : chain(entry || 0).subtract(exitPrice).done());
  });
  const exitTotal = chain(exitPips?.reduce((total, curr) => total + curr, 0) || 0)
    .multiply(10 ** 4).round(2)
    .done();
  const exitPlusMinus = (() => {
    if (exitTotal > 0) return '+';
    if (exitTotal < 0) return '-';
    return '';
  })();
  const exitTotalClass = `${exitTotal > 0 ? 'text-success' : 'text-danger'}`;

  return <div className='d-flex flex-column'>
    <span><span className={textColor}>{isLong ? <ArrowUpward/> : <ArrowDownward/>} {entry}</span> <span className={exitTotalClass}>({exitPlusMinus}{chain(exitTotal).abs().done()})</span></span>
    {
      exits.map((exit, exitKey) => {
        if (!exit) return null;
        const pipCalc = isLong ? exit - entry : entry - exit;
        const plusMinus = (() => {
          if (pipCalc > 0) return '+';
          if (pipCalc < 0) return '-';
          return '';
        })();
        const exitClass = `${pipCalc > 0 ? 'text-success' : 'text-danger'}`;
        return <div key={`${key}-${exitKey}`} className='mx-1'>{exit} <span className={exitClass}>({`${plusMinus}${chain(pipCalc).abs()
          .multiply(10 ** 4).round(2)
          .done()}`})</span>
        </div>;
      })
    }
</div>;
};

const PipSummary = (props: { tradeEntry: ITradeEntry }) => {
  const {
    bookNumber, tradeNumber, pips,
  } = props.tradeEntry;
  const key = `${bookNumber}.${tradeNumber}`;
  if (!pips) return null;
  const exitTotal = pips?.reduce((total, curr) => total + curr, 0) || 0;
  const exitPlusMinus = (() => {
    if (exitTotal > 0) return '+';
    if (exitTotal < 0) return '-';
    return '';
  })();
  const exitTotalClass = `${exitTotal > 0 ? 'text-success' : 'text-danger'}`;

  return <div className='d-flex flex-column'>
    <span className={exitTotalClass}>({exitPlusMinus}{exitTotal})</span>
    {pips.map((pip, pipKey) => {
      const plusMinus = (() => {
        if (pip > 0) return '+';
        if (pip < 0) return '-';
        return '';
      })();
      const pipClass = `mx-1 ${pip > 0 ? 'text-success' : 'text-danger'}`;
      return <div key={`${key}-${pipKey}`} className={pipClass}>{plusMinus}{Math.abs(pip)}</div>;
    })}
  </div>;
};

export default React.memo(TradeLog);
