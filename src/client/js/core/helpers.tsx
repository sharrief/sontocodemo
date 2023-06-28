import React from 'react';
import '@formatjs/intl-numberformat/polyfill';
import '@formatjs/intl-numberformat/locale-data/en';
import { RequestStatus } from '@interfaces';
import CheckCircle from '@mui/icons-material/CheckCircle';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import Recurring from '@mui/icons-material/Cached';
import Voided from '@mui/icons-material/NotInterested';
import Error from '@mui/icons-material/Error';
import Delete from '@mui/icons-material/Delete';
import Row from 'react-bootstrap/esm/Row';
import Col from 'react-bootstrap/esm/Col';
import { createBrowserHistory, createHashHistory } from 'history';

export default function configureHistory() {
  // eslint-disable-next-line no-constant-condition
  return (window.matchMedia('(display-mode: standalone)').matches || true)
    ? createHashHistory({ hashType: 'slash' })
    : createBrowserHistory();
}

export const formats = {
  currency: '($0,0.00)',
  currencyShort: '($0.000)',
  percentage: '(0.000%)',
  statementDate: 'MMMM yyyy',
  lastStatementDate: 'MMMM dd, yyyy',
  processingDateBegins: 'MMMM d, yyyy h:mm a ZZZZ',
  statementLineDate: 'MM/dd/yy',
  chartMonth: 'MMM-yy',
};

export function amount(number: number) {
  return Intl.NumberFormat('en-us', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(number);
}
export function currency(number: number) {
  return Intl.NumberFormat('en-us', { style: 'currency', currency: 'USD' }).format(number);
}
export function currencyShort(number: number) {
  return Intl.NumberFormat('en-us', {
    style: 'currency', currency: 'USD', notation: 'compact', compactDisplay: 'short', minimumSignificantDigits: 1,
  }).format(number);
}
export function percent(number: number) {
  return Intl.NumberFormat('en-us', { style: 'percent', maximumSignificantDigits: 4 }).format(number);
}
export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getIconByRequestStatus(status: RequestStatus) {
  if (status === 'pending') return <HourglassEmpty/>;
  if (status === 'approved') return <CheckCircle/>;
  if (status === 'voided' || status === 'declined') return <Voided/>;
  if (status === 'recurring') return <Recurring/>;
  if (status === 'deleted') return <Delete/>;
  return <Error/>;
}

export function createMenuItem(icon: JSX.Element, label: React.ReactNode, rowClass: string) {
  return (
  <Row className={`m-0 ${rowClass} menu-item`}>
    <Col className='p-0' xs='12' md='4'>
      {icon}
    </Col>
    <Col className='p-0' md='8'>{label}</Col>
  </Row>);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trimObjValues<T extends {[key: string]: any}>(obj: T) {
  if (obj == null || typeof obj !== 'object') return obj;
  const copy = { ...obj };
  // eslint-disable-next-line array-callback-return
  Object.keys(obj).map((k: keyof T) => {
    if (typeof obj[k] === 'string') {
      copy[k] = obj[k].trim();
    } else if (typeof obj[k] === 'object') {
      copy[k] = trimObjValues(obj[k]);
    }
  });
  return copy;
}
