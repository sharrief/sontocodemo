import React, { useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { passwordResetLabels as labels } from '@client/js/labels';
import '@client/scss/Login.scss';
import { API } from '@api';
import { AlertVariant } from '@store/state';
import { Button } from 'react-bootstrap';
import Logo from '@brand/images/logo-color.png';
import favicon from '@brand/images/favicon.png';
import PasswordResetForm from './PasswordResetForm';

export const Login = () => {
  const [busy, setBusy] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [message, setMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState(AlertVariant.Secondary);
  const params = new URLSearchParams(useLocation().search);
  const key = params?.get('resetKey');

  const doReset = async (newPass: string) => {
    setBusy(true);
    setAlertVariant(AlertVariant.Secondary);
    setMessage(labels.ResettingPassword);
    if (newPass) {
      const { message: resetMessage, error } = await API.Users.DoPasswordReset.post({
        resetKey: key, newPassword: newPass,
      });
      setMessage(error || resetMessage);
      setAlertVariant(error ? AlertVariant.Danger : AlertVariant.Success);
      if (!error) setResetDone(true);
    }
    setBusy(false);
  };

  return (
    <HelmetProvider>
      <Container>
        <Helmet>
          <link rel='icon' href={favicon} />
          <title>{labels.title}</title>
        </Helmet>
        <Row style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Col md='10'>
            <div className='login-card p-5 mb-4 bg-light rounded'>
              <Row style={{ justifyContent: 'center' }}>
                <Col md='8'>
                  <Row style={{ justifyContent: 'center' }}>
                    <Col md='12' style={{ paddingBottom: 50 }}>
                      <Image src={Logo} style={{ width: '100%' }} />
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Alert
                      show={!!message}
                      variant={alertVariant}
                      onClose={() => setMessage('')}
                      dismissible={!busy}
                      >
                      <span>{message}</span>
                        {busy ? <Spinner size='sm' animation="grow"/> : null}
                      </Alert>
                      {resetDone ? <Button as='a' href='/login'>Sign in</Button> : null}
                      {!resetDone && <PasswordResetForm busy={busy} done={resetDone} doReset={doReset} />}
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};

export default Login;
