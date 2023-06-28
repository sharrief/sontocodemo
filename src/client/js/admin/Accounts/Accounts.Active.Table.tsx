import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  ButtonGroup, Col, Dropdown, Form, InputGroup, Row, Spinner,
} from 'react-bootstrap';
import { RoleId } from '@interfaces';
import NewAccount from '@containers/Admin.Applications.NewAccount';
import {
  getManagers, getUserInfo, handleMessageAndError, useAccounts, useActivityCount, useLatestStatements,
} from '@admin/admin.store';
import Table from '@client/js/components/Table';
import CombinedState from '@client/js/store/state';
import { Documents as DocumentLabels } from '@labels';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { DateTime } from 'luxon';
import { currency } from '@client/js/core/helpers';
import RadioButtonChecked from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Warning from '@mui/icons-material/Warning';
import Refresh from '@mui/icons-material/Refresh';
import { chain } from '@numbers';
import { AccountStatementsComponent } from '@client/js/components/AccountStatements/AccountStatements';
import ResponsiveModal from '@client/js/components/Modal';
import TransactionsComponent from '@client/js/components/Transfers/Transfers';
import AccountsColumns from './Accounts.Active.Columns';
import ActiveAccountsTableFilter from './Accounts.Active.Table.Filter';
import PopulateStatementsDialog from './Accounts.Active.PopulateDialog';
import AccountPopulationProgress from './Accounts.Active.PopulateProgress';

const { Accounts: Labels } = DocumentLabels;

const selector = createSelector([(state: CombinedState) => state.global.theme], (theme) => ({ theme }));

const tableId = 'accountsList';

