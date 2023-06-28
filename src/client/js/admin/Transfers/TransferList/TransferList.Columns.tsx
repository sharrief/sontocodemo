import React from 'react';
import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import { StageInfoPopover } from '@components/Transfers/TransactionProgressBar';
import {
  RequestID,
  Status,
  Amount,
  DateTime,
  StageCell,
  PostedDate,
  EffectiveDate,
  Account,
  Manager,
} from '@admin/Transfers/TransferList';
import Info from '@mui/icons-material/Info';
import { Activity as Labels } from '@labels';
import AccountBox from '@mui/icons-material/AccountBox';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Event from '@mui/icons-material/Event';
import EventAvailable from '@mui/icons-material/EventAvailable';
import StickyNote2 from '@mui/icons-material/StickyNote2';

// TODO specify type for column, disableFilters is required if no Filter provided
export default function getColumns() {
  return [
    {
      accessor: 'status',
      Header: 'Status',
      Cell: Status,
    },
    {
      accessor: 'id', Header: Labels.ID, disableFilters: true, inHeader: true, Cell: RequestID,
    },
    {
      accessor: 'amount', Header: Labels.Amount, Cell: Amount, disableFilters: true, inHeader: true,
    },
    {
      accessor: 'account', Header: <><div className='d-lg-none'><AccountCircle/></div><div className='d-none d-lg-inline'>{Labels.Account}</div></>, Cell: Account, disableFilters: true,
    },
    {
      accessor: 'manager', Header: <><div className='d-lg-none'><AccountBox /></div><div className='d-none d-lg-inline'>{Labels.Manager}</div></>, Cell: Manager, disableFilters: true,
    },
    {
      accessor: 'datetime', Header: <><div className='d-lg-none'><Event /></div><div className='d-none d-lg-inline'>{Labels.Requested}</div></>, Cell: DateTime, disableGlobalFilter: true, disableFilters: true,
    },
    // {
    //   accessor: 'posted', Header: <><div className='d-lg-none'><EventAvailable /></div><div className='d-none d-lg-inline'>{Labels.Posted}</div></>, Cell: PostedDate, disableGlobalFilter: true, disableFilters: true,
    // },
    {
      accessor: 'effectiveTradeMonth', Header: <><div className='d-lg-none'></div><div className='d-none d-lg-inline'>{Labels.Effective}</div></>, Cell: EffectiveDate, disableGlobalFilter: true, disableFilters: true,
    },
    {
      accessor: 'document',
      Header: function StageHeader() {
        return <>
        <div className='d-lg-none'><StickyNote2 /></div>
        <div className='d-none d-lg-inline'>
          <OverlayTrigger
            trigger={'click'}
            placement='bottom'
            overlay={StageInfoPopover}
            rootClose={true}>
              <span><Info/> {Labels.Progress}</span>
          </OverlayTrigger>
        </div>
      </>;
      },
      disableGlobalFilter: true,
      Cell: StageCell,
    },
  ];
}
