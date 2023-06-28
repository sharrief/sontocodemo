import React, { useState } from 'react';
import BankInfo from '@components/BankInfo/BankInfo.Container';
import ResponsiveModal from '@components/Modal';
import { Button } from 'react-bootstrap';
import { useRequest, useUser } from '@admin/admin.store';
import { PostRequestDialog as labels } from '@labels';
import AccountBalance from '@mui/icons-material/AccountBalance';
import DropdownItem from 'react-bootstrap/esm/DropdownItem';

function bankInfoModal(props: { requestId?: number; accountNumber?: string; asDropdownItem?: boolean }) {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleOpen = () => setShow(true);
  let accountNumber = '';
  const { asDropdownItem: asMenuItem } = props;
  if (props.accountNumber) {
    accountNumber = props?.accountNumber;
  } else if (props.requestId) {
    const { request } = useRequest(props.requestId);
    const { account } = useUser(request?.userId);
    accountNumber = account?.accountNumber;
  } else {
    return null;
  }
  return <>
  <ResponsiveModal
    wide={true}
    show={show}
    handleClose={handleClose}
    header={''}
    body={
      <BankInfo accountNumber={accountNumber} requestId={props.requestId} />
    }
  />
  {asMenuItem
    ? <DropdownItem onClick={handleOpen}>
      <AccountBalance /> {labels.viewBankInfo}
    </DropdownItem>
    : <Button onClick={handleOpen}>
      <AccountBalance /> {labels.bankInfo}
    </Button>
  }
  </>;
}

export const BankInfoModal = React.memo(bankInfoModal);
