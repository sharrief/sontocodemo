/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import Badge from 'react-bootstrap/Badge';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  Routes,
  Route,
  useParams,
} from 'react-router-dom';
import AccountSelectorComponent from '@components/AccountSelector';
import AccountStatements from '@client/js/components/AccountStatements/AccountStatements';
import NavigationBar from '@client/js/components/NavigationBar';
import Transactions from '@client/js/components/Transfers/Transfers';
import DashboardAlerts from '@containers/Dashboard.Alerts';
import BankInfo from '@components/BankInfo/BankInfo.Container';
import { dashboardLabels as labels } from '@client/js/labels';
import CombinedState from '@store/state';
import { Information } from '@components/Information';
import TransferIcon from '@mui/icons-material/SwapHorizontalCircle';
import BankAccountsIcon from '@mui/icons-material/AccountBalance';
import StatementsIcon from '@mui/icons-material/Receipt';
import DocumentIcon from '@mui/icons-material/Description';
import { DateTime, Duration } from 'luxon';
import BottomNav from '@components/BottomNav';
import { createSelector } from 'reselect';
import {
  getUserInfo, useAccount, useAccounts, useActivityCount,
} from '@admin/admin.store';
import { endpoints } from '@api';
import Brand from '@brand/brandLabels';

export const DashboardTabs = {
  statements: 'statements',
  transfers: 'transfers',
  information: 'information',
  bankAccounts: 'bankAccounts',
};

const selector = createSelector([
  (state: CombinedState) => state.data.loading.userinfo,
  (state: CombinedState) => state.data.currentAccount,
], (loadingUserInfo, currentAccount) => ({
  loadingUserInfo, currentAccount,
}));

