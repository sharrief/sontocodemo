/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { redirect, useSearchParams } from 'react-router-dom';
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import LoginForm from '@components/LoginForm';
import { loginLabels as labels } from '@client/js/labels';
import '@client/scss/Login.scss';
import { API } from '@api';
import { AlertVariant } from '@store/state';
import Logo from '@brand/images/logo-color.png';
import favicon from '@brand/images/favicon.png';

export const Login = () => {
  const [message, setMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState(AlertVariant.Primary);
  const [loggingIn, setLoggingIn] = useState(false);
  const [link, setLink] = useState('');
  const [loggedOut, setLoggedOut] = useState(false);
  const [otpRequired, setOTPRequired] = useState(false);
  const [params] = useSearchParams();

  const submitCreds = async (email: string, password: string, otp?: string) => {
    setLoggingIn(true);
    setAlertVariant(AlertVariant.Primary);
    setMessage(labels.prepareLogin);
    const {
      success, error, message, otpRequired, link: redirectLink,
    } = await API.Users.Login.post({
      email, password, link, otp,
    });
    setMessage(message);
    if (otpRequired) {
      setAlertVariant(AlertVariant.Info);
      setOTPRequired(true);
    }
    if (error) {
      setAlertVariant(AlertVariant.Danger);
      setLoggingIn(false);
    }
    if (success) {
      setAlertVariant(AlertVariant.Success);
    } else {
      setLoggingIn(false);
    }
    if (redirectLink) {
      const to = `/#${redirectLink}`;
      console.log(`Redirecting to ${to}`);
      window.location.href = to;
    }
  };

  useEffect(() => {
    if (params.has('logout')) {
      setLoggedOut(true);
    }
    if (params.has('link')) {
      setLink(params.get('link'));
    }
  }, [params]);

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
                        show={loggedOut && !message}
                        variant={AlertVariant.Secondary}
                        >
                        <span>{labels.loggedOut}</span>
                      </Alert>
                      <Alert
                      show={!!message}
                      variant={alertVariant}
                      dismissible={!loggingIn && !otpRequired}
                      >
                      <span>{message}</span>
                        {loggingIn ? <Spinner size='sm' animation="grow"/> : null}
                      </Alert>
                      <LoginForm busy={loggingIn} doLogin={submitCreds} otpRequired={otpRequired}/>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
            <span>Version 1.2.3</span>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};

export default Login;
