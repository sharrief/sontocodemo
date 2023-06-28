/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { FieldNames, RiskProfile, IApplication } from '@interfaces';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import {
  RootState,
} from '@application/application.store';
import { ValidationMessageAndValue } from '@validation';
import { applyThenValidate } from '@application/applicationForm.behavior';
import { propValidation, ValidationFeedback } from '../Validation';

const initialState = { expectedInvestmentLengthInYears: 3, expectedInvestmentLengthOther: '', riskProfile: RiskProfile.Average };

export const { actions, reducer } = createSlice({
  name: 'application',
  initialState,
  reducers: {
    onExpectedInvestmentLengthInYearsChange: (state, { payload }) => {
      state.expectedInvestmentLengthOther = '';
      state.expectedInvestmentLengthInYears = payload;
    },
    onExpectedInvestmentLengthOtherChange: (state, { payload }) => {
      state.expectedInvestmentLengthOther = payload;
    },
    onRiskProfileChange: (state, { payload }) => {
      state.riskProfile = payload;
    },
  },
});

export const validateFieldNames = [FieldNames.Application.expectedInvestmentLengthOther];

const selectInvestmentLength = createSelector([
  (state: RootState) => state.dataState.app.expectedInvestmentLengthInYears,
  (state: RootState) => state.dataState.app.expectedInvestmentLengthOther,
  (state: RootState) => state.dataState.app.riskProfile,
  (state: RootState) => state.dataState.app.clickedToSign,
],
(expectedInvestmentLengthInYears,
  expectedInvestmentLengthOther,
  riskProfile,
  clickedToSign) => ({
  expectedInvestmentLengthInYears,
  expectedInvestmentLengthOther,
  riskProfile,
  clickedToSign,
}));

const selectValidation = createSelector([
  (state: RootState) => state.uiState.validationMessages,
  (state: RootState) => state.uiState.wasValidatedByServer,
],
(validationMessages, isServerValidated) => ({ validationMessages, isServerValidated }));

function InvestmentTargets() {
  const { clickedToSign, ...state } = useSelector(selectInvestmentLength);
  const { validationMessages, isServerValidated } = useSelector(selectValidation);

  const {
    expectedInvestmentLengthInYears,
    expectedInvestmentLengthOther,
    riskProfile,
  } = state;
  const validations = {} as {[key in keyof Pick<IApplication, 'expectedInvestmentLengthOther'>]: ValidationMessageAndValue};
  ({ expectedInvestmentLengthOther: validations.expectedInvestmentLengthOther } = validationMessages);

  const dispatch = useDispatch();
  const disabled = clickedToSign;
  const investmentLengthOtherDisabled = disabled || !!expectedInvestmentLengthInYears;

  return (
    <>
    <Form>
      <Row>
        <Form.Label>{Labels.InvestmentLengthInstruction}</Form.Label>
      </Row>
      <Row>
        <Form.Group as={Col} xs={12} sm={6} md={4}>
          <Form.Check {...{
            id: '3years',
            disabled,
            type: 'radio',
            label: Labels.InvestmentLength3Years,
            checked: expectedInvestmentLengthInYears <= 3 && expectedInvestmentLengthInYears > 0,
            onChange: () => dispatch(applyThenValidate(actions.onExpectedInvestmentLengthInYearsChange(3))),
          }} />
        </Form.Group>
        <Form.Group as={Col} xs={12} sm={6} md={4}>
          <Form.Check {...{
            id: '10years',
            disabled,
            type: 'radio',
            label: Labels.InvestmentLength10Years,
            checked: expectedInvestmentLengthInYears > 3 && expectedInvestmentLengthInYears <= 10,
            onChange: () => dispatch(applyThenValidate(actions.onExpectedInvestmentLengthInYearsChange(10))),
          }} />
        </Form.Group>
        <Form.Group as={Col} xs={12} sm={6} md={4}>
          <Form.Check {...{
            id: 'over10years',
            disabled,
            type: 'radio',
            label: Labels.InvestmentLengthMore,
            checked: expectedInvestmentLengthInYears > 10,
            onChange: () => dispatch(applyThenValidate(actions.onExpectedInvestmentLengthInYearsChange(100))),
          }} />
        </Form.Group>
        <Form.Group as={Col} xs={12} sm={6} md={4}>
          <Form.Check {...{
            id: 'other',
            disabled,
            type: 'radio',
            label: Labels.InvestmentLengthOther,
            checked: !expectedInvestmentLengthInYears,
            onChange: () => dispatch(actions.onExpectedInvestmentLengthInYearsChange(0)),
          }} />
        </Form.Group>
      </Row>
      <Row>
        <Form.Group as={Col}>
          <Form.Control {...{
            type: 'text',
            disabled: investmentLengthOtherDisabled,
            ...propValidation(state, validations, 'expectedInvestmentLengthOther', isServerValidated),
            placeholder: !investmentLengthOtherDisabled ? Labels.InvestmentLengthOtherInstruction : '',
            value: expectedInvestmentLengthOther,
            onChange: (e) => dispatch(applyThenValidate(actions.onExpectedInvestmentLengthOtherChange(e.target.value))),
          }} />
          <ValidationFeedback {...{ validations, name: 'expectedInvestmentLengthOther' }} />
        </Form.Group>
      </Row>
      <hr />
      <Row>
        <Form.Label>{Labels.InvestmentRiskInstruction}</Form.Label>
      </Row>
      <Row>
        <Form.Group as={Col} xs={12} sm={6} md={4}>
          <Form.Check {...{
            id: 'highRisk',
            disabled,
            type: 'radio',
            label: Labels.InvestmentRiskHigh,
            checked: riskProfile === RiskProfile.High,
            onChange: () => dispatch(actions.onRiskProfileChange(RiskProfile.High)),
          }} />
        </Form.Group>
        <Form.Group as={Col} xs={12} sm={6} md={4}>
          <Form.Check {...{
            id: 'avgRisk',
            disabled,
            type: 'radio',
            label: Labels.InvestmentRiskAverage,
            checked: riskProfile === RiskProfile.Average,
            onChange: () => dispatch(actions.onRiskProfileChange(RiskProfile.Average)),
          }} />
        </Form.Group>
        <Form.Group as={Col} xs={12} sm={6} md={4}>
          <Form.Check {...{
            id: 'lowRisk',
            disabled,
            type: 'radio',
            label: Labels.InvestmentRiskLow,
            checked: riskProfile === RiskProfile.Low,
            onChange: () => dispatch(actions.onRiskProfileChange(RiskProfile.Low)),
          }} />
        </Form.Group>
      </Row>
    </Form>
    </>
  );
}

export const component = React.memo(InvestmentTargets);
