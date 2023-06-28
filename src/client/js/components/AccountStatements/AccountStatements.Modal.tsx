import React, { useState } from 'react';
import { AccountStatementsModal as Labels } from '@labels';
import StatementsIcon from '@mui/icons-material/Receipt';
import { Button } from 'react-bootstrap';
import DropdownItem from 'react-bootstrap/esm/DropdownItem';
import ResponsiveModal from '../Modal';
import { AccountStatementsComponent } from './AccountStatements';

const AccountStatementsModal = ({
  accountNumber,
  asDropdownItem,
}: {
    accountNumber: string;
    asDropdownItem: boolean;
  }) => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleOpen = () => setShow(true);

  return <>
    <ResponsiveModal
      show={show}
      handleClose={handleClose}
      header={null}
      body={<AccountStatementsComponent accountNumber={accountNumber} />}
      footer={null}
      wide={true}
    />
    {asDropdownItem
      ? <DropdownItem onClick={handleOpen}>
      <StatementsIcon /> {Labels.ViewStatements}
    </DropdownItem>
      : <Button onClick={handleOpen}>
      <StatementsIcon /> {Labels.Statements}
    </Button>
  }
  </>;
};

export default AccountStatementsModal;
