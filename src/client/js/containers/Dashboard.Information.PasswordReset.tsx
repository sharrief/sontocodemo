import { API, endpoints } from '@api';
import React, { useState } from 'react';
import {
  Button, Card, Col, FormControl, Row, Spinner,
} from 'react-bootstrap';
import { createSelector } from 'reselect';
import { AlertVariant, CombinedState } from '@store/state';
import { dashboard } from '@store/reducers';
import { useDispatch, useSelector } from 'react-redux';
import { getPasswordResetTemplate } from '@email';
import ResponsiveModal from '@components/Modal';
import { v4 } from 'uuid';
import useSiteMetadata from '@client/js/core/useSiteMetadata';

const selector = createSelector(
  [(state: CombinedState) => state.data.currentAccount],
  (account) => ({ account }),
);

export default function StartPasswordResetDialog(props: { show: boolean; setShow: (show: boolean) => void }) {
  const { show, setShow } = props;
  const { account } = useSelector(selector);
  const { actions } = dashboard;
  const dispatch = useDispatch();
  const { displayName, email } = account;
  const { siteUrl, adminEmail } = useSiteMetadata();
  const [busy, setBusy] = useState(false);
  const cancel = () => {
    if (!busy) {
      setShow(false);
    }
  };

  const startReset = async () => {
    setBusy(true);
    let message = '';
    let error = '';
    try {
      ({ message, error } = await API.Users.StartPasswordReset.post({ email }));
    } catch (e) {
      error = e?.message || e;
    }
    dispatch(actions.addAlert({
      message: error || message,
      type: error ? AlertVariant.Danger : AlertVariant.Success,
      title: error ? 'Error' : 'Done!',
      id: v4(),
      show: true,
    }));
    setBusy(false);
    setShow(false);
  };

  const header = <span className='fs-5'>Reset password for {displayName}</span>;
  const body = <>
  <span>The following email will be sent.</span>
   {/* the above control re-written as a Card with a body containing the html variable from getPasswordResetTemplate */}
  <Card>
    <Card.Body>
      {getPasswordResetTemplate(`${siteUrl}/${endpoints.passwordReset}?[code removed for security]`, adminEmail)}
    </Card.Body>
  </Card>
  </>;
  const footer = <>
    <Row className='w-100'>
      <Col>
        <Button disabled={busy} variant='secondary' className='w-100' onClick={cancel}>Cancel</Button>
      </Col>
      <Col>
        <Button disabled={busy} className='w-100' onClick={startReset}>Start {busy && <Spinner animation='grow' size='sm' />}</Button>
      </Col>
    </Row>
  </>;
  return <ResponsiveModal
      show={show}
      handleClose={cancel}
      header={header}
      body={body}
      footer={footer}
    />;
}
