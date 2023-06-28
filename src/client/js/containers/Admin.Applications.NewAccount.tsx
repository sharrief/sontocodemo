import React, { useContext, useState } from 'react';
import {
  Button, ButtonGroup, Card, Form, Row, Col, Accordion, useAccordionButton, AccordionContext,
} from 'react-bootstrap';
import ModalResponsive from '@components/Modal';
import { Documents as DocumentLabels } from '@labels';
import { getManagers, getUserInfo, newAccount } from '@admin/admin.store';
import PersonAdd from '@mui/icons-material/PersonAdd';
import { useDispatch } from 'react-redux';
import { Info as DateTimeInfo } from 'luxon';
import { getAccountOpenedEmailSubject } from 'shared/email/labels';
import { GenerateAccountOpenedEmailTemplate } from '@email';
import DropdownItem from 'react-bootstrap/esm/DropdownItem';
import { RoleName } from '@interfaces';

const { Accounts: labels } = DocumentLabels;

function ToggleSendEmail({
  title, eventKey, onChange,
}: {
  title: string;
  eventKey: string;
  onChange: (eventKey: string) => void;
}) {
  const { activeEventKey } = useContext(AccordionContext);
  const click = useAccordionButton(eventKey, () => {
    onChange(eventKey);
  });
  return <Form.Switch
    label={title}
    checked={activeEventKey === eventKey}
    onChange={click}
  />;
}

export default function NewAccount({ asDropdownItem, onClose }: {
  asDropdownItem?: boolean;
  onClose?: () => void;
}) {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const showPrompt = () => setShow(true);
  const hidePrompt = () => setShow(false);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessEntity, setBusinessEntity] = useState('');
  const [email, setEmail] = useState('');
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(0);
  const [managerId, setManagerId] = useState(0);
  const [sendEmail, setSendEmail] = useState(true);
  const { userinfo } = getUserInfo();
  const { managers, managersLoading } = getManagers();
  const requiredFieldsCompleted = name && lastName && email && month && year && managerId;

  if (![RoleName.admin, RoleName.director].includes(userinfo?.role)) { return null; }
  const dropDownItemClassName = 'text-warning';
  const buttonVariant = 'outline-warning';

  const handleNewAccountClicked = async () => {
    setBusy(true);
    await newAccount({
      name,
      lastName,
      businessEntity,
      email,
      month,
      year,
      managerId,
      sendEmail,
    },
    dispatch);
    setBusy(false);
    setShow(false);
    onClose();
  };

  const newAccountButton = <Button
    className= 'w-50'
    disabled={!requiredFieldsCompleted || busy}
    onClick={() => (requiredFieldsCompleted) && handleNewAccountClicked()}
    >
      {labels.NewAccount}
      </Button>;

  const header = <span className='fs-5'>{labels.NewAccount}</span>;
  const body = (
    <>
    <p>{labels.NewAccountInstruction}</p>
    <Card>
      <Card.Body>
        <Form.Group>
          <Form.Label>{labels.firstName}</Form.Label>
          <Form.Control value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>{labels.lastName}</Form.Label>
          <Form.Control value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>{labels.businessEntity}</Form.Label>
          <Form.Control value={businessEntity} onChange={(e) => setBusinessEntity(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>{labels.email}</Form.Label>
          <Form.Control value={email} onChange={(e) => setEmail(e.target.value)} />
        </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>{labels.openingMonth}</Form.Label>
                <Form.Control as='select' value={month} onChange={(e) => setMonth(+e.target.value)}>
                  <option>{labels.Choose}</option>
                  {DateTimeInfo.months().map((m, key) => <option key={key} value={key + 1}>{m}</option>)}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>{labels.openingYear}</Form.Label>
                <Form.Control as='select' value={year} onChange={(e) => setYear(+e.target.value)}>
                  <option>{labels.Choose}</option>
                  {[2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map((y) => <option key={y} value={y}>{y}</option>)}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
        <Form.Group>
          <Form.Label>{labels.selectManager}</Form.Label>
          <Form.Control as='select' value={managerId} onChange={(e) => setManagerId(+e.target.value)}>
            <option>{managersLoading ? labels.loading : labels.Choose}</option>
            {managers
              .filter(({ id }) => id > 0)
              .map(({ id, displayName }) => <option key={id} value={id}>{displayName}</option>)}
          </Form.Control>
        </Form.Group>
      </Card.Body>
    </Card>
    <Accordion className='mt-3' defaultActiveKey='1'>
      <Card>
        <Card.Header>
          <ToggleSendEmail
          title={labels.sendEmail}
          eventKey='1'
          onChange={() => setSendEmail(!sendEmail)}/>
        </Card.Header>
        <Accordion.Collapse eventKey='1'>
          <Card.Body>
              <Row>
                <Col>{labels.Subject}</Col>
                <Col>{getAccountOpenedEmailSubject()}</Col>
              </Row>
              <Card>
                <Card.Body>
                  {GenerateAccountOpenedEmailTemplate({
                    name, accountNumber: 'TBD', link: labels.Link,
                  })}
                </Card.Body>
              </Card>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  </>
  );
  const footer = <ButtonGroup className='w-100'>
    <Button {...{
      className: 'w-50',
      variant: 'secondary',
      onClick: hidePrompt,
    }}>{labels.Cancel}</Button>
    {newAccountButton}
  </ButtonGroup>;

  return <>
  {asDropdownItem
    ? <DropdownItem
        onClick={showPrompt}
        className={dropDownItemClassName}
      >
        <PersonAdd/> {labels.NewAccount}
      </DropdownItem>
    : <Button
        onClick={showPrompt}
        variant={buttonVariant}
      ><PersonAdd/> {labels.NewAccount}</Button>
}
  <ModalResponsive
    show={show}
    handleClose={hidePrompt}
    header={header}
    body={body}
    footer={footer}
  />
  </>;
}
