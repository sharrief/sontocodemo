/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IApplication } from '@interfaces';
import Labels from '@application/Labels';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import Alert from 'react-bootstrap/Alert';
import { RootState } from '@application/application.store';

const initialState: Partial<Pick<IApplication,
'checkedAuthentic'
| 'checkedNotUnlawful'
| 'clickedToSign'
>> = { };

export const { actions, reducer } = createSlice({
  name: 'application',
  initialState,
  reducers: {
    onCheckedAuthentic: (state, { payload }) => { state.checkedAuthentic = payload; },
    onCheckedNotUnlawful: (state, { payload }) => { state.checkedNotUnlawful = payload; },
    onClickedToSign: (state, { payload }) => { state.clickedToSign = payload; },
  },
});

const selectCheckBoxes = createSelector([
  (state: RootState) => state.dataState.app.checkedAuthentic,
  (state: RootState) => state.dataState.app.checkedNotUnlawful,
  (state: RootState) => state.dataState.app.clickedToSign,
],
(checkedAuthentic, checkedNotUnlawful, clickedToSign) => ({
  checkedAuthentic,
  checkedNotUnlawful,
  clickedToSign,
}));

export const component = function Acknowledgement() {
  const {
    checkedAuthentic, checkedNotUnlawful, clickedToSign,
  } = useSelector(selectCheckBoxes);
  const dispatch = useDispatch();
  const disabled = clickedToSign;
  return (
    <div>
      <Row className='mb-3'>
        <Form.Text>{Labels.SignInstruction}</Form.Text>
      </Row>
      <Row>
        <Form.Label>{Labels.SignPretext}</Form.Label>
      </Row>
      <Row className='mt-2'>
        <Form.Check {...{
          id: 'authentic',
          disabled,
          label: Labels.SignAuthentic,
          checked: checkedAuthentic,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => dispatch(actions.onCheckedAuthentic(e.target.checked)),
        }}
        />
      </Row>
      <Row className='mt-2'>
        <Form.Check {...{
          id: 'notUnlawful',
          disabled,
          label: Labels.SignNotUnlawful,
          checked: checkedNotUnlawful,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => dispatch(actions.onCheckedNotUnlawful(e.target.checked)),
        }}
        />
      </Row>
      <Row className='mt-2'>
        <Alert variant={clickedToSign ? 'success' : 'primary'}><em>{clickedToSign ? Labels.ApplicationComplete : Labels.SignLinkInstruction}</em></Alert>
      </Row>
    </div>
  );
};
