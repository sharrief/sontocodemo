import React, {
  useEffect, useState,
} from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useSelector, useDispatch } from 'react-redux';
import Tab from 'react-bootstrap/Tab';
import Alerts from '@admin/Admin.Alerts';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NavigationBar from '@client/js/components/NavigationBar';
import BottomNav from '@components/BottomNav';
import SideNav from '@components/SideNav';
import {
  CombinedState, AdminTab,
} from '@store/state';
import { AdminTransfersRouter } from '@admin/Transfers';
import Analytics from '@admin/Portfolio/Portfolio.Analytics';
import { Admin as labels } from '@client/js/labels';
import { createSelector } from 'reselect';
import TransferIcon from '@mui/icons-material/SwapHorizontalCircle';
import AnalyticsIcon from '@mui/icons-material/TrendingUp';
import AccountsIcon from '@mui/icons-material/RecentActors';
import TradesIcon from '@mui/icons-material/WaterfallChart';
import ApplicationsIcon from '@mui/icons-material/ContactPage';
import DocumentIcon from '@mui/icons-material/Description';
import { RoleName } from '@interfaces';
import { createMenuItem } from '@helpers';
import { endpoints } from '@api';
import {
  Navigate, Route, Routes, useLocation, useNavigate,
} from 'react-router-dom';
import { clickedTabThunk, getUserInfo } from './admin.store';
import TradesContainer from './Trades/TradesContainer';
import AccountsRouter from './Accounts/Accounts';
import OpenAccountDialog from '../components/AccountsList/AccountsList.OpenAccountDialog';
import Applications from './Accounts/Applications';

const selectAdminData = createSelector([
  (state: CombinedState) => state.global.theme,
], (theme) => ({
  theme,
}));

const Admin = React.memo(function Admin() {
  const {
    theme,
  } = useSelector(selectAdminData);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userinfo } = getUserInfo();
  const fullPath = location.pathname;
  const [, , activeTab] = location.pathname.split('/');
  const transfersPath = `${AdminTab.Transfers}`;
  const analyticsPath = `${AdminTab.Analytics}`;
  const accountsPath = `${AdminTab.Accounts}`;
  const applicationsPath = `${AdminTab.Applications}`;
  const tradesPath = `${AdminTab.Trades}`;
  const formsPath = `${AdminTab.Forms}`;

  const isDirector = [RoleName.admin, RoleName.director].includes(userinfo?.role);
  const isTrader = [RoleName.admin, RoleName.seniorTrader].includes(userinfo?.role);
  const tabClass = (t: string) => (fullPath.search(t) ? '' : 'text-muted');
  const navItems = [
    {
      icon: <TransferIcon />,
      label: <span>{labels.TransfersTab}</span>,
      to: `${endpoints.administration}/${AdminTab.Transfers}`,
      key: AdminTab.Transfers,
      classname: tabClass(transfersPath),
    },
    {
      icon: <AccountsIcon />,
      label: <span>{labels.Accounts}</span>,
      to: `${endpoints.administration}/${AdminTab.Accounts}`,
      key: AdminTab.Accounts,
      classname: tabClass(analyticsPath),
    },
    {
      icon: <ApplicationsIcon />,
      label: <span>{labels.Applications}</span>,
      to: `${endpoints.administration}/${AdminTab.Applications}`,
      key: AdminTab.Applications,
      classname: tabClass(applicationsPath),
    },
  ];
  if (isDirector) {
    navItems.push({
      icon: <AnalyticsIcon />,
      label: <span>{labels.Analytics}</span>,
      to: `${endpoints.administration}/${AdminTab.Analytics}`,
      key: AdminTab.Analytics,
      classname: tabClass(analyticsPath),
    });
  }
  if (isTrader) {
    navItems.push({
      icon: <TradesIcon/>,
      label: <span>{labels.Trades}</span>,
      to: `${endpoints.administration}/${AdminTab.Trades}`,
      key: AdminTab.Trades,
      classname: tabClass(tradesPath),
    });
  }
  const onSelectNavItem = (key: AdminTab) => dispatch(clickedTabThunk({ tab: key, path: `${key}` }));

  return (
    <HelmetProvider>
      <Helmet>
        <title>{labels.AdminWebpageTitle}</title>
      </Helmet>
      <div className='admin'>
        {!activeTab && <Navigate to={`${endpoints.administration}/${AdminTab.Transfers}`} />}
        <div>
          <Row className='m-0 align-items-stretch'>
            <SideNav
              items={navItems}
              onSelect={onSelectNavItem}
              activeKey={activeTab}
              theme={theme}
            />
            <Col className='my-5 my-md-0 pt-3 pt-md-0 pb-md-0 mb-md-0' md={true} style={{ height: '100vh', overflow: 'scroll', paddingBottom: '120px' }}>
              <Row>
                <NavigationBar hideLogoWhenLarge={true} />
              </Row>
              <Row>
                <Container fluid className='mb-md-0'>
                  <Tab.Container activeKey={activeTab} mountOnEnter={true}>
                    <Tab.Content>
                      <Tab.Pane eventKey={AdminTab.Transfers}>
                        <AdminTransfersRouter />
                      </Tab.Pane>
                      <Tab.Pane eventKey={AdminTab.Accounts}>
                        <AccountsRouter />
                      </Tab.Pane>
                      <Tab.Pane eventKey={AdminTab.Applications}>
                        <Routes>
                          <Route path={`${AdminTab.Applications}`}
                            element={<Applications />}
                          />
                        </Routes>
                      </Tab.Pane>
                      <Tab.Pane eventKey={AdminTab.Analytics}>
                        <Routes>
                          <Route path={AdminTab.Analytics}
                            element={<Analytics />}
                          />
                        </Routes>
                      </Tab.Pane>
                      <Tab.Pane eventKey={AdminTab.Trades}>
                        <Routes>
                          <Route path={`${AdminTab.Trades}/:activeTab`}
                            element={<TradesContainer />}
                          />
                          <Route path={`${AdminTab.Trades}`}
                            element={<TradesContainer />}
                          />
                        </Routes>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </Container>
              </Row>
            </Col>
            <OpenAccountDialog />
          </Row>
          <Alerts />
          <BottomNav
            activeKey={activeTab}
            onSelect={onSelectNavItem}
            items={navItems}
          />
        </div>
      </div>
    </HelmetProvider>
  );
});

export default Admin;
