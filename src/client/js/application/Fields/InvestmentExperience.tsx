import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { $enum } from 'ts-enum-util';
import { InvestmentInstrument, IApplication } from '@interfaces';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { RootState } from '@application/application.store';
/* eslint-disable no-param-reassign */
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { ValidationMessageAndValue } from '@validation';
import { applyThenValidate } from '@application/applicationForm.behavior';
import { propValidation, ValidationFeedback } from '../Validation';

const initialState: Pick<IApplication, 'investmentExperience' | 'investmentExperienceOther'> = { investmentExperience: [] as InvestmentInstrument[], investmentExperienceOther: '' };
export const validateFieldNames = ['investmentExperienceOther'];
export const { actions, reducer } = createSlice({
  name: 'application',
  initialState,
  reducers: {
    investmentExperience: (state, { payload }) => {
      state.investmentExperience = payload;
      if (!state.investmentExperience?.includes(InvestmentInstrument.Other)) {
        state.investmentExperienceOther = '';
      }
    },
    investmentExperienceOther: (state, { payload }) => {
      state.investmentExperienceOther = payload;
    },
  },
});

const selectInvestmentExperience = createSelector([
  (state: RootState) => state.dataState.app.investmentExperience,
  (state: RootState) => state.dataState.app.investmentExperienceOther,
  (state: RootState) => state.dataState.app.clickedToSign,
],
(investmentExperience, investmentExperienceOther, clickedToSign) => ({ investmentExperience, investmentExperienceOther, clickedToSign }));
const selectValidation = createSelector(
  [
    (state: RootState) => state.uiState.validationMessages,
    (state: RootState) => state.uiState.wasValidatedByServer,
  ],
  (validationMessages, isServerValidated) => ({ validationMessages, isServerValidated }),
);
function InvestmentExperience() {
  const {
    investmentExperience, investmentExperienceOther, clickedToSign,
  } = useSelector(selectInvestmentExperience);
  const state = { investmentExperience, investmentExperienceOther };
  const { validationMessages, isServerValidated } = useSelector(selectValidation);
  const validations = {} as {[key in keyof Pick<IApplication, 'investmentExperienceOther'>]: ValidationMessageAndValue};
  ({ investmentExperienceOther: validations.investmentExperienceOther } = validationMessages);
  const dispatch = useDispatch();
  const toggleInvestmentExperience = (toggledInvestment: InvestmentInstrument) => {
    const copyOfInvestmentExperience = [...investmentExperience];
    const investment = copyOfInvestmentExperience.find((next) => (next === toggledInvestment));
    if (investment != null) {
      // Investment is toggled on, so toggle if off
      const index = copyOfInvestmentExperience.indexOf(investment);
      if (index >= 0) { copyOfInvestmentExperience.splice(index, 1); }
    } else {
      // Investment is toggled off, so toggle it on
      if (toggledInvestment === InvestmentInstrument.None) {
        // If toggling on None, toggle off the others
        copyOfInvestmentExperience.splice(0, copyOfInvestmentExperience.length);
      } else {
        // If toggling on something, toggle off None
        const index = copyOfInvestmentExperience.indexOf(InvestmentInstrument.None);
        if (index >= 0) { copyOfInvestmentExperience.splice(index, 1); }
      }
      copyOfInvestmentExperience.push(toggledInvestment);
    }
    if (copyOfInvestmentExperience.length === 0) {
      // Toggle on None
      copyOfInvestmentExperience.push(InvestmentInstrument.None);
    }
    dispatch(applyThenValidate(actions.investmentExperience(copyOfInvestmentExperience)));
  };
  const disabled = clickedToSign;
  const investmentExperienceOtherDisabled = disabled || !investmentExperience?.find((next) => (next === InvestmentInstrument.Other));
  return (
    <>
      <Row>
        <Form.Label>{Labels.InvestmentExperienceInstruction}</Form.Label>
      </Row>
      <Row>
        {$enum(InvestmentInstrument)
          .map((investment) => (
              <Form.Group key={investment} as={Col} xs={12} sm={6} md={4}>
                <Form.Check {...{
                  id: `investment-${investment}`, // must be globally unique for onChange to target correctly
                  disabled,
                  type: 'switch',
                  label: Labels.InvestmentInstrumentDescription[investment],
                  checked: (investmentExperience?.includes(investment) || false),
                  // eslint-disable-next-line no-console
                  onChange: () => toggleInvestmentExperience(investment),
                }} />
              </Form.Group>
          ))}

      </Row>
      <Row>
        <Form.Group as={Col}>
          <Form.Control {...{
            type: 'text',
            disabled: investmentExperienceOtherDisabled,
            ...propValidation(state, validations, 'investmentExperienceOther', isServerValidated),
            placeholder: !investmentExperienceOtherDisabled ? Labels.InvestmentExperienceOtherInstruction : '',
            value: investmentExperienceOther,
            onChange: (e) => dispatch(applyThenValidate(actions.investmentExperienceOther(e.target.value))),
          }} />
          <ValidationFeedback {...{ validations, name: 'investmentExperienceOther' }} />
        </Form.Group>
      </Row>
    </>
  );
}

export const component = React.memo(InvestmentExperience);
