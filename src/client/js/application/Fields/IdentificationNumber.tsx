/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import { RootState } from '@application/application.store';
import { applyThenValidate, loadApplication, saveApplication } from '@application/applicationForm.behavior';
import { ContactType, FieldNames, IContactInfo } from '@interfaces';
import { createSelector, createSlice, CreateSliceOptions } from '@reduxjs/toolkit';
import { ValidationMessageAndValue } from '@validation';
import { propValidation, ValidationFeedback } from '../Validation';

const sliceReducers: (initialState: string, name: ContactType) => CreateSliceOptions<IContactInfo['identificationNumber']> = (initialState, name) => ({
  name,
  initialState,
  reducers: {
    onIDNumberChange: (_state, { payload }) => payload,
  },
  extraReducers: (builder) => {
    builder.addCase(loadApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.[name]) {
        return application[name].identificationNumber;
      }
      return state;
    });
    builder.addCase(saveApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.[name]) {
        return application[name].identificationNumber;
      }
      return state;
    });
  },
});

const { actions: applicantActions, reducer: aR } = createSlice(sliceReducers('', 'applicantContact'));

export const applicantReducer = aR;

const { actions: representativeActions, reducer: rR } = createSlice(sliceReducers('', 'representativeContact'));

export const representativeReducer = rR;

const actions = {
  applicantContact: applicantActions,
  representativeContact: representativeActions,
};

const selectIdentificationNumber = createSelector([
  (state: RootState) => state.dataState.app.applicantContact.identificationNumber,
  (state: RootState) => state.dataState.app.representativeContact.identificationNumber,
  (state: RootState) => state.dataState.app.clickedToSign,
],
(a, r, clickedToSign) => ({
  applicantContact: { identificationNumber: a },
  representativeContact: { identificationNumber: r },
  clickedToSign,
}));

const selectValidation = createSelector([
  (state: RootState) => state.uiState.validationMessages,
  (state: RootState) => state.uiState.wasValidatedByServer,
],
(validationMessages, isServerValidated) => ({
  validationMessages, isServerValidated,
}));

export const validateFieldNames = [FieldNames.ContactInfo.identificationNumber];

function IdentificationNumber({ contactType }: {contactType: ContactType}) {
  const {
    [contactType]: {
      identificationNumber,
    },
    clickedToSign,
  } = useSelector(selectIdentificationNumber);
  const state = { identificationNumber };
  const { validationMessages, isServerValidated } = useSelector(selectValidation);
  const dispatch = useDispatch();
  const validations = {} as {[key in keyof Pick<IContactInfo, 'identificationNumber'>]: ValidationMessageAndValue};
  if (validationMessages[contactType]) { ({ identificationNumber: validations.identificationNumber } = validationMessages[contactType]); }
  return (
    <Col xs={12} sm={6}>
      <Form.Group>
      <Form.Control {...{
        type: 'text',
        disabled: clickedToSign,
        ...propValidation(state, validations, 'identificationNumber', isServerValidated),
        value: identificationNumber,
        label: Labels.IdentificationNumber,
        onChange: (e) => (dispatch(applyThenValidate(actions[contactType].onIDNumberChange(e.target.value)))),
      }} />
      <Form.Label>{Labels.IdentificationNumber}</Form.Label>
      <ValidationFeedback {...{ validations, name: 'identificationNumber' }}/>
      </Form.Group>
    </Col>
  );
}

export const component = React.memo(IdentificationNumber);
