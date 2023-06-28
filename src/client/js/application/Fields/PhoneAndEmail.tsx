/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { RootState } from '@application/application.store';
import { propValidation, ValidationFeedback } from '@application/Validation';
import { ValidationMessageAndValue } from '@validation';
import { createSelector, createSlice, CreateSliceOptions } from '@reduxjs/toolkit';
import { IContactInfo, ContactType } from '@interfaces';
import { AsYouType } from 'libphonenumber-js';
import { ContactInfo } from '@models';
import { applyThenValidate, loadApplication, saveApplication } from '../applicationForm.behavior';

const initialState = { phone: '', email: '' };
const sliceReducer: (name: ContactType) => CreateSliceOptions<Pick<ContactInfo, 'phone'|'email'>> = (name) => ({
  name,
  initialState,
  reducers: {
    phone: (state, { payload }) => {
      state.phone = payload;
    },
    email: (state, { payload }) => {
      state.email = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.[name]) {
        const { phone, email } = application[name];
        return { phone, email };
      }
      return state;
    });
    builder.addCase(saveApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.[name]) {
        const { phone, email } = application[name];
        return { phone, email };
      }
      return state;
    });
  },
});

const { actions: aA, reducer: aR } = createSlice(sliceReducer('applicantContact'));

export const applicantReducer = aR;

const { actions: rA, reducer: rR } = createSlice(sliceReducer('representativeContact'));

export const representativeReducer = rR;

const actions = {
  applicantContact: aA, representativeContact: rA,
};

const selectPhoneAndEmail = createSelector([
  (state: RootState) => {
    const { phone, email } = state.dataState.app.applicantContact;
    return { phone, email };
  },
  (state: RootState) => {
    const { phone, email } = state.dataState.app.representativeContact;
    return { phone, email };
  },
  (state: RootState) => state.dataState.app.clickedToSign,
],
(applicantContact, representativeContact, clickedToSign) => ({ applicantContact, representativeContact, clickedToSign }));

const selectValidation = createSelector([
  (state: RootState) => state.uiState.validationMessages,
  (state: RootState) => state.uiState.wasValidatedByServer,
],
(validationMessages, isServerValidated) => ({ validationMessages, isServerValidated }));

function PhoneAndEmail({ contactType }: {contactType: ContactType}) {
  const selected = useSelector(selectPhoneAndEmail);
  let phone; let email;
  const { clickedToSign } = selected;
  const contactInfo = selected?.[contactType];
  if (typeof contactInfo !== 'boolean') {
    ({ phone, email } = contactInfo);
  }
  const state = { phone, email };
  const { validationMessages, isServerValidated } = useSelector(selectValidation);
  const validations = {} as { [key in keyof Pick<IContactInfo, 'phone'|'email'>]: ValidationMessageAndValue };
  if (validationMessages[contactType]) { ({ phone: validations.phone, email: validations.email } = validationMessages[contactType]); }
  const disabled = clickedToSign;
  const dispatch = useDispatch();
  const asYouType = new AsYouType();
  const phoneInitialValue = '+';
  return (
    <Row>
      <Col xs={12} sm={6}>
        <Form.Control {...{
          type: 'text',
          disabled,
          value: phone,
          ...propValidation(state, validations, 'phone', isServerValidated, phoneInitialValue),
          label: Labels.Phone,
          onChange: ({ target: { value } }) => value && dispatch(applyThenValidate(actions[contactType].phone(asYouType.input(value)))),
        }} />
        <Form.Label>{Labels.Phone}</Form.Label>
        <ValidationFeedback {...{ name: 'phone', validations }} />
      </Col>
      <Col xs={12} sm={6}>
        <Form.Control {...{
          type: 'text',
          disabled,
          value: email,
          ...propValidation(state, validations, 'email', isServerValidated),
          label: Labels.Email,
          onChange: (e) => dispatch(applyThenValidate(actions[contactType].email(e.target.value))),
        }} />
        <Form.Label>{Labels.Email}</Form.Label>
        <ValidationFeedback {...{ name: 'email', validations }} />
      </Col>
    </Row>
  );
}

export const component = React.memo(PhoneAndEmail);