const ActiveAccountsTab = () => {
  // const dispatch = useDispatch();
  const { theme } = useSelector(selector);
  const dispatch = useDispatch();
  const { userinfo } = getUserInfo();
  const { accounts, refreshAccounts, accountsLoading } = useAccounts();
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [showSelectedAccounts, setShowSelectedAccounts] = useState(false);
  const { operationRequestPendingCounts: counts, refreshActivityCount } = useActivityCount();
  const selectAccount = (id: number) => {
    if (selectedAccountIds.includes(id)) {
      setSelectedAccountIds(selectedAccountIds.filter((i) => i !== id));
    } else {
      setSelectedAccountIds([...selectedAccountIds, id]);
    }
  };

  const { managers, managersLoading } = getManagers();
  const [selectedManagerIds, setSelectedManagerIds] = useState([]);
  useEffect(() => {
    if (managers?.length) {
      setSelectedManagerIds(managers.map((m) => m.id));
    }
  }, [managers]);

  const { statements, refreshLatestStatements, statementsLoading } = useLatestStatements({ userIds: accounts?.map(({ id }) => id), withOperations: true }, dispatch);
  const [unfilteredRows, setUnfilteredRows] = useState([]);
  const busy = accountsLoading || statementsLoading || managersLoading;
  const dataLoaded = !busy;
  const refreshAll = () => {
    refreshAccounts();
    refreshActivityCount();
    refreshLatestStatements();
  };

  const [selectedStatementsAccountNumber, setSelectedStatementsAccountNumber] = useState('');
  const onStatementsClose = () => setSelectedStatementsAccountNumber('');
  const [selectedTransactionsAccountNumber, setSelectedTransactionsAccountNumber] = useState('');
  const onShowTransactions = (accountNumber: string) => setSelectedTransactionsAccountNumber(accountNumber);
  const onTransactionsClose = () => setSelectedTransactionsAccountNumber('');

  useEffect(() => {
    if (dataLoaded) {
      setUnfilteredRows(accounts.map((account) => {
        const statement = statements?.find(({ userId }) => userId === account.id);
        const {
          month, year, endBalance, gainLoss, previousStatement, operations,
        } = statement || {};
        const latestStatementDate = DateTime.fromObject({ month, year }).toFormat('MMM yyyy');
        const statementBalanceOverBy = (previousStatement) && chain(endBalance)
          .subtract(operations?.reduce((t, o) => t + o.amount, 0) || 0)
          .subtract(gainLoss)
          .subtract(previousStatement.endBalance)
          .done();
        const overBalance = statementBalanceOverBy > 0;
        const errorInfo = Math.abs(statementBalanceOverBy) > 0.01 ? <div>
          <span className='text-danger'>
            <Warning/> The statement balance is {currency(statementBalanceOverBy)} {overBalance ? Labels.tooHigh : Labels.tooLow}. Repopulate the statement to fix.
          </span>
          </div> : null;
        const pendingCount = counts?.[account.id];
        const pendingTransfers = pendingCount ? <>
        <Badge bg='info'>{pendingCount}</Badge>&nbsp;
          <Button
            className='p-0 fs-6 text-capitalize fw-normal'
            onClick={() => onShowTransactions(account?.accountNumber)}
            variant='link'
          >
            {Labels.pendingTransfers}
          </Button>
        </> : null;
        return {
          ...account,
          selected: selectedAccountIds.includes(account.id),
          contact: `${account.name} ${account.lastname}`,
          email: `${account.email}`,
          manager: managers.find(({ id }) => id === account.fmId)?.displayName || '[Missing]',
          latestBalance: `${currency(endBalance || 0)} | ${latestStatementDate}`,
          latestBalanceMessages: <div>{pendingTransfers} {errorInfo}</div>,
        };
      }));
    }
  }, [accounts, managers, statements, selectedAccountIds, counts]);

  const [filter, setFilter] = useState('');
  const [filteredAccounts, setFilteredAccounts] = useState(unfilteredRows);

  useEffect(() => {
    const filtered = unfilteredRows
      .filter(({ fmId }) => selectedManagerIds.includes(fmId))
      .filter(({ id }) => (!showSelectedAccounts || !selectedAccountIds.length) || selectedAccountIds.includes(id))
      .filter((account) => !filter || ['contact', 'displayName', 'accountNumber', 'email', 'manager']
        .reduce((match, key) => match || (account[key] as string)?.toLowerCase().search(filter.toLowerCase().replace(/[^a-z0-9\s]/gi, '')) > -1, false));
    if (dataLoaded) {
      setFilteredAccounts(filtered);
    }
  }, [filter, selectedManagerIds, showSelectedAccounts, unfilteredRows]);

  const handleFilterChange = (searchText: string) => {
    setFilter(searchText);
  };

  const handleSelectedManagerIdsChanged = (ids: number[]) => {
    setFilter('');
    setSelectedAccountIds([]);
    setSelectedManagerIds(ids);
  };

  const toggleHideUnselectedAccounts = () => {
    if (!showSelectedAccounts) {
      setFilter('');
    }
    setShowSelectedAccounts(!showSelectedAccounts);
  };
  useEffect(() => {
    if (showSelectedAccounts && !selectedAccountIds.length) setShowSelectedAccounts(false);
  }, [selectedAccountIds]);
  const allSelected = selectedAccountIds.length && selectedAccountIds.length >= filteredAccounts.length;
  const handleSelectAllClicked = () => {
    if (allSelected) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(filteredAccounts.map(({ id }) => id));
    }
  };
  const handlePopulateDialogClosed = (populated: boolean) => {
    if (populated) {
      refreshLatestStatements();
    }
  };
  const handleNewAccountClosed = () => {
    refreshAccounts();
  };

  const cols = AccountsColumns({
    handleMessage: (a) => handleMessageAndError(a, dispatch),
    onTransferDialogClose: () => refreshActivityCount(),
    onChangeEmailClose: () => refreshAccounts(),
    onSelect: selectAccount,
    onPopulateDialogClose: handlePopulateDialogClosed,
    onShowStatements: (accountNumber) => setSelectedStatementsAccountNumber(accountNumber),
    busy,
  });

  const hiddenColumnAccessors = ['email', 'selected', 'displayName', 'latestBalanceMessages'];
  if (![RoleId.admin, RoleId.director, RoleId.seniorTrader].includes(userinfo?.roleId)) hiddenColumnAccessors.push('manager');

  return <>
    <Row>
      <Col xs={true}>
        <InputGroup>
        <Dropdown as={ButtonGroup}>
          {busy
            ? <Button variant='secondary' disabled><Spinner animation='grow' size='sm' /> <span className='d-none d-lg-inline'>{Labels.loading}</span></Button>
            : <PopulateStatementsDialog
                asDropdownItem={false}
                accountIds={selectedAccountIds}
                onClose={handlePopulateDialogClosed}
              />
          }
          <Dropdown.Toggle split variant="primary" id="accounts-table-bulk-dropdown" disabled={busy}/>
          <Dropdown.Menu>
            <NewAccount
              asDropdownItem={true}
              onClose={handleNewAccountClosed}
            />
            <Dropdown.Item
              onClick={handleSelectAllClicked}
            >{allSelected ? <><RadioButtonUnchecked /> {Labels.UnselectAll}</> : <><RadioButtonChecked/> {Labels.SelectAll}</>}</Dropdown.Item>
            <Dropdown.Item
              disabled={!selectedAccountIds.length}
              onClick={toggleHideUnselectedAccounts}
            >
            {showSelectedAccounts ? <><Visibility/> {Labels.ShowAll}</> : <><VisibilityOff/> {Labels.ShowSelected}</>}
          </Dropdown.Item>
          <Dropdown.Item
            disabled={!dataLoaded}
            onClick={refreshAll}
          >
            <Refresh /> {Labels.Refresh}
          </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Form.Control
          value={filter}
          placeholder={`${Labels.SearchBy} ${Labels.AccountNumber}, ${Labels.AccountHolder}, ${Labels.Contact}, ${Labels.manager} or ${Labels.latestBalance}`}
          onChange={(e) => handleFilterChange(e.target.value)}
        />
        <ActiveAccountsTableFilter
          managers={managers}
          selectedManagerIds={selectedManagerIds}
          setSelectedManagerIds={handleSelectedManagerIdsChanged}
        />
        </InputGroup>
      </Col>
    </Row>
    <Row>
      <Col>
        <AccountPopulationProgress />
      </Col>
    </Row>
    <Row>
      <Col className='mt-2'>
        <Table
          id={tableId}
          rowClickHandler={null}
          manualPagination={false}
          initialPageSize={10}
          disableSearch={true}
          hiddenColumnAccessors={hiddenColumnAccessors}
          cardHeaderColumns={['id']}
          cardLabels={true}
          cardLabelSpacing={'close'}
          data={filteredAccounts}
          columns={React.useMemo(() => cols, [cols])}
          itemLabelPlural={Labels.TabTitle}
          loading={!dataLoaded}
          theme={theme}
        />
      </Col>
    </Row>
    <ResponsiveModal
      show={!!selectedStatementsAccountNumber}
      handleClose={onStatementsClose}
      header={null}
      body={<AccountStatementsComponent accountNumber={selectedStatementsAccountNumber} />}
      footer={null}
      wide={true}
    />
    <ResponsiveModal
      show={!!selectedTransactionsAccountNumber}
      handleClose={onTransactionsClose}
      header={null}
      body={<TransactionsComponent accountNumber={selectedTransactionsAccountNumber} />}
      footer={null}
      wide={true}
    />
  </>;
};

export default ActiveAccountsTab;
