import React, { useState } from 'react';
import {
  FormSelect, Button, Accordion, InputGroup, ButtonGroup,
} from 'react-bootstrap';
import ModalResponsive from '@components/Modal';
import { Documents as DocumentLabels } from '@labels';
import {
  getManagers, getUserInfo, openAccount, useApplication, useApplications,
} from '@admin/admin.store';
import { CombinedState } from '@store/state';
import AccordionHeader from 'react-bootstrap/esm/AccordionHeader';
import { useDispatch, useSelector } from 'react-redux';
import { Info as DateTimeInfo } from 'luxon';
import { RoleName } from '@interfaces';
import { createSelector } from 'reselect';
import { admin } from '../../admin/admin.reducers';

const { Applications: labels } = DocumentLabels;

const selector = createSelector([
  (state: CombinedState) => state.admin.showOpenAccountDialogForApplicationUUID,
], (uuid) => (uuid));

export default function OpenAccountDialog() {
  const dispatch = useDispatch();
  const uuid = useSelector(selector);
  const show = uuid !== '';
  const hidePrompt = () => dispatch(admin.actions.showOpenAccountDialogForApplicationUUID(null));
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const tabClicked = (key: string) => {
    if (key === activeTab) return setActiveTab('');
    return setActiveTab(key);
  };
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(0);
  const [managerId, setManagerId] = useState(0);
  const { application } = useApplication(
    dispatch,
    uuid,
  );

  const { managers, managersLoading } = getManagers();
  const handleOpenAccountClicked = async () => {
    if (uuid) {
      setBusy(true);
      await openAccount(
        {
          uuid,
          month,
          year,
          managerId,
        },
        dispatch,
      );
      setBusy(false);
      hidePrompt();
    }
  };

  const { userinfo } = getUserInfo();
  if (![RoleName.admin, RoleName.director].includes(userinfo?.role)) return null;
  if (!application) return null;
  const { applicantContact: { name, lastName }, authEmail, appPIN } = application;
  const instructionName = `${name} ${lastName} (${authEmail})`;

  const openAccountButton = <Button {...{
    className: 'w-50',
    disabled: !application || !managerId || busy,
    onClick: () => (application && managerId) && handleOpenAccountClicked(),
  }}>{labels.OpenAccount}</Button>;
  const header = <span className='fs-5'>{labels.OpenAccount}</span>;
  const body = (
    <>
      <p>{labels.OpenAccountInstruction(instructionName)}</p>
      <Accordion activeKey={activeTab}>
        <Accordion.Item eventKey='1'>
          <AccordionHeader onClick={() => tabClicked('1')}>
            1. {labels.SelectAManager}
          </AccordionHeader>
          <Accordion.Body>
            <FormSelect {...{
              value: managerId,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setManagerId(+e.target.value),
            }}>
              {managersLoading && <option value={''}>{labels.loadingManagers}</option>}
              <option value={''}>{labels.Choose}</option>
              {!managersLoading && managers?.map((m, i) => (
                <option value={m.id} key={m.id || i}>{m.displayName}</option>
              ))}
            </FormSelect>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey='2'>
          <AccordionHeader onClick={() => tabClicked('2')}>
            2. {labels.SelectOpenMonth}
          </AccordionHeader>
          <Accordion.Body>
            <p>{labels.SelectOpenMonthInstruction}</p>
            <InputGroup>
              <FormSelect
                value={month}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMonth(+e.target.value)}
              >
                <option value={0}>{labels.SelectMonth}</option>
                {DateTimeInfo.months().map((m, index) => <option key={index + 1} value={index + 1}>{m}</option>)}
              </FormSelect>
              <FormSelect
                value={year}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setYear(+e.target.value)}
              >
                <option value={0}>{labels.SelectYear}</option>
                {[2017, 2018, 2019, 2020, 2021, 2022, 2023].map((m, index) => <option key={index + 1} value={m}>{m}</option>)}
              </FormSelect>
            </InputGroup>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey='3'>
          <AccordionHeader onClick={() => tabClicked('3')}>
            3. {labels.OpenAccountClick}
          </AccordionHeader>
          <Accordion.Body>
            {openAccountButton}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </>
  );
  const footer = <ButtonGroup className='w-100'>
    <Button {...{
      className: 'w-50',
      variant: 'secondary',
      onClick: hidePrompt,
    }}>{labels.Cancel}</Button>
    {openAccountButton}
  </ButtonGroup>;

  return <ModalResponsive
    show={show}
    handleClose={hidePrompt}
    header={header}
    body={body}
    footer={footer}
  />;
}
