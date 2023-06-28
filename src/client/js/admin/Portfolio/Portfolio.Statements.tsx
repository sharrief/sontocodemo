/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import CombinedState, { AlertVariant } from '@store/state';
import { Portfolio as labels } from '@client/js/labels';
import { createSelector } from 'reselect';
import {
  Spinner,
  Modal,
  Tab,
  Tabs,
  Button,
  ProgressBar,
} from 'react-bootstrap/esm/index';
import { initPortfolioStatements } from '@admin/Portfolio/Portfolio.Thunks';
import { PortfolioStatementsFilter, PortfolioStatementsTable } from '@admin/Portfolio/Portfolio.Statements.Table';
import { PortfolioStatementsSlice } from '@admin/Portfolio/Portfolio.Accounts.Slice';
import GenerateButton from '@admin/Portfolio/Portfolio.Accounts.Statements.Generate';
import PortfolioAccountsSelector from '@admin/Portfolio/Portfolio.Accounts.Selector';
import PortfolioManagerSelector from '@admin/Portfolio/Portfolio.ManagerSelector';
import Search from '@mui/icons-material/Search';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { RoleName } from '@interfaces';
import { chain } from '@numbers';
import { getUserInfo } from '../admin.store';

const selectPortfolioAccountsState = createSelector([
  (state: CombinedState) => state.portfolioStatementsState.loading,
  (state: CombinedState) => state.portfolioStatementsState.inited,
  (state: CombinedState) => state.portfolioStatementsState.genEmailsState,

], (loading, inited, genEmailsState) => ({
  loading, inited, genEmailsState,
}));

function Options() {
  const [open, setOpen] = useState(false);
  const { userinfo } = getUserInfo();
  const { role } = userinfo || { role: null };
  return <>
    <Button onClick={() => setOpen(!open)} style={{ height: '100%', width: '100%' }}>
      {labels.Find} <Search />
    </Button>
    <Modal show={open} onHide={() => setOpen(false)}>
      <>
      <Modal.Header closeButton><h3>{labels.FindStatements}</h3></Modal.Header>
      <Modal.Body>
        <Row>
          <Container>
            <Tabs>
            <Tab eventKey='accounts' title='Accounts' className='mt-2'>
                <PortfolioAccountsSelector asDialog={false}/>
              </Tab>
              {[RoleName.admin, RoleName.director].includes(role) && <Tab eventKey='managers' title='Managers' className='mt-2'>
                <PortfolioManagerSelector asDialog={false}/>
              </Tab>}
              <Tab eventKey='months' title='Months' className='mt-2'>
                <PortfolioStatementsFilter asDialog={false}/>
              </Tab>
            </Tabs>
          </Container>
        </Row>
      </Modal.Body>
      </>
    </Modal>
  </>;
}

function PortfolioStatements() {
  const {
    loading,
    inited,
    genEmailsState,
  } = useSelector(selectPortfolioAccountsState);
  const dispatch = useDispatch();
  const { actions } = PortfolioStatementsSlice;
  const hideProgress = () => dispatch(actions.statementEmailsHide());
  const {
    showProgress,
    inProgress,
    timeLeft,
    timeTotal,
    countLeft,
    countTotal,
  } = genEmailsState;
  const loadingSomething = Object.keys(loading).reduce((_undefined, n: keyof typeof loading) => loading[n], false);
  useEffect(() => {
    if (!(inited.accounts || inited.statements || inited.operations)) {
      dispatch(initPortfolioStatements());
    }
  }, [inited]);

  return (
    <Container fluid className='px-0 px-md-3'>
      <Row className='my-2'>
        <Col xs='6' md='auto'>
          <Options />
        </Col>
        <Col xs='6' md='auto'>
          <GenerateButton />
        </Col>
      </Row>
      {showProgress && <Row className='align-items-center'>
        <Col xs={12} md='auto'>
          <span>{labels.SendingEmails}: {countTotal - countLeft}/{countTotal} ({labels.SendingEmailsTime((timeLeft))})</span>
        </Col>
        <Col xs={true}>
          <ProgressBar
          className='w-100'
          animated={inProgress}
          variant={inProgress ? '' : 'success'}
          now={chain(timeTotal)
            .subtract(timeLeft)
            .divide(timeTotal)
            .multiply(100)
            .done()}
          />
        </Col>
        <Col xs='auto'>
          <Button onClick={hideProgress} variant='link'><VisibilityOff/></Button>
        </Col>
        </Row>}
      {loadingSomething
        ? <Row className='mt-2'><Col><Alert variant={AlertVariant.Primary}>{labels.Loading} <Spinner animation='grow' size='sm'/></Alert></Col></Row>
        : null}
      <Row>
        <PortfolioStatementsTable />
      </Row>
    </Container>
  );
}

export default React.memo(PortfolioStatements);
