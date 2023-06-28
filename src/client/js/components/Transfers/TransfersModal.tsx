import React, { useState } from 'react';
import { TransfersModal as Labels } from '@labels';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { Button } from 'react-bootstrap';
import DropdownItem from 'react-bootstrap/esm/DropdownItem';
import ResponsiveModal from '../Modal';
import Transfers from './Transfers';

const TransfersModal = ({
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
      body={<Transfers accountNumber={accountNumber} />}
      footer={null}
      wide={true}
    />
    {asDropdownItem
      ? <DropdownItem onClick={handleOpen}>
      <SwapHoriz /> {Labels.ViewTransfers}
    </DropdownItem>
      : <Button onClick={handleOpen}>
      <SwapHoriz /> {Labels.Transfers}
    </Button>
  }
  </>;
};

export default TransfersModal;
