import React, { useState } from 'react';
import {
  FormSelect, Button, Accordion, InputGroup, ButtonGroup,
} from 'react-bootstrap';
import ModalResponsive from '@components/Modal';
import { Documents as DocumentLabels } from '@labels';
import {
  getManagers, getUserInfo, openAccount, useApplications,
} from '@admin/admin.store';
import AccordionHeader from 'react-bootstrap/esm/AccordionHeader';
import AccountBox from '@mui/icons-material/AccountBox';
import { useDispatch } from 'react-redux';
import { Info as DateTimeInfo } from 'luxon';
import DropdownItem from 'react-bootstrap/esm/DropdownItem';
import { RoleName } from '@interfaces';
import { admin } from '../../admin/admin.reducers';

const { Applications: labels } = DocumentLabels;

export default function OpenAccount(props: {
  uuid: string,
  authEmail: string,
  appPIN: string,
  appComplete: boolean }) {
  const {
    uuid, authEmail, appPIN, appComplete,
  } = props;
  const dispatch = useDispatch();
  const showPrompt = () => dispatch(admin.actions.showOpenAccountDialogForApplicationUUID(uuid));

  const { userinfo } = getUserInfo();
  if (![RoleName.admin, RoleName.director].includes(userinfo?.role)) return null;

  return <>
  <DropdownItem
    disabled={!appComplete}
    onClick={showPrompt}
    className='text-danger'
  ><AccountBox/> {appComplete ? labels.OpenAccount : labels.AppIncomplete}</DropdownItem>
  </>;
}
