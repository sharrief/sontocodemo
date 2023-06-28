import React from 'react';
import { createSelector } from 'reselect';
import { useDispatch, useSelector } from 'react-redux';
import { dashboard } from '@store/reducers';
import {
  Container,
  Toast,
} from 'react-bootstrap';
import CombinedState, { AlertVariant } from '@store/state';
import { transactionLabels as labels } from '@labels';

const selector = createSelector([
  (state: CombinedState) => state.dashboard.alerts,
], (alerts) => ({
  alerts,
}));

export default function DashboardAlerts() {
  const {
    alerts,
  } = useSelector(selector);
  const dispatch = useDispatch();
  const { actions } = dashboard;
  const removeAlert = (id: string) => dispatch(actions.removeAlert(id));
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
        bg={type === AlertVariant.Danger ? 'danger' : 'success'}
        className='mb-2'
        show={show}
      >
        <Toast.Header>
          <span className='me-auto'>{type === 'danger' ? labels.Error : labels.Success}</span>
        </Toast.Header>
        <Toast.Body>
          <span className='text-white' style={{ fontSize: '.875em' }}>{message}</span>
        </Toast.Body>
      </Toast>
    ))}
    </Container>;
}
