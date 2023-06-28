/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { RootState } from '@application/application.store';
import { DefaultApplicantAddress, ContactType, IApplicantAddress } from '@interfaces';
import { createSelector, createSlice, CreateSliceOptions } from '@reduxjs/toolkit';
import { propValidation, ValidationFeedback } from '@application/Validation';
import { applyThenValidate, loadApplication, saveApplication } from '@application/applicationForm.behavior';
import { ValidationMessageAndValue } from '@validation';
import countries from 'i18n-iso-countries';
import enjson from 'i18n-iso-countries/langs/en.json';

const initialState = DefaultApplicantAddress;
const sliceReducer: (name: ContactType) => CreateSliceOptions<IApplicantAddress> = (name) => ({
  name,
  initialState,
  reducers: {
    line1: (state, { payload }) => { state.line1 = payload; },
    line2: (state, { payload }) => { state.line2 = payload; },
    city: (state, { payload }) => { state.city = payload; },
    province: (state, { payload }) => { state.province = payload; },
    postal: (state, { payload }) => { state.postal = payload; },
    country: (state, { payload }) => { state.country = payload; },
  },
  extraReducers: (builder) => {
    builder.addCase(loadApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.[name]) {
        return application[name][name === 'applicantContact' ? 'legalAddress' : 'mailingAddress'];
      }
      return state;
    });
    builder.addCase(saveApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.[name]) {
        return application[name][name === 'applicantContact' ? 'legalAddress' : 'mailingAddress'];
      }
      return state;
    });
  },
});

const { actions: applicantActions, reducer: aR } = createSlice(sliceReducer('applicantContact'));

export const applicantReducer = aR;

const { actions: representativeActions, reducer: rR } = createSlice(sliceReducer('representativeContact'));

export const representativeReducer = rR;

const actions = {
  applicantContact: applicantActions,
  representativeContact: representativeActions,
};

const selectAddress = (contactType: ContactType) => createSelector([
  (state: RootState) => state.dataState.app[contactType][contactType === 'applicantContact' ? 'legalAddress' : 'mailingAddress'],
  (state: RootState) => state.dataState.app.clickedToSign,
],
(a, clickedToSign) => ({
  [contactType]: { address: a },
  clickedToSign,
}));

const selectValidation = createSelector([
  (state: RootState) => state.uiState.validationMessages,
  (state: RootState) => state.uiState.wasValidatedByServer,
],
(validationMessages, isServerValidated) => ({
  validationMessages, isServerValidated,
}));

countries.registerLocale(enjson);
const countryObject = countries.getNames('en', { select: 'official' });
function Address({ contactType }: {contactType: ContactType}) {
  const selected = useSelector(selectAddress(contactType));
  let line1; let line2; let city; let province; let country;
  let postal;
  const { clickedToSign } = selected;
  const contactInfo = selected?.[contactType];
  if (typeof contactInfo !== 'boolean') {
    ({
      line1, line2, city, province, postal, country,
    } = contactInfo.address);
  }
  const state = {
    line1, line2, city, province, country, postal,
  };
  const { validationMessages, isServerValidated } = useSelector(selectValidation);
  const addressType = contactType === 'applicantContact' ? 'legalAddress' : 'mailingAddress';
  const validations = {} as {[key in keyof IApplicantAddress]: ValidationMessageAndValue};
  if (validationMessages?.[contactType]?.[addressType]) {
    Object.keys(state).forEach(<K extends keyof IApplicantAddress>(key: K) => {
      if (state[key] || isServerValidated) {
        validations[key] = validationMessages?.[contactType]?.[addressType][key];
      }
    });
  }
  const disabled = clickedToSign;
  const dispatch = useDispatch();
  return (
    <>
      <Row>
        <Col xs={12} sm={6}>
          <Form.Control {...{
            name: 'address.line1',
            disabled,
            ...propValidation(state, validations, 'line1', isServerValidated),
            value: line1,
            onChange: (e) => (dispatch(applyThenValidate(actions[contactType].line1(e.target.value)))),
            label: Labels.AddressLine1,
          }} />
          <Form.Label>{Labels.AddressLine1}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'line1' }}/>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Control {...{
            name: 'address.line2',
            disabled,
            ...propValidation(state, validations, 'line2', isServerValidated),
            value: line2,
            onChange: (e) => (dispatch(applyThenValidate(actions[contactType].line2(e.target.value)))),
            label: Labels.AddressLine2,
          }} />
          <Form.Label>{Labels.AddressLine2}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'line2' }} />
        </Col>
      </Row>
      <Row>
        <Col xs={12} sm={3}>
          <Form.Control {...{
            name: 'address.city',
            disabled,
            ...propValidation(state, validations, 'city', isServerValidated),
            value: city,
            onChange: (e) => dispatch(applyThenValidate(actions[contactType].city(e.target.value))),
            label: Labels.AddressCity,
          }} />
          <Form.Label>{Labels.AddressCity}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'city' }} />
        </Col>
        <Col xs={12} sm={3}>
          <Form.Control {...{
            name: 'address.province',
            disabled,
            ...propValidation(state, validations, 'province', isServerValidated),
            value: province,
            onChange: (e) => dispatch(applyThenValidate(actions[contactType].province(e.target.value))),
            label: Labels.AddressProvince,
          }} />
          <Form.Label>{Labels.AddressProvince}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'province' }} />

        </Col>
        <Col xs={12} sm={3}>
          <Form.Control {...{
            name: 'address.postal',
            disabled,
            ...propValidation(state, validations, 'postal', isServerValidated),
            value: postal,
            onChange: (e) => dispatch(applyThenValidate(actions[contactType].postal(e.target.value))),
            label: Labels.AddressPostal,
          }} />
          <Form.Label>{Labels.AddressPostal}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'postal' }} />
        </Col>
        <Col xs={12} sm={3}>
          <Form.Control {...{
            name: 'address.country',
            disabled,
            as: 'select',
            value: country,
            ...propValidation(state, validations, 'country', isServerValidated),
            label: Labels.AddressCountry,
            onChange: (e) => (dispatch(applyThenValidate(actions[contactType].country(e.target.value)))),
          }}>
            <option value=''>{Labels.CountrySelect}</option>
            {Object.keys(countryObject).map((key) => <option key={key} value={key}>{`${countryObject[key]} [${key}]`}</option>)}
          </Form.Control>
          <Form.Label>{Labels.AddressCountry}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'country' }}/>
        </Col>
      </Row>
    </>
  );
}

export const component = React.memo(Address);
