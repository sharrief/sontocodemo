import { API } from '@api';
import { calcPips, ITradeEntry, TradeSide } from '@interfaces';
import React, { useEffect, useState } from 'react';
import {
  Button, FormControl, InputGroup, ToggleButton, ToggleButtonGroup,
} from 'react-bootstrap';
import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import { useDispatch } from 'react-redux';
import ResponsiveModal from '@client/js/components/Modal';
import { $enum } from 'ts-enum-util';
import { chain } from '@numbers';
import AddCircle from '@mui/icons-material/AddCircle';
import { handleMessageAndError } from '../admin.store';
import { useTradeLogBook, useTradeModels, useTradeSymbols } from './TradeLog.fetchers';

const EntryDialog = (props: { bookName: string; busy: boolean }) => {
  const dispatch = useDispatch();
  const { bookName, busy } = props;
  const { bookTrades, mutate: refresh } = useTradeLogBook(bookName);
  const { tradeModels } = useTradeModels();
  const { tradeSymbols } = useTradeSymbols();

  const latestBookNumber = bookTrades.reduce((latest, curr) => {
    if (curr.bookNumber > latest) return curr.bookNumber;
    return latest;
  }, 0);
  const latestBook = bookTrades?.filter(({ bookNumber }) => bookNumber === latestBookNumber) || [];
  const latestTradeNumber = latestBook.reduce((latest, curr) => {
    if (curr.tradeNumber > latest) return curr.tradeNumber;
    return latest;
  }, 0);
  const tradeNumber = latestTradeNumber < 15 ? latestTradeNumber + 1 : 1;
  const bookNumber = tradeNumber === 1 ? latestBookNumber + 1 : latestBookNumber;

  const [saving, setSaving] = useState(false);
  const [showingDialog, setShowDialog] = useState(false);
  const showDialog = () => setShowDialog(true);
  const hideDialog = () => setShowDialog(false);
  const [symbol, setSymbol] = useState('');
  const [model, setModel] = useState('');
  const [side, setSide] = useState<TradeSide>(TradeSide.Long);
  const [entry, setEntry] = useState<number>(0);
  const [exits, setExits] = useState<number[]>([]);
  const entryDiff = exits.reduce((total, curr) => total + calcPips(entry, curr, side, symbol), 0);
  // eslint-disable-next-line no-nested-ternary
  const entryPipsClass = entryDiff > 0 ? 'text-success' : entryDiff < 0 ? 'text-danger' : '';
  // eslint-disable-next-line no-nested-ternary
  const entryPipsPrefix = entryDiff > 0 ? '+' : entryDiff < 0 ? '-' : '';
  const [notes, setNotes] = useState('');
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');
  useEffect(() => {
    if (!showingDialog) {
      setSaving(false);
      setSymbol('');
      setModel('');
      setSide(TradeSide.Long);
      setEntry(0);
      setExits([]);
      setNotes('');
      setImage1('');
      setImage2('');
    }
  }, [showingDialog]);

  const canSave = symbol && model && (entry && exits.length);
  const save = async () => {
    if (busy) return;
    setSaving(true);
    const newTrade: ITradeEntry = {
      id: 0,
      bookName,
      bookNumber,
      tradeNumber,
      date: Date.now(),
      symbol,
      model,
      side,
      entry,
      exits,
      pips: [],
      notes,
      image1,
      image2,
    };
    const { error, tradeEntry } = await API.TradeLog.SaveTradeEntry.post({ tradeEntry: newTrade });
    if (error) handleMessageAndError({ error }, dispatch);
    if (tradeEntry) {
      refresh({ bookTrades: [...bookTrades, tradeEntry] }, false);
    }
    setSaving(false);
    hideDialog();
  };

  if (!latestBookNumber || !latestBook?.length) return null;
  return <>
    <Button className='d-flex col-auto align-items-center' onClick={showDialog} disabled={busy}>
      <AddCircle /> <span className='d-none d-md-block'>Add</span>
      </Button>
    <ResponsiveModal
      show={showingDialog}
      handleClose={hideDialog}
      header={<span className='fs-5'>{bookName}: {bookNumber}.{tradeNumber}</span>}
      body={<>
        <div>Currency</div>
        <FormControl
            className='mb-1'
            value={symbol}
            disabled={saving}
            onChange={({ target: { value } }) => setSymbol(value)}
          />
        {tradeSymbols.map(({ name }, idx) => <Button
        className='me-1 mb-1'
        key={`${name}-${idx}`}
        onClick={() => setSymbol(name)}
        variant='outline-secondary'
        active={symbol === name}
        disabled={saving}
        >{name}</Button>)}
        <hr/>
        <div>Side</div>
        <ToggleButtonGroup type='radio' defaultValue={tradeSymbols?.[0]} name='tradeSymbols' onChange={(value) => setSide(value)}>
          {$enum(TradeSide).map((s, idx) => <ToggleButton
          key={`${s}-${idx}`}
          id={s}
          value={s}
          variant='outline-secondary'
          disabled={saving}
          >{s}</ToggleButton>)}
        </ToggleButtonGroup>
        <hr/>
        <div>Model</div>
        <FormControl
          className='mb-1'
          value={model}
          disabled={saving}
          onChange={({ target: { value } }) => setModel(value)}
        />
        {tradeModels.map(({ name }, idx) => <Button
          className='me-1 mb-1'
          variant='outline-secondary'
          active={model === name}
          key={`${name}-${idx}`}
          onClick={() => setModel(name)}
          disabled={saving}
          >{name}</Button>)}
        <hr/>
        <div className='d-flex flex-row'>
          <div className='d-flex flex-column me-1'>
            <div>Entry price</div>
            <InputGroup>
              <FormControl
                value={entry}
                type='number'
                disabled={saving}
                step='0.0001'
                onChange={({ target: { value } }) => setEntry(+value)}
              />
              {<InputGroup.Text className={entryPipsClass}>{entryPipsPrefix}{chain(entryDiff).abs().done()}</InputGroup.Text>}
            </InputGroup>
          </div>
          <div className='d-flex flex-column'>
            <div>Exit price(s)</div>
            <div>
            {exits.map((value, idx) => {
              const exitDiff = calcPips(entry, value, side, symbol);
              // eslint-disable-next-line no-nested-ternary
              const exitClassName = exitDiff > 0 ? 'text-success' : exitDiff < 0 ? 'text-danger' : '';
              // eslint-disable-next-line no-nested-ternary
              const exitPrefix = exitDiff > 0 ? '+' : exitDiff < 0 ? '-' : '';
              return <InputGroup
                key={idx}
                className='mb-1'
              >
              <FormControl
                value={value}
                type='number'
                disabled={saving}
                step='0.0001'
                onChange={({ target: { value: newValue } }) => setExits(exits.map((val, i) => (i === idx ? +newValue : val)))}
              />
              {<InputGroup.Text className={exitClassName}>{exitPrefix}{chain(exitDiff).abs().done()}</InputGroup.Text>}
              </InputGroup>;
            })}
            <Button
            disabled={saving}
            className='me-1 mb-1'
            onClick={() => setExits([...exits, entry])}><Add /></Button>
            <Button
            disabled={saving}
            className='me-1 mb-1'
            onClick={() => setExits(exits.slice(0, -1))}><Remove /></Button>
            </div>
          </div>
        </div>
        <hr/>
        <div>Notes</div>
        <FormControl
          value={notes}
          as='textarea'
          disabled={saving}
          rows={6}
          onChange={({ target: { value } }) => setNotes(value)}
        />
        <hr/>
        <div>Images</div>
        <InputGroup className='mb-1'>
          <InputGroup.Text>Image 1</InputGroup.Text>
          <FormControl
            value={image1}
            disabled={saving}
            onChange={({ target: { value } }) => setImage1(value)}/>
        </InputGroup>
        <InputGroup>
          <InputGroup.Text>Image 2</InputGroup.Text>
          <FormControl
            disabled={saving}
            value={image2}
            onChange={({ target: { value } }) => setImage2(value)}/>
        </InputGroup>
      </>}
      footer={<div className='d-flex flex-row justify-content-between'>
        <div className='w100'><Button onClick={hideDialog}>Cancel</Button></div>
        <div className='w100'><Button disabled={!canSave} onClick={save}>Save</Button></div>
      </div>}
    />
  </>;
};

export default React.memo(EntryDialog);
