import React, { useEffect, useState } from 'react';
import {
  Container, Nav, Row, Tab,
} from 'react-bootstrap';
import { TradeLog as TradeLogLabels, TradeReport as TradeReportLabels } from '@labels';
import { createSelector } from 'reselect';
import { AdminTab } from '@store/state';
import { useDispatch, useSelector } from 'react-redux';
import { RoleName } from '@interfaces';
import {
  Routes, Route, useLocation, useNavigate, useMatch, useParams, Link as RouterLink, Navigate,
} from 'react-router-dom';
import { getUserInfo } from '../admin.store';
import TradeLog from './TradeLog';
import TradeReport from './TradeReport';

const TradesContainer = () => {
  const { activeTab } = useParams<{ activeTab: string }>();
  const tabName = { log: 'log', report: 'report' };

  const { userinfo } = getUserInfo();

  if (![RoleName.admin, RoleName.seniorTrader].includes(userinfo?.role)) return null;
  return <Container fluid>
      {(!activeTab) && <Navigate to={tabName.log} />}
    <Tab.Container activeKey={activeTab}>
      <Row>
        <Nav variant='pills' defaultActiveKey={activeTab} activeKey={activeTab}>
          <Nav.Item>
            <Nav.Link
              as={RouterLink}
              to={`../${AdminTab.Trades}/${tabName.log}`}
              eventKey={tabName.log}>
              {TradeLogLabels.title}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              as={RouterLink}
              to={`../${AdminTab.Trades}/${tabName.report}`}
              eventKey={tabName.report}>
              {TradeReportLabels.title}
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Row>
      <Row className='pt-2'>
        <Tab.Content className='px-0'>
          <Tab.Pane eventKey={tabName.log}>
            <TradeLog />
          </Tab.Pane>
          <Tab.Pane eventKey={tabName.report}>
            <TradeReport />
          </Tab.Pane>
        </Tab.Content>
      </Row>
    </Tab.Container>
  </Container>;
};

export default TradesContainer;
