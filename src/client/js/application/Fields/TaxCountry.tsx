/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import { RootState } from '@application/application.store';
import { applyThenValidate, loadApplication, saveApplication } from '@application/applicationForm.behavior';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import countries from 'i18n-iso-countries';
import enjson from 'i18n-iso-countries/langs/en.json';
import { propValidation, ValidationFeedback } from '@application/Validation';
import { IApplication } from '@interfaces';
import { ValidationMessageAndValue } from '@validation';

countries.registerLocale(enjson);
const countryObject = countries.getNames('en', { select: 'official' });

export const { actions, reducer } = createSlice({
  name: 'application',
  initialState: '',
  reducers: {
    onTaxCountryChange: (_state, { payload }) => payload,
  },
  extraReducers: (builder) => {
    builder.addCase(loadApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.taxCountry) {
        return application.taxCountry;
      }
      return state;
    });
    builder.addCase(saveApplication.fulfilled, (state, { payload: { application } }) => {
      if (application) {
        return application.taxCountry;
      }
      return state;
    });
  },
});

const selectTaxCountry = createSelector([
  (state: RootState) => state.dataState.app.taxCountry,
  (state: RootState) => state.dataState.app.clickedToSign,
],
(taxCountry, clickedToSign) => ({ taxCountry, clickedToSign }));

const selectValidation = createSelector([
  (state: RootState) => state.uiState.validationMessages,
  (state: RootState) => state.uiState.wasValidatedByServer,
],
(validationMessages, isServerValidated) => ({ validationMessages, isServerValidated }));

function TaxCountry() {
  const state = useSelector(selectTaxCountry);
  const { taxCountry, clickedToSign } = state;
  const { validationMessages, isServerValidated } = useSelector(selectValidation);
  const validations = {} as {[key in keyof Pick<IApplication, 'taxCountry'>]: ValidationMessageAndValue};
  ({ taxCountry: validations.taxCountry } = validationMessages);

  const dispatch = useDispatch();
  return (
    <Col>
      <Form.Control {...{
        as: 'select',
        disabled: clickedToSign,
        value: taxCountry,
        ...propValidation(state, validations, 'taxCountry', isServerValidated),
        label: Labels.TaxCountry,
        onChange: (e) => (dispatch(applyThenValidate(actions.onTaxCountryChange(e.target.value)))),
      }}>
        <option value=''>{Labels.CountrySelect}</option>
        {Object.keys(countryObject).map((key) => <option key={key} value={key}>{`${countryObject[key]} [${key}]`}</option>)}
      </Form.Control>
      <Form.Label>{Labels.TaxCountry}</Form.Label>
      <ValidationFeedback {...{ validations, name: 'taxCountry' }}/>
    </Col>
  );
}

export const component = React.memo(TaxCountry);
