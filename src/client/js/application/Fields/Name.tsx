/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import { RootState } from '@application/application.store';
import {
  IContactInfo, ContactType, ApplicantEntityType,
} from '@interfaces';
import {
  combineReducers, createSlice, CreateSliceOptions,
} from '@reduxjs/toolkit';
import { ValidationMessageAndValue } from '@validation';
import { propValidation, ValidationFeedback } from '@application/Validation';
import { loadApplication, saveApplication, applyThenValidate } from '@application/applicationForm.behavior';

const initialState = { name: '', lastName: '' };

const sliceReducers: (name: ContactType) => CreateSliceOptions<Pick<IContactInfo, 'name'|'lastName'>> = (name) => ({
  name,
  initialState,
  reducers: {
    onNameChange: (state, { payload }) => {
      state.name = payload;
    },
    onLastNameChange: (state, { payload }) => {
      state.lastName = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.[name]) {
        ({ name: state.name } = application[name]);
        ({ lastName: state.lastName } = application[name]);
      }
      return state;
    });
    builder.addCase(saveApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.[name]) {
        ({ name: state.name } = application[name]);
        ({ lastName: state.lastName } = application[name]);
      }
      return state;
    });
  },
});

const { actions: applicantActions, reducer: aR } = createSlice(sliceReducers('applicantContact'));

export const applicantReducer = aR;

const { actions: representativeActions, reducer: rR } = createSlice(sliceReducers('representativeContact'));

export const representativeReducer = rR;

const actions = {
  applicantContact: applicantActions,
  representativeContact: representativeActions,
};

export const reducer = combineReducers({
  applicantReducer, representativeReducer,
});

const selectNames = createSelector(
  [
    (state: RootState) => state.dataState.app.applicantContact.name,
    (state: RootState) => state.dataState.app.applicantContact.lastName,
    (state: RootState) => state.dataState.app.representativeContact.name,
    (state: RootState) => state.dataState.app.representativeContact.lastName,
    (state: RootState) => state.dataState.app.entityType,
    (state: RootState) => state.dataState.app.clickedToSign,
  ],
  (applicantName, applicantLastName, representativeName, representativeLastName, entityType, clickedToSign) => ({
    applicantContact: { name: applicantName, lastName: applicantLastName },
    representativeContact: { name: representativeName, lastName: representativeLastName },
    entityType,
    clickedToSign,
  }),
);

const selectValidation = createSelector(
  [
    (state: RootState) => state.uiState.validationMessages,
    (state: RootState) => state.uiState.wasValidatedByServer,
  ],
  (validationMessages, isServerValidated) => ({ validationMessages, isServerValidated }),
);

export const component = React.memo(function Name({ contactType }: {contactType: ContactType}) {
  const { entityType, clickedToSign, ...namesByContactType } = useSelector(selectNames);
  const isCorpAndApplicant = entityType !== ApplicantEntityType.Individual && contactType === 'applicantContact';
  const { name, lastName } = namesByContactType[contactType];
  const state = { name, lastName };
  const { validationMessages, isServerValidated } = useSelector(selectValidation);
  const validations = {} as {[key in keyof Pick<IContactInfo, 'name'|'lastName'>]: ValidationMessageAndValue};
  if (validationMessages[contactType]) {
    ({
      name: validations.name,
      lastName: validations.lastName,
    } = validationMessages[contactType]);
  }

  const dispatch = useDispatch();
  return (
    <>
      <Col xs={12} sm={isCorpAndApplicant ? 12 : 3}>
        <Form.Group>
          <Form.Control {...{
            type: 'text',
            disabled: clickedToSign,
            ...propValidation(state, validations, 'name', isServerValidated),
            value: name,
            onChange: (e) => { dispatch(applyThenValidate(actions[contactType].onNameChange(e.target.value))); },
          }} />
          <Form.Label>{isCorpAndApplicant ? Labels.CorpName : Labels.Name}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'name' }}/>
        </Form.Group>
      </Col>
      { !isCorpAndApplicant
      && <Col xs={12} sm={3}>
        <Form.Group>
          <Form.Control {...{
            type: 'text',
            disabled: clickedToSign,
            ...propValidation(state, validations, 'lastName', isServerValidated),
            value: lastName,
            onChange: (e) => { dispatch(applyThenValidate(actions[contactType].onLastNameChange(e.target.value))); },
          }} />
          <Form.Label>{Labels.LastName}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'lastName' }}/>
        </Form.Group>
      </Col>
      }
    </>);
});
