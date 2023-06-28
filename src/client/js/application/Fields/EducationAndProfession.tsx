/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import { RootState } from '@application/application.store';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { IContactInfo } from '@interfaces';
import { ValidationMessageAndValue } from '@validation';
import { propValidation, ValidationFeedback } from '../Validation';
import { applyThenValidate } from '../applicationForm.behavior';

const initialState: {educationLevel?: string; profession?: string} = { educationLevel: '', profession: '' };

export const { actions, reducer } = createSlice({
  name: 'representativeContact',
  initialState,
  reducers: {
    onEducationLevelChange: (state, { payload }) => { state.educationLevel = payload; },
    onProfessionChange: (state, { payload }) => { state.profession = payload; },
  },
});

const selectEducationAndProfession = createSelector([
  (state: RootState) => state.dataState.app.representativeContact.educationLevel,
  (state: RootState) => state.dataState.app.representativeContact.profession,
  (state: RootState) => state.dataState.app.clickedToSign,
],
(educationLevel, profession, clickedToSign) => ({ educationLevel, profession, clickedToSign }));

const selectValidation = createSelector(
  [
    (state: RootState) => state.uiState.validationMessages,
    (state: RootState) => state.uiState.wasValidatedByServer,
  ],
  (validationMessages, isServerValidated) => ({ validationMessages, isServerValidated }),
);

export const component = () => {
  const state = useSelector(selectEducationAndProfession);
  const { educationLevel, profession, clickedToSign } = state;
  const { validationMessages, isServerValidated } = useSelector(selectValidation);
  const validations = {} as {[key in keyof Pick<IContactInfo, 'educationLevel'|'profession'>]: ValidationMessageAndValue};
  if (validationMessages?.representativeContact) {
    ({
      educationLevel: validations.educationLevel,
      profession: validations.profession,
    } = validationMessages.representativeContact);
  }
  const dispatch = useDispatch();
  const disabled = clickedToSign;
  return (
    <>
      <Col>
        <Form.Control {...{
          type: 'text',
          disabled,
          value: educationLevel,
          ...propValidation(state, validations, 'educationLevel', isServerValidated),
          label: Labels.EducationLevel,
          onChange: (e) => (dispatch(applyThenValidate(actions.onEducationLevelChange(e.target.value)))),
        }} />
        <Form.Label>{Labels.EducationLevel}</Form.Label>
        <ValidationFeedback {...{ validations, name: 'educationLevel' }}/>
      </Col>
      <Col>
        <Form.Control {...{
          type: 'text',
          disabled,
          value: profession,
          ...propValidation(state, validations, 'profession', isServerValidated),
          label: Labels.Profession,
          onChange: (e) => (dispatch(applyThenValidate(actions.onProfessionChange(e.target.value)))),
        }} />
        <Form.Label>{Labels.Profession}</Form.Label>
        <ValidationFeedback {...{ validations, name: 'profession' }} />
      </Col>
    </>
  );
};
