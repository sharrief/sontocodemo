import React, { useState, useEffect } from 'react';
import {
  IBankDatumTrimmed, DefaultBankDatum,
  BankDatumLabels as datumLabels, BankAccountType, BankLocation, BankAccountStatus, IUser, RoleName, IReceivingBank,
} from '@interfaces';
import {
  Form, Col, Button, Badge, ButtonGroup, Row, Spinner,
} from 'react-bootstrap/esm';
import { BankInfo as labels } from '@labels';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ValidationError } from 'class-validator';
import '@css/BankInfo.css';
import { trimObjValues } from '@helpers';
import { Choice, Field, Select } from './BankInfo.Field';
import { countryObject } from './BankInfo.Countries';
import { Address } from './BankInfo.Address';
import useReceivingBanks from './helpers/useReceivingBanks';

type Props = {
  editing?: boolean;
  loading?: boolean;
  saving?: boolean;
  userinfo?: IUser;
  bankData?: IBankDatumTrimmed;
  onSave?: (bankData: IBankDatumTrimmed) => void;
  onEdit?: (uuid: string) => void;
  onReceivingBankChanged?: (receivingBankId: IReceivingBank['id'], uuid: IBankDatumTrimmed['uuid']) => void;
  onDCAFLinkSaved?: (uuid: IBankDatumTrimmed['uuid'], DCAF: IBankDatumTrimmed['DCAF']) => void;
  onSetPreferredAccount?: (uuid: IBankDatumTrimmed['uuid']) => void;
  onValidate?: (uuid: IBankDatumTrimmed['uuid']) => void;
  onCancel?: () => void;
  onDelete?: (uuid: string) => void;
  toggleAccountNumbersVisible?: (uuid: string) => void;
  accountNumbersVisible?: boolean;
  validations?: ValidationError[];
  isPreview?: boolean;
};

