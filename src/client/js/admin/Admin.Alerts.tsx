import React from 'react';
import Toast from 'react-bootstrap/Toast';
import { createSelector } from 'reselect';
import {
  CombinedState, AlertVariant,
} from '@store/state';
import { admin } from '@admin/admin.reducers';
import { useDispatch, useSelector } from 'react-redux';
import { AlertLabels } from '@labels';
import { Container } from 'react-bootstrap';

const selectAlerts = createSelector([
  (state: CombinedState) => state.admin.alerts,
], (alerts) => alerts);

const component = () => {
  const alerts = useSelector(selectAlerts);
  const dispatch = useDispatch();
  const removeAlert = (id: Parameters<typeof admin.actions.removeAlert>[0]) => dispatch(admin.actions.removeAlert(id));

  return <Container
  className='fixed-bottom bottom-toasts d-flex flex-column align-items-center'>
  <style>{`
  .bottom-toasts {
    margin-bottom: 75px;
  }
  @media (min-width: 768px) {
    .bottom-toasts {
      margin-bottom: 10px;
    }
  }
  .bottom-toasts .toast {
    width: 85%
  }
  `}</style>

  {alerts.map(({
    message, type, id, show,
  }) => (
    <Toast
      key={id}
      onClose={() => removeAlert(id)}
      bg={type}
      className='mb-2'
      show={show}
    >
      <Toast.Header>
        <span className='me-auto'>{type === AlertVariant.Danger && AlertLabels.Error}{type === AlertVariant.Success && AlertLabels.Success}{type === AlertVariant.Primary && AlertLabels.Message}</span>
      </Toast.Header>
      <Toast.Body>
        <span className='text-white' style={{ fontSize: '.875em' }}>{message}</span>
      </Toast.Body>
    </Toast>
  ))}
  </Container>;
};

export const Alerts = () => {
  const alerts = useSelector(selectAlerts);
  const dispatch = useDispatch();
  const removeAlert = (id: Parameters<typeof admin.actions.removeAlert>[0]) => dispatch(admin.actions.removeAlert(id));

  return <>{alerts.map(({
    message, type, id, show,
  }) => (
    <Toast
      key={id}
      onClose={() => removeAlert(id)}
      bg={type}
      className='mb-2'
      show={show}
    >
      <Toast.Header>
        <span className='me-auto'>{type === AlertVariant.Danger && AlertLabels.Error}{type === AlertVariant.Success && AlertLabels.Success}{type === AlertVariant.Primary && AlertLabels.Message}</span>
      </Toast.Header>
      <Toast.Body>
        <span className='text-white' style={{ fontSize: '.875em' }}>{message}</span>
      </Toast.Body>
    </Toast>
  ))}</>;
};

export default React.memo(component);
