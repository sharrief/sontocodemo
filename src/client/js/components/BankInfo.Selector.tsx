import {
  IBankDatumTrimmed, IntraFundTransferUUID, IUser, RequestStatus, RoleId,
} from '@interfaces';
import React from 'react';
import { BankInfoSelector as Labels } from '@labels';
import {
  Form, Col, InputGroup, FormSelectProps,
} from 'react-bootstrap';
import { getUserInfo, useBankAccounts } from '@admin/admin.store';
import { useDispatch } from 'react-redux';

const BankInfoSelector = (props: {
  accountNumber: IUser['accountNumber'];
  bankAccountUUID: IBankDatumTrimmed['uuid'];
  setBankAccountUUID?: (uuid: IBankDatumTrimmed['uuid']) => void;
  hideLabel?: boolean;
} & FormSelectProps) => {
  const dispatch = useDispatch();
  const {
    accountNumber, bankAccountUUID, setBankAccountUUID, hideLabel, ...controlProps
  } = props;
  const { userinfo } = getUserInfo();
  const { bankAccounts, bankAccountsLoading } = useBankAccounts(accountNumber, dispatch);
  const busy = bankAccountsLoading;
  return <Form.Group as={Col}>
  {!hideLabel && <Form.Label htmlFor='status'>{Labels.BankAccount}</Form.Label>}
  <InputGroup>
    <Form.Select
      {...controlProps}
      name='bankAccount'
      disabled={busy || !setBankAccountUUID || !bankAccounts.length}
      value={bankAccountUUID}
      onChange={({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => setBankAccountUUID && setBankAccountUUID(value as RequestStatus)}
    >
      {!bankAccounts.length
        ? <option value=''>{Labels.NoBankAccountsAvailable}</option>
        : <option value=''>{Labels.SetClientBankAccount}</option>
      }
      {bankAccounts.map((b, index) => <option key={b.uuid || index} value={b.uuid}>{`${b.accountName ?? `${b.name}${b.lastName ? ` ${b.lastName}` : ''}`} ...${b.accountEnding} ${b.bankName} (${b.preferred ? Labels.Default : ''})`}</option>)}
      {[RoleId.admin, RoleId.director].includes(userinfo?.roleId) && <option value={IntraFundTransferUUID} color='warning'>{Labels.IntraFundTransfer}</option>}
    </Form.Select>
  </InputGroup>
  </Form.Group>;
};

export default React.memo(BankInfoSelector);
