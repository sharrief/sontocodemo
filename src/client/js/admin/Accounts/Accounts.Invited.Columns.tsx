/* eslint-disable no-param-reassign */
import React from 'react';
import { Cell } from 'react-table';
import DeleteIcon from '@mui/icons-material/Delete';
import { IApplication } from '@interfaces';
import { DateTime } from 'luxon';
import { Documents as DocumentLabels } from '@labels';
import AccountCircle from '@mui/icons-material/AccountCircle';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import MoreVert from '@mui/icons-material/MoreVert';
import OpenAccountButton from '@components/AccountsList/AccountsList.OpenAccountButton';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { DashboardTabs } from '@client/js/dashboard/Dashboard';
import { endpoints } from '@api';

const { Applications: Labels } = DocumentLabels;

function DateCell({ value }: Cell<IApplication, number>) {
  return <>{value ? DateTime.fromMillis(value).toLocaleString(DateTime.DATETIME_FULL) : ''}</>;
}

export default (clickedDeleteApp: (uuid: string) => void) => [
  {
    Header: Labels.Actions,
    accessor: 'uuid',
    disableFilters: true,
    Cell: Object.assign(({ value: uuid, row }: Cell<IApplication, IApplication['uuid']>) => {
      const accountNumber = row?.values?.accountNumber;
      const authEmail = row?.values?.authEmail;
      const appPIN = row?.values?.appPIN;
      const dateEnded: IApplication['dateEnded'] = row?.values?.dateEnded;
      return (
        <DropdownButton title={<MoreVert />}>
          <Dropdown.Item
            variant='outline-secondary'
            onClick={() => window.open(`/application?uuid=${uuid}`, '_blank')}
          >
            <VisibilityRounded />&nbsp;{Labels.ViewApplication}
          </Dropdown.Item>
          <Dropdown.Item
            variant='outline-secondary'
            onClick={() => clickedDeleteApp(uuid)}
          >
            <DeleteIcon />&nbsp;{Labels.DeleteApplication}
          </Dropdown.Item>
          {accountNumber && <Dropdown.Item
            as={NavLink}
            to={`${endpoints.dashboard}/${accountNumber}/${DashboardTabs.statements}`}
            rel='noreferrer'
            target='_blank'><AccountCircle /> {Labels.GoToAccount}</Dropdown.Item>
          }
          {!accountNumber && <OpenAccountButton
          uuid={uuid}
          authEmail={authEmail}
          appPIN={appPIN}
          appComplete={dateEnded !== 0}/>}
        </DropdownButton>
      );
    }, { displayName: 'DeleteApplication' }),
  }, {
    Header: '',
    accessor: 'selected',
    disableFilters: true,
  }, {
    Header: Labels.CreatedBy,
    accessor: 'accountNumber',
    disableFilters: true,
  }, {
    Header: Labels.ApplicantUsername,
    accessor: 'authEmail',
    disableFilters: true,
  }, {
    Header: Labels.ApplicantName,
    accessor: 'name',
    disableFilters: true,
  }, {
    Header: Labels.AppPIN,
    accessor: 'appPIN',
    disableFilters: true,
  }, {
    Header: Labels.CreatedBy,
    accessor: 'manager',
    disableFilters: true,
  }, {
    Header: Labels.DateCreated,
    accessor: 'dateCreated',
    disableFilters: true,
    Cell: DateCell,
  }, {
    Header: Labels.ApplicationStarted,
    accessor: 'Started',
    disableFilters: true,
    Cell: DateCell,
  }, {
    Header: Labels.DateEnded,
    accessor: 'dateEnded',
    disableFilters: true,
    Cell: DateCell,
  }];
