import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Alert, Card, Col, Form, InputGroup, Row, Spinner,
  Placeholder,
  Button,
  ButtonGroup,
} from 'react-bootstrap';
import { AccountDetails as labels } from '@labels';
import { DateTime, Info } from 'luxon';
import { IUserTrimmed, RoleId } from '@interfaces';
import {
  editAccount, getManagers, getUserInfo, useAccount,
} from '../admin.store';

const Field: React.FunctionComponent<{
  label: string;
  value?: string;
  loading: boolean;
  busy: boolean;
  edit?: boolean;
  handleChange?: (value: string) => void; options?: { id: number; name: string }[];
}> = (props) => <Form.Group as={Col} xs={12} sm={6}>
  <Form.Label>{props.label}</Form.Label>
  {props.loading && <Placeholder animation='glow'>
    <Placeholder xs='12' />
  </Placeholder>}
  {!props.children && props.options
    && <Form.Select
      value={props.value}
      disabled={!props.edit || props.busy}
      onChange={(e) => props.edit && props.handleChange(e.target.value)}
    >
      {props.options.map(({ id, name }, i) => <option key={i} value={id}>{name}</option>)}
    </Form.Select>}
    {!props.children && !props.options && <Form.Control
      value={props.value}
      readOnly={!props.edit || props.busy}
      onChange={(e) => props.edit && props.handleChange?.(e.target.value)}
    />}
  {props.children}
</Form.Group>;

export default function AccountDetails() {
  const { userinfo } = getUserInfo();
  const { accountNumber } = useParams<{ accountNumber: string }>();
  const dispatch = useDispatch();
  const { account, accountLoading, refreshAccount } = useAccount(accountNumber, dispatch);
  const { managers, managersLoading } = getManagers();
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    if (userinfo && !canEdit && [RoleId.admin, RoleId.director].includes(userinfo?.roleId)) {
      setCanEdit(true);
    }
  }, [userinfo]);
  const [editing, setEditing] = useState(false);
  const editClicked = () => {
    setEditing(true);
  };
  const [acct, setAcct] = useState<IUserTrimmed>(account);
  useEffect(() => {
    if (account) setAcct(account);
  }, [account]);
  const {
    name, lastname, businessEntity, email, obYear, obMonth, fmId, hasAccountsAccess,
  } = acct;
  const [busy, setBusy] = useState(false);
  const saveClicked = async () => {
    setBusy(true);
    await editAccount(account?.id,
      {
        name, lastname, businessEntity, email, obYear, obMonth, fmId, hasAccountsAccess,
      },
      dispatch);
    refreshAccount();
    setBusy(false);
    setEditing(false);
  };
  const cancelClicked = () => {
    setEditing(false);
  };
  const setNumProp = (propName: keyof Pick<IUserTrimmed, 'obYear' | 'obMonth'>, value: number) => {
    if (['obYear', 'obMonth'].includes(propName)) { setAcct({ ...acct, [propName]: value }); }
  };
  const setStringProp = (propName: keyof Pick<IUserTrimmed, 'name' | 'lastname' | 'businessEntity' | 'email'>, value: string) => {
    if (['name', 'lastname', 'businessEntity', 'email'].includes(propName)) { setAcct({ ...acct, [propName]: value }); }
  };
  const setHasAccountsAccess = (hasAccess: boolean) => {
    if (hasAccountsAccess !== hasAccess) { setAcct({ ...acct, hasAccountsAccess: hasAccess }); }
  };
  const setManager = (_fmId: number) => {
    const selectedManager = managers.find(({ id: f }) => _fmId === f);
    if (selectedManager) {
      setAcct({ ...acct, fmId: selectedManager.id });
    }
  };
  const years = [...Array(DateTime.local().year - 2017 + 1)].map((_, delta) => 2017 + delta);
  const months = [...Array(12)].map((_, idx) => Info.months()[idx]);
  if (accountLoading) return <Alert variant='secondary'>Loading <Spinner animation='grow' size='sm' /></Alert>;
  if (!accountNumber || !accountNumber) return <Alert variant='danger'>Could not load details for account {accountNumber}</Alert>;
  return <>
    <Card>
      {accountLoading
        ? <Placeholder as={Card.Header}>
          <Placeholder xs={6} />
        </Placeholder>
        : <Card.Header>
          <div className='d-flex flex-row flex-wrap'>
            <div className='fs-5 d-flex col'>
              {account?.displayName} {account?.accountNumber}
            </div>
            <div className='col-12 col-sm-auto d-flex justify-sm-content-end'>
              {busy && <Spinner animation='grow' />}
              {canEdit && <ButtonGroup>
                {!editing && <Button onClick={editClicked} variant='warning'>{labels.Edit}</Button>}
                {editing && <Button disabled={busy} variant='outline-warning' onClick={saveClicked}>{labels.Save}</Button>}
                {editing && <Button disabled={busy} variant='secondary' onClick={cancelClicked}>{labels.Cancel}</Button>}
              </ButtonGroup>}
            </div>
          </div>
        </Card.Header>}
      <Card.Body>
        <Row>
          <Field label={labels.AccountFirstName} loading={accountLoading} busy={busy} value={name} edit={editing}
          handleChange={(value) => setStringProp('name', value)} />
          <Field label={labels.AccountLastName} loading={accountLoading} busy={busy} value={lastname} edit={editing}
          handleChange={(value) => setStringProp('lastname', value)} />
          <Field label={labels.BusinessEntity} loading={accountLoading} busy={busy} value={businessEntity} edit={editing}
          handleChange={(value) => setStringProp('businessEntity', value)} />
          <Field label={labels.Email} loading={accountLoading} busy={busy} value={email} edit={editing}
          handleChange={(value) => setStringProp('email', value)} />
          <Field label={labels.AccountManager} loading={managersLoading} busy={busy} value={`${fmId}`}
            options={managers.map(({ id, displayName }) => ({ id, name: displayName }))} edit={editing}
            handleChange={(value) => setManager(+value)} />
          <Field label={labels.AccountNumber} loading={accountLoading} busy={busy} value={account.accountNumber} />
          <Field label={labels.AccountOpened} loading={accountLoading} busy={busy} edit={editing}>
            <InputGroup>
              <Form.Select
                value={obYear}
                disabled={!editing || busy}
                onChange={(e) => editing && setNumProp('obYear', +e.target.value)}
              >{years.map((y) => <option key={y} value={y}>{y}</option>)}</Form.Select>
              <Form.Select
                value={obMonth}
                disabled={!editing || busy}
                onChange={(e) => editing && setNumProp('obMonth', +e.target.value)}
              >{months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</Form.Select>
            </InputGroup>
          </Field>
          <Field label={labels.NewSiteAccess} loading={accountLoading} busy={busy} edit={editing}>
            <ButtonGroup as={Col} xs='12'>
              <Button
              disabled={!editing || accountLoading || busy}
              variant={hasAccountsAccess ? 'primary' : 'outline-primary'}
              active={hasAccountsAccess}
              onClick={() => setHasAccountsAccess(true)}>{labels.NewSiteOn}</Button>
              <Button
              disabled={!editing || accountLoading || busy}
              variant={!hasAccountsAccess ? 'primary' : 'outline-primary'}
              active={!hasAccountsAccess}
              onClick={() => setHasAccountsAccess(false)}>{labels.NewSiteOff}</Button>
            </ButtonGroup>
          </Field>
        </Row>
      </Card.Body>
    </Card>
  </>;
}
