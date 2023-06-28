import React from 'react';
import Toast from 'react-bootstrap/Toast';
import Spinner from 'react-bootstrap/Spinner';
import { useSelector } from 'react-redux';
import { FetchStatus, RootState } from '@application/application.store';
import Labels from '@application/Labels';
import { createSelector } from 'reselect';

const selectUI = createSelector([
  (state: RootState) => state.uiState.fetchStatus,
  (state: RootState) => state.uiState.invalidFields,
  (state: RootState) => state.uiState.fetchError,
], (fetchStatus, invalidFields, fetchError) => ({ fetchStatus, invalidFields, fetchError }));

const toasts = () => {
  const {
    fetchStatus, invalidFields, fetchError,
  } = useSelector(selectUI);
  const saving = fetchStatus === FetchStatus.Saving;
  return (<>
    <Toast
    style={{ maxWidth: 'auto' }}
    className={(fetchError || invalidFields.length ? 'bg-danger text-white' : 'bg-light text-dark')}
    show={saving || !!fetchError || invalidFields.length > 0}
    animation={true}>
      <Toast.Body
      style={{ textAlign: 'center' }} hidden={!saving}>
        {Labels.SavingChanges} <Spinner animation='grow' size='sm'/>
      </Toast.Body>
      <Toast.Body style={{ textAlign: 'center' }} hidden={!fetchError}>
        {fetchError}
      </Toast.Body>
      <Toast.Body style={{ textAlign: 'center' }} hidden={invalidFields.length < 1}>
      {Labels.invalidFields(invalidFields.length)}
      </Toast.Body>
    </Toast>
  </>);
};

export default toasts;