function BankInfoItem(props: Props = {
  editing: false,
  bankData: DefaultBankDatum,
  onSave: () => null,
  onEdit: () => null,
  onReceivingBankChanged: () => null,
  onValidate: () => null,
  onDCAFLinkSaved: () => null,
  onDelete: () => null,
  loading: false,
  saving: false,
  isPreview: false,
}) {
  const {
    onSave, onReceivingBankChanged, onValidate, onDCAFLinkSaved: onDCAFLinkChanged, onSetPreferredAccount,
    onCancel, onDelete, onEdit, isPreview,
    userinfo, editing, toggleAccountNumbersVisible, accountNumbersVisible, validations, loading, saving,
  } = props;

  const [bankData, setBankData] = useState({ ...props.bankData });
  const {
    accountType, bankLocation, bankCountry, bankName, name, lastName, status, useIBAN, DCAF,
    address, accountEnding, accountNumber, routingNumber, swift, iban, uuid, receivingBankId, extra,
  } = bankData;

  useEffect(() => {
    setBankData(props.bankData);
  }, [props.bankData]);

  useEffect(() => {
    if (editing) {
      if (bankLocation === BankLocation.Domestic) {
        setBankData({ ...bankData, bankCountry: 'US' });
      } else if (bankData.bankCountry === 'US') {
        setBankData({ ...bankData, bankCountry: '' });
      }
    }
  }, [bankLocation, editing]);

  const { receivingBanks } = useReceivingBanks();

  const [showAccountNumbers, setShowAccountNumbers] = useState(accountNumbersVisible);

  useEffect(() => {
    setShowAccountNumbers(accountNumbersVisible);
  }, [accountNumbersVisible]);

  const statusVariant = (() => {
    if (status === BankAccountStatus.Review) return 'primary';
    if (status === BankAccountStatus.Validated) return 'success';
    if (status === BankAccountStatus.Invalid) return 'danger';
    return '';
  })();

  const isPersonal = accountType === BankAccountType.Personal;
  const isDomestic = bankLocation === BankLocation.Domestic;
  const isValidated = status === BankAccountStatus.Validated;
  const isNewAccount = uuid === DefaultBankDatum.uuid;
  const userIsAdmin = [RoleName.admin, RoleName.director].includes(userinfo?.role);
  const showAccountNumberDisabled = loading;
  const editDisabled = saving;
  const canShowAccountNumbers = toggleAccountNumbersVisible || editing;
  const setValue = (prop: { [key in keyof IBankDatumTrimmed]?: IBankDatumTrimmed[key] }) => setBankData({ ...bankData, ...prop });
  const changeUseIBAN = (value: boolean) => isNewAccount && setValue({ useIBAN: value });
  const changeAccountType = (value: BankAccountType) => setValue({ accountType: value });
  const changeAccountLocation = (value: BankLocation) => isNewAccount && setValue({ bankLocation: value });
  const canChangeName = [RoleName.admin, RoleName.director].includes(userinfo?.role);
  const changeName = (value: string) => setValue({ name: value });
  const changeLastName = (value: string) => setValue({ lastName: value });
  const changeBankCountry = (value: string) => isNewAccount && setValue({ bankCountry: value });
  const changeBankName = (value: string) => setValue({ bankName: value });
  const changeAccountAddress = (value: IBankDatumTrimmed['address']) => setValue({ address: value });
  const changeAccountNumber = (value: string) => isNewAccount && setValue({ accountNumber: value });
  const changeRoutingNumber = (value: string) => isNewAccount && setValue({ routingNumber: value });
  const changeSWIFT = (value: string) => isNewAccount && setValue({ swift: value });
  const changeIBAN = (value: string) => isNewAccount && setValue({ iban: value });
  const changeExtra = (value: string) => setValue({ extra: value });
  const changePreferred = () => {
    if (editing) {
      setValue({ preferred: true });
    } else {
      onSetPreferredAccount(uuid);
    }
  };
  const changeReceivingBank = (value: string) => {
    setValue({ receivingBankId: +value });
  };

  const handleDeleteClicked = () => {
    onDelete(uuid);
  };
  const handleEditClicked = () => {
    onEdit(uuid);
  };
  const handleSaveClicked = () => {
    const copy = trimObjValues(bankData);
    setBankData(copy);
    onSave(copy);
  };
  const handleValidateClicked = () => {
    onValidate(uuid);
  };
  const handleReceivingBankChanged = () => {
    const selectedReceivingBank = receivingBanks?.find(({ id }) => id === receivingBankId) || null;
    if (selectedReceivingBank) { onReceivingBankChanged(selectedReceivingBank.id, uuid); }
  };
  const handleToggleShowAccountNumbers = () => {
    if (canShowAccountNumbers) {
      if (editing) return setShowAccountNumbers(!showAccountNumbers);
      if (toggleAccountNumbersVisible) return toggleAccountNumbersVisible(uuid);
    }
    return null;
  };
  const [newDCAFLink, setNewDCAFLink] = useState(DCAF);
  const [canSetDCAF, setCanSetDCAF] = useState(false);
  const handleCanSetDCAFLinkClicked = () => {
    setCanSetDCAF(true);
  };
  const handleSaveDCAFLink = () => {
    if (canSetDCAF) {
      onDCAFLinkChanged(uuid, newDCAFLink);
      setCanSetDCAF(false);
    }
  };

  const ibanDisplay = (() => {
    if (editing || (showAccountNumbers && iban)) return iban;
    return `xxxxx${accountEnding}`;
  })();
  const accountNumberDisplay = (() => {
    if (editing || (showAccountNumbers && accountNumber)) return accountNumber;
    return `xxxxx${accountEnding}`;
  })();
  const accountNumberLoadingDisplay = loading ? <Spinner animation='grow' size='sm' /> : null;
  const getValidationsForProp = (propName: keyof IBankDatumTrimmed) => validations?.find(({ property }) => property === propName);

  return <Form className='bankInfoForm' noValidate onSubmit={(e) => e.preventDefault()}>
    <hr />
    {!isPreview
      && <Row>
        <Col xs='12' sm='auto'>
          <Form.Check
            id={`set-preferred-switch-${uuid}`}
            disabled={bankData.preferred || editDisabled}
            label={labels.usePreferred}
            onChange={changePreferred}
            checked={bankData.preferred}
          />
        </Col>
        {status && <Col xs='12' sm='auto'><em>{labels.thisAccountStatus} <Badge bg={statusVariant}>{status}</Badge></em></Col>}
        {isNewAccount && <Col xs='12' sm='auto'><em>{labels.thisAccountStatus} <Badge bg='info'>{labels.notSaved}</Badge></em></Col>}

      </Row>}
    <Row>
      <h5>{labels.bankAccountInfo}</h5>
      <Choice
        name='accountLocation'
        id={`${uuid}-accountEntityType`}
        label={datumLabels.bankLocation}
        value={bankLocation}
        choices={[
          { label: BankLocation.Domestic, value: BankLocation.Domestic },
          { label: BankLocation.International, value: BankLocation.International },
        ]}
        disabled={!editing || !isNewAccount || editDisabled}
        update={changeAccountLocation}
        colSize={{ xs: 12, xl: 6 }}
      />
      <Select
        label={datumLabels.bankCountry}
        value={bankCountry}
        disabled={!editing || !isNewAccount || editDisabled}
        update={changeBankCountry}
        colSize={{ xs: 12, xl: 6 }}
        validation={getValidationsForProp('bankCountry')}
        options={Object.keys(countryObject)
          .filter((key) => (isDomestic ? key === 'US' : key !== 'US'))
          .reduce((obj, key) => ({ ...obj, [key]: countryObject[key] }), {})
        }
      />
      <Field
        value={bankName}
        label={datumLabels.bankName}
        disabled={!editing}
        update={changeBankName}
        colSize={{ xs: 12, xl: 4 }}
        validation={getValidationsForProp('bankName')}
      />
      {useIBAN && !isDomestic && <Field
        value={ibanDisplay}
        label={datumLabels.iban}
        disabled={!editing || loading || !isNewAccount || editDisabled}
        update={changeIBAN}
        colSize={{ xs: 12, xl: 4 }}
        type={showAccountNumbers ? 'text' : 'password'}
        validation={getValidationsForProp('iban')}
      >
        {canShowAccountNumbers && [<Button key='showAccountNumbers' onClick={handleToggleShowAccountNumbers}>
          {showAccountNumbers ? (accountNumberLoadingDisplay || <VisibilityOff />) : <Visibility />}
        </Button>]}
      </Field>}
      {(!useIBAN || isDomestic) && <Field
        value={accountNumberDisplay}
        label={datumLabels.accountNumber}
        disabled={!editing || loading || !isNewAccount || editDisabled}
        update={changeAccountNumber}
        colSize={{ xs: 12, xl: 4 }}
        type={showAccountNumbers ? 'text' : 'password'}
        validation={getValidationsForProp('accountNumber')}
      >
        {canShowAccountNumbers && [<Button key='showAccountNumbers' onClick={handleToggleShowAccountNumbers}>
          {showAccountNumbers ? (accountNumberLoadingDisplay || <VisibilityOff />) : <Visibility />}
        </Button>]}
      </Field>}
      {isDomestic && <Field
        value={routingNumber}
        label={datumLabels.routingNumber}
        disabled={!editing || !isNewAccount || editDisabled}
        update={changeRoutingNumber}
        colSize={{ xs: 12, xl: 4 }}
        validation={getValidationsForProp('routingNumber')}
      />}
      {!isDomestic && <Field
        value={swift}
        label={datumLabels.swift}
        disabled={!editing || !isNewAccount || editDisabled}
        update={changeSWIFT}
        colSize={{ xs: 12, xl: 4 }}
        validation={getValidationsForProp('swift')}
      />}
      <Field
        value={extra}
        label={datumLabels.extra}
        disabled={!editing || editDisabled}
        update={changeExtra}
        col={12}
        as='textarea'
        rows={5}
      />
    </Row>
    <Row>
      {editing && !isDomestic
        && <Form.Group as={Col}>
          <Form.Check
            label={datumLabels.useIBAN}
            id={`useIBAN-${uuid}`}
            name={`useIBAN-${uuid}`}
            checked={useIBAN}
            disabled={!editing || !isNewAccount || editDisabled}
            onChange={({ target: { checked } }) => changeUseIBAN(checked)}
            type='switch'
          />
        </Form.Group>}
    </Row>
    <Row>
      <h5>{labels.accountHolderInfo}</h5>
      <Choice
        colSize={{ xs: 12, xl: 6 }}
        name='accountEntityType'
        id={`${uuid}-accountEntityType`}
        label={datumLabels.accountType}
        value={accountType}
        disabled={!editing || editDisabled}
        choices={[
          { label: BankAccountType.Personal, value: BankAccountType.Personal },
          { label: BankAccountType.Business, value: BankAccountType.Business },
        ]}
        update={changeAccountType}
      />
      <Select
        label={labels.addressCountry}
        value={address.country}
        disabled={!editing || editDisabled}
        update={(value) => changeAccountAddress({ ...address, country: value })}
        colSize={{ xs: 12, xl: 6 }}
        validation={getValidationsForProp('address')?.children.find(({ property }) => property === 'country')}
        options={Object.keys(countryObject)
          .reduce((obj, key) => ({ ...obj, [key]: countryObject[key] }), {})
        }
      />
      <Field
        label={datumLabels.name}
        colSize={{ xs: isPersonal ? 6 : 12, xl: isPersonal ? 3 : 6 }}
        value={name}
        disabled={!editing || editDisabled || !canChangeName}
        update={changeName}
        validation={getValidationsForProp('name')}
      />
      {isPersonal && <Field
        label={datumLabels.lastName}
        colSize={{ xs: isPersonal ? 6 : 12, xl: isPersonal ? 3 : 6 }}
        value={lastName}
        disabled={!editing || editDisabled || !canChangeName}
        update={changeLastName}
        validation={getValidationsForProp('lastName')}
      />}
      <Address
        address={address}
        disabled={!editing || editDisabled}
        update={changeAccountAddress}
        validations={getValidationsForProp('address')?.children}
      />
      <Col className='d-flex justify-content-end mt-5'>
        <ButtonGroup>
          {!editing && userIsAdmin
            && onEdit
            && <Button
              variant='primary'
              onClick={handleEditClicked}
              disabled={showAccountNumberDisabled || editDisabled}
            >
              {labels.edit}
            </Button>}
          {!editing
            && onDelete
            && <Button
              variant='danger'
              onClick={handleDeleteClicked}
              disabled={showAccountNumberDisabled || editDisabled}
            >
              {labels.delete}
            </Button>}
        </ButtonGroup>

        {editing
          && <ButtonGroup>
            {onCancel
              && <Button
                disabled={editDisabled}
                variant='secondary'
                onClick={onCancel}
              >
                {labels.cancel}
              </Button>}
            {onSave
              && <Button
                disabled={editDisabled}
                variant='success'
                onClick={handleSaveClicked}
              >
                {labels.save}
              </Button>}
          </ButtonGroup>}
      </Col>
    </Row>
    {(userIsAdmin && !editing) && <><hr /><Row>
      <h5>For internal administrative use only</h5>
      <em>{uuid}</em>
      <Row>
        <Col xs={12} md='2' className='d-flex align-items-center pb-2 pb-md-0'>
          <Button
            disabled={isValidated || !onValidate || showAccountNumberDisabled}
            variant='warning'
            onClick={handleValidateClicked}
          >
            {labels.validate}
          </Button>
        </Col>
        <Form.Label column={true} xs='3' md='2'>{datumLabels.bankName}</Form.Label>
        <Col xs='6' md='6'>
          <Form.Select
            value={receivingBankId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeReceivingBank(e.target.value)}
          >
            <option value={null}>{labels.selectFromTheList}</option>
            {receivingBanks?.map(({ id, bankName }) => <option key={id} value={id}>{bankName}</option>)}
          </Form.Select>
        </Col>
        <Col xs='3' md='2'>
          <Button
            className='w-100'
            disabled={!onReceivingBankChanged || receivingBankId === props.bankData?.receivingBankId || showAccountNumberDisabled}
            onClick={handleReceivingBankChanged}
            variant='warning'
          >{labels.save}</Button>
        </Col>
      </Row>
      <Row>
        <Col xs={6} md={'2'} className='d-flex align-items-center'>
          <Button
            className='w-100'
            disabled={DCAF === '' || showAccountNumberDisabled}
            variant='secondary'
            onClick={() => window.open(DCAF)}
          >
            {labels.openDCAF}
          </Button>
        </Col>
        <Col xs={6} md='2'>
          <Button
            className='w-100'
            disabled={canSetDCAF || showAccountNumberDisabled}
            onClick={handleCanSetDCAFLinkClicked}
            variant='warning'
          >
            {labels.setDCAF}
          </Button>
        </Col>
        <Col xs={10} md={6} className='pt-2 pt-md-0'>
          <Form.Control
            value={newDCAFLink}
            disabled={showAccountNumberDisabled}
            readOnly={!canSetDCAF}
            onChange={(e) => setNewDCAFLink(e.target.value)}
          />
        </Col>
        <Col xs={2} md={'2'} className='pt-2 pt-md-0'>
          <Button
            className='w-100'
            disabled={!canSetDCAF || showAccountNumberDisabled}
            onClick={handleSaveDCAFLink}
          >{labels.save}</Button>
        </Col>
      </Row>
    </Row></>}
  </Form>;
}

export const BankInfoComponent = React.memo(BankInfoItem);
