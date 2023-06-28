import React, { useState } from 'react';
import { AdminTab } from '@store/state';
import { PostRequestDialog as labels, Documents as DocumentLabels, transactionLabels } from '@labels';
import {
  ButtonGroup, Dropdown, DropdownButton,
} from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import RemoveCircle from '@mui/icons-material/RemoveCircle';
import AddCircle from '@mui/icons-material/AddCircle';
import {
  useAccount,
} from '@admin/admin.store';
import AccountStatementsModal from '@components/AccountStatements/AccountStatements.Modal';
import TransfersModal from '@components/Transfers/TransfersModal';
import { BankInfoModal } from '@components/BankInfo/BankInfo.Modal';
import PopulateStatementsDialog from '@client/js/admin/Accounts/Accounts.Active.PopulateDialog';
import { endpoints } from '@api';

import EditAccount from '@mui/icons-material/ManageAccounts';
import DropdownItem from 'react-bootstrap/esm/DropdownItem';
import DepositDialog from '@components/Transfers/DepositDialog';
import WithdrawDialog from '@components/Transfers/WithdrawDialog';
import PasswordResetDialog from '@components/PasswordResetDialog';
import useSiteMetadata from '@client/js/core/useSiteMetadata';

export function AccountActions(props: {
  accountNumber: string;
  disabled?: boolean;
  requestId?: number;
  hideLabel?: boolean;
  onPopulationComplete?: (populationComplete: boolean) => void;
}) {
  const { requestsDisabled } = useSiteMetadata();
  const {
    accountNumber, disabled, requestId, hideLabel, onPopulationComplete,
  } = props;
  const { account } = useAccount(accountNumber);

  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const openDepositDialog = () => setShowDepositDialog(true);
  const closeDepositDialog = () => setShowDepositDialog(false);

  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const openWithDrawDialog = () => setShowWithdrawDialog(true);
  const closeWithdrawDialog = () => setShowWithdrawDialog(false);

  return (
    <>
    <DepositDialog
      show={showDepositDialog}
      accountNumber={accountNumber}
      onClose={closeDepositDialog}
    />
    <WithdrawDialog
      show={showWithdrawDialog}
      accountNumber={accountNumber}
      onClose={closeWithdrawDialog}
    />
    <DropdownButton
      as={ButtonGroup}
      title={hideLabel ? null : labels.accountActions}
      disabled={disabled}
    >
      <DropdownItem onClick={openDepositDialog}
        disabled={requestsDisabled}
      >
        <AddCircle className='me-2' />{transactionLabels.StartDeposit}
      </DropdownItem>
      <DropdownItem onClick={openWithDrawDialog}
        disabled={requestsDisabled}
      >
        <RemoveCircle className='me-2' />{transactionLabels.StartWithdrawal}
      </DropdownItem>
      <PopulateStatementsDialog
        asDropdownItem={true}
        accountIds={[account?.id]}
        onClose={onPopulationComplete}
      />
      <AccountStatementsModal
        accountNumber={account?.accountNumber}
        asDropdownItem={true}
      />
      <TransfersModal
        accountNumber={account?.accountNumber}
        asDropdownItem={true}
      />
      <BankInfoModal
        requestId={requestId}
        accountNumber={account?.accountNumber}
        asDropdownItem={true}
      />
      <Dropdown.Item
        as={NavLink}
        to={`${endpoints.administration}/${AdminTab.Accounts}/${account?.accountNumber}`}
      ><EditAccount /> {DocumentLabels.Accounts.EditAccount}</Dropdown.Item>
      <PasswordResetDialog
        email={account?.email}
        asDropdownItem={true}
      />
    </DropdownButton>

    </>
  );
}
