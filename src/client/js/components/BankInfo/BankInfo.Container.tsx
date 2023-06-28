import { API } from '@api';
import React, { useState, useEffect } from 'react';
import {
  Col, Button, Tabs, Tab, Spinner, Row,
} from 'react-bootstrap';
import { BankInfoComponent } from '@client/js/components/BankInfo/BankInfo.Item';
import {
  getUserInfo, handleMessageAndError, useAccount, useBankAccounts, useRequest,
} from '@admin/admin.store';
import { BankInfo as BankLabels } from '@labels';
import {
  BankAccountType,
  DefaultBankDatum, IBankDatumTrimmed, IReceivingBank, validateBankDatum,
} from '@interfaces';
import { useDispatch } from 'react-redux';
import Add from '@mui/icons-material/Add';
import CheckBoxRounded from '@mui/icons-material/CheckBoxRounded';
import ConfirmationDialog from '../ConfirmationDialog';
import useFullBankAccountNumber from './helpers/useFullBankAccountNumber';

export default function container(props: {
  accountNumber: string,
  requestId?: number,
 }) {
  const dispatch = useDispatch();
  const { userinfo } = getUserInfo();
  const { accountNumber, requestId } = props;
  const { account } = useAccount(accountNumber);
  const [editingBankAccount, setEditingBankAccount] = useState('');
  const [accountNumbersVisibleForUUID, setAccountNumbersVisibleForUUID] = useState('');
  const {
    bankAccounts, error, bankAccountsLoading, mutate: mutateBankAccounts,
  } = useBankAccounts(accountNumber, dispatch);
  const { request } = useRequest(requestId);
  const [selectedBankAccount, setSelectBankAccount] = useState(
    bankAccounts
      ?.find(({ uuid }) => uuid === request?.bankAccountUUID)
      ?.uuid,
  );
  const [validationErrors, setValidationErrors] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = bankAccountsLoading || deleting || saving;
  useEffect(() => {
    if (accountNumber && bankAccounts?.length && !editingBankAccount) {
      if (!bankAccounts?.find(({ uuid }) => uuid === selectedBankAccount)) {
        setSelectBankAccount(bankAccounts?.[0]?.uuid);
      }
    }
  }, [accountNumber, bankAccounts]);

  const changeSelectedBankAccount = (key: string) => setSelectBankAccount(key);

  const addBankAccount = () => {
    mutateBankAccounts({
      bankAccounts: [...bankAccounts, {
        ...DefaultBankDatum,
        accountType: account?.businessEntity ? BankAccountType.Business : BankAccountType.Personal,
        name: account?.businessEntity ? account?.businessEntity : account?.name,
        lastName: account?.businessEntity ? '' : account?.lastname,
      }],
    }, false);
    setEditingBankAccount(DefaultBankDatum.uuid);
    setSelectBankAccount(DefaultBankDatum.uuid);
  };

  const onEditBankAccount = (editUUID: string) => {
    setEditingBankAccount(editUUID);
    setSelectBankAccount(editUUID);
  };

  const onSaveNewBank = async (newBankData: IBankDatumTrimmed) => {
    setSaving(true);
    setValidationErrors([]);
    const newAccount = DefaultBankDatum.uuid === newBankData.uuid;
    if (newAccount) {
      const clientValidations = await validateBankDatum(newBankData);
      const valid = !clientValidations?.length;
      if (valid) {
        const savedAccounts = bankAccounts.filter(({ uuid }) => uuid !== newBankData.uuid);
        mutateBankAccounts({ bankAccounts: [...savedAccounts, newBankData] }, false);
      } else {
        setValidationErrors(clientValidations);
        setSaving(false);
        return;
      }
    } else {
      mutateBankAccounts(({ bankAccounts: b }) => ({ bankAccounts: b.map((a) => (a.uuid === newBankData.uuid ? newBankData : a)) }), false);
    }
    const { bankData, validations, error: err } = await API.BankData.Create.post({ accountNumber, bankAccount: newBankData });
    if (err) handleMessageAndError({ error: err }, dispatch);
    if (validations) setValidationErrors(validations);
    if (bankData) {
      setEditingBankAccount('');
      mutateBankAccounts();
      setSelectBankAccount(bankData.uuid);
    }
    setSaving(false);
  };
  const onReceivingBankChanged = async (receivingBankId: IReceivingBank['id'], uuid: IBankDatumTrimmed['uuid']) => {
    const { error: setReceivingBankError } = await API.BankData.SetReceivingBank.post({ receivingBankId, uuid });
    if (setReceivingBankError) handleMessageAndError({ error: setReceivingBankError }, dispatch);
    mutateBankAccounts();
  };
  const onValidateBankData = async (uuid: string) => {
    if (uuid) {
      const { error: validateError } = await API.BankData.Validate.post({ uuid });
      if (validateError) handleMessageAndError({ error: validateError }, dispatch);
      mutateBankAccounts();
    }
  };
  const onDCAFLinkSaved = async (uuid: string, DCAF: string) => {
    if (uuid) {
      const { error: saveDCAFError } = await API.BankData.SetDCAFLink.post({ uuid, DCAF });
      if (saveDCAFError) handleMessageAndError({ error: saveDCAFError }, dispatch);
      mutateBankAccounts();
    }
  };

  const onCancelNewBank = () => {
    mutateBankAccounts();
    setEditingBankAccount('');
  };

  const [uuidToDelete, setUUIDToDelete] = useState('');
  const [accountEndingToDelete, setAccountEndingToDelete] = useState('');
  const hideDeletePrompt = () => setUUIDToDelete('');
  const showDeletePrompt = (uuid: string) => {
    const { accountEnding } = bankAccounts.find(({ uuid: uid }) => uid === uuid);
    if (accountEnding) { setAccountEndingToDelete(accountEnding); }
    setUUIDToDelete(uuid);
  };
  const onDeleteConfirm = async () => {
    setDeleting(true);
    if (uuidToDelete !== DefaultBankDatum.uuid) {
      await API.BankData.Delete.post({ uuid: uuidToDelete });
    }
    mutateBankAccounts();
    setSelectBankAccount(bankAccounts?.[0]?.uuid);
    setUUIDToDelete('');
    setDeleting(false);
  };

  const [loadingFullAccountNumber, setLoadingFullAccountNumber] = useState(false);

  const onSetPreferredAccount = async (uuid: IBankDatumTrimmed['uuid']) => {
    mutateBankAccounts(async (cacheData: { bankAccounts: IBankDatumTrimmed[] } = { bankAccounts: [] }) => {
      setLoadingFullAccountNumber(true);
      const { error: err } = await API.BankData.SetPreferredBankAccount.post({ uuid });
      if (err) handleMessageAndError({ error: err }, dispatch);
      setLoadingFullAccountNumber(false);
      return {
        bankAccounts: cacheData.bankAccounts.map((cacheDatum) => {
          if (uuid === cacheDatum.uuid) return { ...cacheDatum, preferred: true };
          return { ...cacheDatum, preferred: false };
        }),
      };
    }, false);
  };

  useFullBankAccountNumber(accountNumber, accountNumbersVisibleForUUID, dispatch);

  const toggleAccountNumbersVisible = (uuid: string) => {
    setAccountNumbersVisibleForUUID(accountNumbersVisibleForUUID ? '' : uuid);
  };

  return <>
  <ConfirmationDialog
    title={BankLabels.deletePromptTitle}
    show={!!uuidToDelete}
    onCancel={hideDeletePrompt}
    cancelLabel={BankLabels.cancel}
    onAccept={onDeleteConfirm}
    acceptLabel={BankLabels.delete}
    busy={deleting}
  >{BankLabels.deletePromptText(accountEndingToDelete)}</ConfirmationDialog>
  <Row className='justify-content-between'>
    <Col xs='auto'><span className='d-flex align-content-center fs-3'>{BankLabels.header}{bankAccountsLoading && !error && <Spinner className='ml-2' animation='grow' size='sm'/>}</span></Col>
    {(!editingBankAccount)
    && <Col xs={4} className='d-flex justify-content-end'>
      <Button
        onClick={addBankAccount}
        disabled={busy}
      ><Add /> {BankLabels.addNew}</Button>
    </Col>}
  </Row>
  <hr/>
  {!bankAccounts?.length && !error && <em>{BankLabels.noSavedAccount}</em>}
  {bankAccounts && <Tabs
    className='mb-2'
    variant='pills'
    id='bankAccountTabs'
    activeKey={selectedBankAccount}
    onSelect={changeSelectedBankAccount}
  >
    {bankAccounts
      .sort((a, b) => {
        if (request?.bankAccountUUID === a.uuid) return -1;
        return 0;
      })
      .map((bankAccount) => {
        const { uuid, accountEnding, preferred } = bankAccount;
        const editingThisAccount = uuid === editingBankAccount;
        return <Tab eventKey={uuid} title={
        <span className={
          selectedBankAccount === uuid ? 'text-primary' : ''
          }>
            {request?.bankAccountUUID === uuid ? <span>#{request.id}: </span> : null}
            {preferred ? <span>{BankLabels.preferred}: </span> : null}
            {accountEnding || BankLabels.notSaved}
        </span>} key={uuid}>
          <BankInfoComponent
          editing={editingThisAccount}
          bankData={bankAccount}
          onSave={editingThisAccount && onSaveNewBank}
          onReceivingBankChanged={onReceivingBankChanged}
          onSetPreferredAccount={onSetPreferredAccount}
          onValidate={onValidateBankData}
          onDCAFLinkSaved={onDCAFLinkSaved}
          userinfo={userinfo}
          onCancel={editingThisAccount && onCancelNewBank}
          onDelete={!editingThisAccount && showDeletePrompt}
          onEdit={onEditBankAccount}
          accountNumbersVisible={uuid === accountNumbersVisibleForUUID}
          toggleAccountNumbersVisible={toggleAccountNumbersVisible}
          validations={editingThisAccount ? validationErrors : []}
          loading={loadingFullAccountNumber}
          saving={saving}
          />
        </Tab>;
      })}
  </Tabs>}
  <hr/>
</>;
}
