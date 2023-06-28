/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Labels from '@application/Labels';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@application/application.store';
import { StepNext } from '@application/Fields/BackAndNext';
import { clickedDisclaimerAccept } from '@application/applicationForm.behavior';
import { createSelector } from 'reselect';

const timerStart = 3000;
const Ol = styled.ol`
    {
      counter-reset: item;
      margin-left: 0;
      padding-left: 0;
    }`;
const Li = styled.li`
    display: block;
    margin-bottom: .5em;
    margin-left: 3em;
    &::before {
      display: inline-block;
      content: "("counter(item, lower-roman) ") ";
      counter-increment: item;
      width: 3em;
      margin-left: -3em;
    }`;
const selectHasReadDisclaimer = createSelector([
  (state: RootState) => state.dataState.app.hasReadDisclaimer,
],
(hasReadDisclaimer) => hasReadDisclaimer);
const WaitingBar = () => {
  const hasReadDisclaimer = useSelector(selectHasReadDisclaimer);
  const [timer, setTimer] = useState(timerStart);
  const [message, setMessage] = useState(Labels.DisclaimerMessages[0]);
  const dispatch = useDispatch();
  const onDisclaimerAccept = () => {
    if (!timer) {
      dispatch(clickedDisclaimerAccept());
    }
  };
  useEffect(() => {
    if (hasReadDisclaimer) { setTimer(0); setMessage(''); }
    if (!timer) return undefined;
    if (timer <= (0.1 * timerStart)) {
      setMessage(Labels.DisclaimerMessages[2]);
    } else if (timer <= (0.5 * timerStart)) {
      setMessage(Labels.DisclaimerMessages[1]);
    }
    const interval = setInterval(() => timer && setTimer(timer - 10), 100);
    return function cleanup() {
      clearInterval(interval);
    };
  }, [timer, message]);

  return (
  <>
    <div className='mb-2'><ProgressBar animated now={100 * (timer / timerStart)} /></div>
    <div className='align-items-center'>
      <StepNext disabled={timer !== 0} onClick={onDisclaimerAccept}>{Labels.DisclaimerAccept}</StepNext>
      <span className='ml-2'>{message}</span>
    </div>
  </>
  );
};

export const step1 = {
  title: Labels.InvestorSuitabilityStandards,
  Component: function Disclaimer() {
    return <Card>
      <h3>{Labels.InvestorSuitabilityStandards}</h3>
      <p>{Labels.ISSSubtitle}</p>
      {Labels.ISS.map(({ intro, paragraph, subsections }) => (
        <div key={intro}>
          <p><u>{intro}</u>   {paragraph}</p>
          {subsections && (
            <Ol type='i'>
              {subsections.map((subsection, i) => (<Li key={i}>{subsection}</Li>))}
            </Ol>
          )}
        </div>
      ))}
      {Labels.ISS2.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
      <WaitingBar />
    </Card>;
  },
};
