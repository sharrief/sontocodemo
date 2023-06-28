/* eslint-disable no-param-reassign */
import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button, { ButtonProps } from 'react-bootstrap/Button';
import Labels from '@application/Labels';
import { useDispatch, useSelector } from 'react-redux';
import {
  RootState,
} from '@application/application.store';
import { clickedStepButton } from '@application/applicationForm.behavior';
import { createSelector } from '@reduxjs/toolkit';

const selectStepBackState = createSelector([
  (state: RootState) => state.uiState.canStepBack,
  (state: RootState) => state.uiState.currentStep,
],
(canStepBack, currentStep) => ({ canStepBack, currentStep }));

export const StepBack: React.FunctionComponent<ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>> = React.memo(function StepBackButton(props) {
  const {
    canStepBack, currentStep,
  } = useSelector(selectStepBackState);
  const dispatch = useDispatch();
  return (
    <Button disabled={!canStepBack} onClick={() => dispatch(clickedStepButton({
      goToStep: Math.max(currentStep - 1, 0),
    }))} {...props}>{props.children || Labels.Back}</Button>
  );
});

const selectStepNextState = createSelector([
  (state: RootState) => state.uiState.canStepNext,
  (state: RootState) => state.uiState.currentStep,
  (state: RootState) => state.uiState.numberOfSteps,
],
(canStepNext, currentStep, numberOfSteps) => ({ canStepNext, currentStep, numberOfSteps }));

export const StepNext: React.FunctionComponent<ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>> = React.memo(function StepNextButton(props) {
  const {
    canStepNext, currentStep, numberOfSteps,
  } = useSelector(selectStepNextState);
  const dispatch = useDispatch();
  return (
    <Button disabled={!canStepNext} onClick={() => dispatch(clickedStepButton({
      goToStep: Math.min(currentStep + 1, numberOfSteps - 1),
    }))} {...props}>{props.children || Labels.Next}</Button>
  );
});

const selectShowBackAndNext = createSelector([
  (state: RootState) => state.uiState.showBackAndNext,
],
(showBackAndNext) => ({ showBackAndNext }));

export const BackAndNext = React.memo(function component() {
  const {
    showBackAndNext,
  } = useSelector(selectShowBackAndNext);
  return (
    <>
      <Row
        className='mb-2 d-none d-md-flex'
        hidden={!showBackAndNext}
      >
        <Col md='6'><StepBack/></Col>
        <Col md='6' className='d-flex flex-column align-items-end'><StepNext/></Col>
      </Row>
    </>
  );
});
