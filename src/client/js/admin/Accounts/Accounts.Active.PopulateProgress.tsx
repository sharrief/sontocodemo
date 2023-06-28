/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CombinedState from '@store/state';
import { Portfolio as labels } from '@client/js/labels';
import { createSelector } from 'reselect';
import {
  Button,
  ProgressBar,
} from 'react-bootstrap/esm/index';
import { PortfolioStatementsSlice } from '@admin/Portfolio/Portfolio.Accounts.Slice';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { chain } from '@numbers';

const selectPortfolioAccountsState = createSelector([
  (state: CombinedState) => state.portfolioStatementsState.loading,
  (state: CombinedState) => state.portfolioStatementsState.inited,
  (state: CombinedState) => state.portfolioStatementsState.genEmailsState,

], (loading, inited, genEmailsState) => ({
  loading, inited, genEmailsState,
}));

function AccountPopulationProgress() {
  const {
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

  const [estTimeLeft, setEstTimeLeft] = useState(0);

  const intervalTime = 100; //ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setEstTimeLeft(estTimeLeft - intervalTime);
    }, intervalTime);
    if (timeLeft <= 0) clearTimeout(timer);
    return () => clearTimeout(timer);
  }, [estTimeLeft, timeLeft]);

  useEffect(() => {
    setEstTimeLeft(timeLeft);
  }, [timeLeft]);

  if (!showProgress) return null;
  return (
    <Row className='align-items-center'>
      <Col xs={12} md='auto'>
        <span>{labels.SendingEmails}: {countTotal - countLeft}/{countTotal} {timeLeft ? `(${labels.SendingEmailsTime((timeLeft))})` : ''}</span>
      </Col>
      <Col xs={true}>
        <ProgressBar
        className='w-100'
        animated={inProgress}
        variant={inProgress ? '' : 'success'}
        now={chain(timeTotal)
          .subtract(estTimeLeft)
          .divide(timeTotal)
          .multiply(100)
          .done()}
        />
      </Col>
      <Col xs='auto'>
        <Button onClick={hideProgress} variant='link'><VisibilityOff/></Button>
      </Col>
    </Row>
  );
}

export default React.memo(AccountPopulationProgress);