export const Dashboard = () => {
  const {
    loadingUserInfo,
  } = useSelector(selector);
  const location = useLocation();
  const { userinfo } = getUserInfo();
  const [host, path, accountNumber, activeTab, dialog] = location.pathname.split('/');
  const { accounts, accountsLoading } = useAccounts();
  const { account: currentAccount } = useAccount(accountNumber);
  const { operationRequestPendingCounts: counts } = useActivityCount();
  const navigate = useNavigate();
  const [msgTime, setMsgTime] = useState(DateTime.now().toMillis());
  const [welcomeQuoteRnd, setWelcomeQuoteRnd] = useState(Math.floor(Math.random() * labels.WelcomeQuotes.length));
  const [welcomeMsgRnd, setWelcomeMsgRnd] = useState(Math.floor(Math.random() * labels.WelcomeMessages.length));

  useEffect(() => {
    if (`/${path}` === endpoints.dashboard) {
      if (!accountNumber) {
        if (currentAccount?.id) {
          navigate(`${currentAccount.accountNumber}`);
        } else if (accounts.length > 0 && accounts[0]?.accountNumber !== '') {
          navigate(`${accounts[0].accountNumber}`);
        }
      } else if (!accountsLoading) {
        const validAccount = accounts?.find(({ accountNumber: num }) => accountNumber === num);
        if (!validAccount) {
          navigate(`${accounts[0].accountNumber}`);
        } else if (!activeTab || !Object.values(DashboardTabs).includes(activeTab)) {
          navigate(`${accountNumber}/${DashboardTabs.statements}`);
        }
      }
    }
    if (Duration.fromMillis(DateTime.now().toMillis() - msgTime).as('minutes') > 1) {
      setMsgTime(DateTime.now().toMillis());
      setWelcomeQuoteRnd(Math.floor(Math.random() * labels.WelcomeQuotes.length));
      setWelcomeMsgRnd(Math.floor(Math.random() * labels.WelcomeMessages.length));
    }
  });
  // Header
  let header = <span></span>;
  if (!userinfo) {
    header = (
      <div>
        <Spinner size='sm' animation='grow' />
        <Spinner size='sm' animation='grow' />
        <Spinner size='sm' animation='grow' />
      </div>
    );
  } else if (!userinfo.displayName) {
    header = <span>{labels.WelcomeMessages[welcomeMsgRnd]}</span>;
  } else {
    header = <span>{`${labels.WelcomeMessages[welcomeMsgRnd]}, ${(userinfo.name ?? userinfo.username)?.split(' ')?.[0]}`}</span>;
  }

  // Welcome message
  let welcomeMessage = (<p></p>);
  if (!loadingUserInfo) {
    welcomeMessage = (
      <p className='fs-6'>
        <em>
          {labels.WelcomeQuotes[welcomeQuoteRnd || 0].msg}
        </em>&nbsp;
        <strong>
          {labels.WelcomeQuotes[welcomeQuoteRnd || 0].author}
        </strong>
      </p>
    );
  }

  let badge = null;
  const pending = counts?.[currentAccount.id];
  if (pending) { badge = <Badge bg='info'>{pending}</Badge>; }
  const tabClass = (t: string) => (t === activeTab ? '' : '');

  const navItems = [
    {
      icon: <StatementsIcon />,
      label: <span>{labels.TabTitleStatements}</span>,
      key: DashboardTabs.statements,
      to: `${endpoints.dashboard}/${accountNumber}/${DashboardTabs.statements}`,
      classname: tabClass(DashboardTabs.statements),
    },
    {
      icon: <TransferIcon />,
      label: <span>{`${labels.TabTitleActivity}`} {badge}</span>,
      key: DashboardTabs.transfers,
      to: `${endpoints.dashboard}/${accountNumber}/${DashboardTabs.transfers}`,
      classname: tabClass(DashboardTabs.transfers),
    },
    {
      icon: <BankAccountsIcon />,
      label: <span>{labels.TabTitleBankAccounts}</span>,
      key: DashboardTabs.bankAccounts,
      to: `${endpoints.dashboard}/${accountNumber}/${DashboardTabs.bankAccounts}`,
      classname: tabClass(DashboardTabs.bankAccounts),
    },
    {
      icon: <DocumentIcon />,
      label: <span>{labels.TabTitleInformation}</span>,
      key: DashboardTabs.information,
      to: `${endpoints.dashboard}/${accountNumber}/${DashboardTabs.information}`,
      classname: tabClass(DashboardTabs.information),
    },
  ];

  return (
    <HelmetProvider>
      <Helmet>
        <title>{Brand.MidName} - {labels.MyAccounts}</title>
      </Helmet>
      <div className='dashboard'>
        <NavigationBar hideLogoWhenLarge={false} />
        <Row className='m-0 align-items-stretch'>
          <Col className='my-5 my-md-0 mt-md-5 py-4 py-md-0 pb-md-0 mb-md-0' style={{ height: '100vh', overflow: 'scroll' }}>
            <div className="container px-0 px-md-3" >
              <span className="mt-2 h5">
                {header}
              </span>
              <Row>
                <Col xs={12} md='auto' className='order-1 order-md-0 my-2'>
                  <AccountSelectorComponent
                    currentAccount={currentAccount}
                    tab={activeTab}
                  />
                </Col>
              </Row>
              <Row>
                <Col md='12'>
                  <Nav className='d-none d-md-flex mb-3' variant='tabs' defaultActiveKey={activeTab} activeKey={activeTab}>
                    {navItems.map(({
                      icon, label, key, to,
                    }) => <Nav.Item key={key}>
                      <Nav.Link as={RouterLink} to={to} eventKey={key}>
                        {label}
                      </Nav.Link>
                    </Nav.Item>)}
                  </Nav>
                  <Tab.Container activeKey={'activeTab'} id="tabs" mountOnEnter={true}>
                    <Tab.Content>
                      <Tab.Pane eventKey='activeTab'>
                        <Routes>
                          <Route path={`${accountNumber}/*`}
                            element={
                              <Routes>
                                <Route
                                  path={`${DashboardTabs.statements}/*`}
                                  element={<AccountStatements accountNumber={accountNumber} />}
                                />
                                <Route
                                  path={`${DashboardTabs.transfers}/:dialog`}
                                  element={<Transactions
                                    path={DashboardTabs.transfers}
                                    accountNumber={accountNumber}
                                  />}
                                />
                                <Route
                                  path={`${DashboardTabs.transfers}`}
                                  element={<Transactions
                                    path={DashboardTabs.transfers}
                                    accountNumber={accountNumber}
                                  />}
                                />
                                <Route
                                  path={`${DashboardTabs.information}/*`}
                                  element={<Information accountNumber={accountNumber} />}
                                />
                                <Route
                                  path={`${DashboardTabs.bankAccounts}/*`}
                                  element={<BankInfo accountNumber={accountNumber} />}
                                />
                              </Routes>
                            } />
                        </Routes>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </Col>
              </Row>
              <Row><Col>
                {welcomeMessage}
              </Col></Row>
            </div>
          </Col>
        </Row>
        <DashboardAlerts />
        <BottomNav
          items={navItems}
          activeKey={activeTab}
        />
      </div>
    </HelmetProvider>
  );
};

Dashboard.displayName = 'Dashboard';

export default Dashboard;
