/* eslint-disable no-param-reassign */
import React from 'react';
import { Cell } from 'react-table';
import { IUser } from '@interfaces';
import { Documents as DocumentLabels } from '@labels';
import AccountBox from '@mui/icons-material/AccountBox';
import AccountCircle from '@mui/icons-material/AccountCircle';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import Email from '@mui/icons-material/Email';
import RadioButtonChecked from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';

import {
  Button,
  ButtonGroup,
  Dropdown,
} from 'react-bootstrap';
import { AccountActions } from './AccountActions';

const { Accounts: Labels } = DocumentLabels;

export default function AccountActiveColumns(props: {
  handleMessage: (args: { message?: string; error?: string}) => void;
  onTransferDialogClose: () => void;
  onChangeEmailClose: () => void;
  onPopulateDialogClose: (populated: boolean) => void;
  onSelect: (id: number) => void;
  onShowStatements: (accountNumber: string) => void;
  busy: boolean;
}) {
  return [
    {
      Header: Labels.Actions,
      accessor: 'id',
      disableFilters: true,
      Cell: Object.assign(({ row, value: id }: Cell<IUser, IUser['id']>) => {
        const accountNumber = row?.values?.accountNumber;
        const email = row?.values?.email;
        const selected = row?.values?.selected;
        const variant = selected ? 'success' : 'secondary';
        return (
      <Dropdown as={ButtonGroup}>
        <Button
          variant={variant}
          onClick={() => props.onSelect(id)}
          disabled={props.busy}
        >
          {selected ? <RadioButtonChecked/> : <RadioButtonUnchecked/>}
        </Button>
        <AccountActions accountNumber={accountNumber} hideLabel={true}/>
      </Dropdown>
        );
      }, { displayName: 'AccountActions' }),
    }, {
      Header: <>
      <span className='d-lg-none'><AccountCircle/></span>
      <span className='d-none d-lg-inline'>{Labels.AccountHolder}</span>
    </>,
      accessor: 'accountNumber',
      disableFilters: true,
      Cell: Object.assign(({ row }: Cell<IUser, IUser['id']>) => {
        const name = row?.values?.displayName;
        const number = row?.values?.accountNumber;
        return `${name} (${number})`;
      }, { displayName: 'Account' }),
    }, {
      Header: '',
      accessor: 'selected',
      disableFilters: true,
    }, {
      Header: Labels.AccountHolder,
      accessor: 'displayName',
      disableFilters: true,
    }, {
      Header: <>
      <span className='d-lg-none'><Email/></span>
      <span className='d-none d-lg-inline'>{Labels.Contact}</span>
    </>,
      accessor: 'contact',
      disableFilters: true,
      Cell: Object.assign(({ row }: Cell<IUser, IUser['id']>) => {
        const contact = row?.values?.contact;
        const email = row?.values?.email;
        return <>{contact} <a href={`mailto:${email}`}>{email}</a></>;
      }, { displayName: 'AccountContact' }),
    }, {
      Header: Labels.email,
      accessor: 'email',
      disableFilters: true,
    }, {
      Header: <>
      <span className='d-lg-none'><AccountBox/></span>
      <span className='d-none d-lg-inline'>{Labels.manager}</span>
    </>,
      accessor: 'manager',
      disableFilters: true,
    }, {
      Header: <>
      <span className='d-lg-none'><AccountBalanceWallet/></span>
      <span className='d-none d-lg-inline'>{Labels.latestBalance}</span>
    </>,
      accessor: 'latestBalance',
      disableFilters: true,
      Cell: Object.assign(({ row, value: latestBalance }: Cell<IUser, IUser['id']>) => {
        const accountNumber = row?.values?.accountNumber;
        const latestBalanceMessages = row?.values?.latestBalanceMessages;
        return <><Button className='p-0 fs-6 text-capitalize fw-normal' variant='link' onClick={() => props.onShowStatements(accountNumber)}>{latestBalance}</Button> {latestBalanceMessages}</>;
      }, { displayName: 'AccountContact' }),
    }, {
      Header: '',
      accessor: 'latestBalanceMessages',
      disableFilters: true,
    }];
}
