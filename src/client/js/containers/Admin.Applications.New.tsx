import React, { useState } from 'react';
import {
  FormControl, FormSelect, Button, Accordion, ButtonGroup, Card,
} from 'react-bootstrap';
import ModalResponsive from '@components/Modal';
import { Documents as DocumentLabels } from '@labels';
import { getManagers, createApplication } from '@admin/admin.store';
import AccordionHeader from 'react-bootstrap/esm/AccordionHeader';
import { GenerateApplicationInvitationEmailTemplate } from '@email';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import { useDispatch } from 'react-redux';

const { Applications: labels } = DocumentLabels;

export default function NewApplication() {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const showPrompt = () => setShow(true);
  const hidePrompt = () => setShow(false);
  const [activeTab, setActiveTab] = useState('');
  const tabClicked = (key: string) => {
    if (key === activeTab) return setActiveTab('');
    return setActiveTab(key);
  };
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState(null);
  const { managers, managersLoading } = getManagers();
  const manager = managers?.find(({ id }) => managerId === id);
  const createApp = async () => {
    setBusy(true);
    await createApplication({
      email,
      name,
      fmId: managerId,
    }, dispatch);
    setBusy(false);
    setShow(false);
  };
  const sendInviteButton = <Button {...{
    className: 'w-50',
    disabled: !email || !name || !managerId || busy,
    onClick: () => (email && name && managerId) && createApp(),
  }}>{labels.sendInvitation}</Button>;
  const header = <span className='fs-5'>{labels.sendInvitation}</span>;
  const body = (
    <>
    <Accordion activeKey={activeTab}>
      <Accordion.Item eventKey='1'>
        <AccordionHeader onClick={() => tabClicked('1')}>
          1. {labels.NamePlaceholder}
        </AccordionHeader>
        <Accordion.Body>
        <FormControl {...{
          value: name,
          placeholder: labels.ApplicantName,
          onChange: (e) => setName(e?.target?.value),
        }} />
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey='2'>
        <AccordionHeader onClick={() => tabClicked('2')}>
          2. {labels.ApplicantEmailPlaceholder}
        </AccordionHeader>
        <Accordion.Body>
        <FormControl {...{
          value: email,
          placeholder: labels.ApplicantUsername,
          onChange: (e) => setEmail(e?.target?.value),
        }} />
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey='3'>
        <AccordionHeader onClick={() => tabClicked('3')}>
          3. {labels.SelectAManager}
        </AccordionHeader>
        <Accordion.Body>
          <FormSelect {...{
            value: managerId,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setManagerId(+e.target.value),
          }}>
            {managersLoading && <option value={null}>{labels.loadingManagers}</option>}
            <option value={null}>{labels.Choose}</option>
            {managers?.map((m) => (
              <option value={m.id} key={m.id}>{m.displayName}</option>
            ))}
          </FormSelect>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey='4'>
        <AccordionHeader onClick={() => tabClicked('4')}>
          4. {labels.PreviewEmail}
        </AccordionHeader>
        <Accordion.Body>
          <Card>
            <Card.Body>
              {GenerateApplicationInvitationEmailTemplate({
                email, name, manager: manager?.displayName, PIN: '[PIN will be auto-generated when you send the invite]',
              })}
            </Card.Body>
          </Card>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey='5'>
        <AccordionHeader onClick={() => tabClicked('5')}>
          5. {labels.sendInvite}
        </AccordionHeader>
        <Accordion.Body>
          {sendInviteButton}
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
    {sendInviteButton}
    </ButtonGroup>;

  return <>
  <Button
    variant='outline-primary'
    onClick={showPrompt}
  ><ForwardToInboxIcon/> {labels.sendInvitation}</Button>
  <ModalResponsive
    show={show}
    handleClose={hidePrompt}
    header={header}
    body={body}
    footer={footer}
  />
  </>;
}
