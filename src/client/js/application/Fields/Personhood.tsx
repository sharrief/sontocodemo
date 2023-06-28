/* eslint-disable no-param-reassign */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ApplicantEntityType } from '@interfaces';
import Labels from '@application/Labels';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { RootState } from '@application/application.store';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { loadApplication, saveApplication } from '../applicationForm.behavior';

const { actions, reducer: r } = createSlice({
  name: 'application',
  initialState: ApplicantEntityType.Individual,
  reducers: {
    onEntityTypeChange: (_state, { payload }) => payload,
  },
  extraReducers: (builder) => {
    builder.addCase(loadApplication.fulfilled, (state, { payload: { application } }) => {
      if (application) {
        return application.entityType;
      }
      return state;
    });
    builder.addCase(saveApplication.fulfilled, (state, { payload: { application } }) => {
      if (application) {
        return application.entityType;
      }
      return state;
    });
  },
});

export const reducer = r;

const selectPersonhood = createSelector([
  (state: RootState) => state.dataState.app.entityType,
  (state: RootState) => state.dataState.app.clickedToSign,
],
(entityType, clickedToSign) => ({
  entityType, clickedToSign,
}));

function Personhood() {
  const {
    entityType, clickedToSign,
  } = useSelector(selectPersonhood);
  const dispatch = useDispatch();
  return (
    <>
      <Row className='mb-3'>
        <Col>
          <Row>
            <Form.Label>{Labels.EntityInstruction}</Form.Label>
          </Row>
          <Row>
          {Object.keys(ApplicantEntityType)
            .filter((key) => Number.isNaN(+(key)))
            .map((key: keyof typeof ApplicantEntityType) => (
              <Col key={key} xs={12} sm={4}>
                <Form.Check
                  name='appEntityType'
                  disabled={clickedToSign}
                  checked={entityType === ApplicantEntityType[key]}
                  id={key}
                  value={ApplicantEntityType[key]}
                  inline
                  type='radio'
                  label={key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const selectedEntityType = Number(e.target.value) as unknown as ApplicantEntityType;
                    dispatch(actions.onEntityTypeChange(selectedEntityType));
                  }} />
              </Col>
            ))}
            </Row>
          </Col>
      </Row>
    </>
  );
}

export const component = React.memo(Personhood);
