/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  ApplicantEntityType, IApplicantBirthDate,
} from '@interfaces';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import { RootState } from '@application/application.store';
import { applyThenValidate, loadApplication, saveApplication } from '@application/applicationForm.behavior';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { propValidation, ValidationFeedback } from '@application/Validation';
import { ValidationMessageAndValue } from '@validation';

const initialState: IApplicantBirthDate = { month: 0, year: 0, day: 0 };

const { actions, reducer: r } = createSlice({
  name: 'applicantDateOfBirth',
  initialState,
  reducers: {
    onMonthChange: (state, { payload }) => { state.month = payload; },
    onDayChange: (state, { payload }) => { state.day = payload; },
    onYearChange: (state, { payload }) => { state.year = payload; },
  },
  extraReducers: (builder) => {
    builder.addCase(loadApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.applicantContact?.dateOfBirth) {
        ({ day: state.day, month: state.month, year: state.year } = application.applicantContact.dateOfBirth);
      }
      return state;
    });
    builder.addCase(saveApplication.fulfilled, (state, { payload: { application } }) => {
      if (application?.applicantContact?.dateOfBirth) {
        ({ day: state.day, month: state.month, year: state.year } = application.applicantContact.dateOfBirth);
      }
      return state;
    });
  },
});

export const applicantReducer = r;

const selectDoB = createSelector([
  (state: RootState) => state.dataState.app.entityType,
  (state: RootState) => state.dataState.app.applicantContact.dateOfBirth,
  (state: RootState) => state.dataState.app.clickedToSign,
],
(entityType, dateOfBirth, clickedToSign) => ({
  entityType, applicantContact: { dateOfBirth }, clickedToSign,
}));

const selectValidation = createSelector([
  (state: RootState) => state.uiState.validationMessages,
  (state: RootState) => state.uiState.wasValidatedByServer,
],
(validationMessages, isServerValidated) => ({
  validationMessages, isServerValidated,
}));
function DoB() {
  const {
    entityType,
    applicantContact: {
      dateOfBirth: { month, day, year },
    },
    clickedToSign,
  } = useSelector(selectDoB);
  const state = { day, month, year };
  const { validationMessages, isServerValidated } = useSelector(selectValidation);
  const validations = {} as {[key in keyof IApplicantBirthDate]: ValidationMessageAndValue};
  if (validationMessages?.applicantContact?.dateOfBirth) {
    ({
      day: validations.day,
      month: validations.month,
      year: validations.year,
    } = validationMessages.applicantContact.dateOfBirth);
  }

  const dispatch = useDispatch();
  const disabled = clickedToSign || (entityType !== ApplicantEntityType.Individual);
  return (
    <>
      <Col>
        <Form.Group>
          <Form.Control
            {...{
              type: 'number',
              disabled,
              ...propValidation(state, validations, 'month', isServerValidated, 0),
              max: 12,
              min: 1,
              value: month || '',
              placeholder: Labels.DateOfBirthMonthPlaceholder,
              onChange: (e) => (dispatch(applyThenValidate(actions.onMonthChange(+(e.target.value))))),
            }} />
          <Form.Label>{Labels.DateOfBirthMonth}</Form.Label>
          <ValidationFeedback {...{ validations, name: 'month' }} />
        </Form.Group>
      </Col>
      <Col>
        <Form.Control
          {...{
            type: 'number',
            disabled,
            ...propValidation(state, validations, 'day', isServerValidated, 0),
            max: 31,
            min: 1,
            value: day || '',
            placeholder: Labels.DateOfBirthDayPlaceholder,
            onChange: (e) => (dispatch(applyThenValidate(actions.onDayChange(+(e.target.value))))),
          }} />
        <Form.Label>{Labels.DateOfBirthDay}</Form.Label>
        <ValidationFeedback {...{ validations, name: 'day' }}/>
      </Col>
      <Col>
        <Form.Control
          {...{
            type: 'number',
            disabled,
            ...propValidation(state, validations, 'year', isServerValidated, 0),
            max: parseInt(DateTime.local().toFormat('yyyy'), 10),
            min: 1800,
            value: year || '',
            placeholder: Labels.DateOfBirthYearPlaceholder,
            onChange: (e) => (dispatch(applyThenValidate(actions.onYearChange(+(e.target.value))))),
          }} />
        <Form.Label>{Labels.DateOfBirthYear}</Form.Label>
        <ValidationFeedback {...{ validations, name: 'year' }} />
      </Col>
    </>
  );
}

export const component = React.memo(DoB);
