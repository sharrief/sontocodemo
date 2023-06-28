/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { loginLabels as labels } from '@labels';
import { Variant } from '@store/state';
import Accordion from 'react-bootstrap/esm/Accordion';
import AccordionItem from 'react-bootstrap/esm/AccordionItem';
import AccordionHeader from 'react-bootstrap/esm/AccordionHeader';
import AccordionBody from 'react-bootstrap/esm/AccordionBody';
import { Alert, FormControl } from 'react-bootstrap';
import { API } from '@api';
import Brand from '@brand/brandLabels';
import ResponsiveModal from './Modal';

export default function LoginForm(props: {
  busy: boolean;
  doLogin: (email: string, password: string, otp: string) => void;
  otpRequired?: boolean;
}) {
  const { doLogin, busy: loggingIn, otpRequired } = props;
  const [validated, setValidated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOTP] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'email') return setEmail(e.target.value);
    if (e.target.name === 'password') return setPassword(e.target.value);
    if (e.target.name === 'otp') return setOTP(e.target.value);
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setValidated(false);
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    if (form.checkValidity() === true) {
      doLogin(email, password, otp);
    } else {
      setValidated(true);
    }
  };

  const [activeTab, setActiveTab] = useState('');
  const [busy, setBusy] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState('primary');
  const startReset = async () => {
    setBusy(true);

    try {
      const { message: msg, error } = await API.Users.StartPasswordReset.post({ email });
      setMessage(error || msg);
      if (error) setVariant('danger');
    } catch (e) {
      setMessage(e?.message || e);
    }
    setBusy(false);
    setShowResetDialog(false);
  };
  const handleOpen = () => setShowResetDialog(true);
  const handleClose = () => setShowResetDialog(false);
  const hideAlert = () => setMessage('');

  const header = <span className='fs-5'>Reset your password</span>;
  const body = <Accordion activeKey={activeTab}>
    <AccordionItem eventKey='1'>
      <AccordionHeader onClick={() => setActiveTab('1')}>
        1. Enter the email address associated with your {Brand.ShortName} account
      </AccordionHeader>
      <AccordionBody>
        <FormControl
          value={email}
          name="email"
          type="email"
          placeholder={labels.emailPlaceholder}
          onChange={onChange}
        />
      </AccordionBody>
    </AccordionItem>
    <AccordionItem eventKey='2'>
      <AccordionHeader onClick={() => setActiveTab('2')}>
        2. Click the button below to start the password resest
      </AccordionHeader>
      <AccordionBody>
        <Button
          disabled={busy || !email}
          onClick={startReset}
        >
          Reset password
        </Button>
      </AccordionBody>
    </AccordionItem>
  </Accordion>;

  return (<>
    {message && <Alert variant={variant} dismissible onClose={hideAlert}>{message}</Alert>}
    <Form noValidate validated={validated} onSubmit={handleSubmit} method='POST'>
      <Form.Group className='login-row' controlId="formEmail" >
        <Form.Label>{labels.email}</Form.Label>
        <Form.Control disabled={loggingIn || (email && otpRequired)} isValid={email && otpRequired} required name="email" type="email" value={email} placeholder={labels.emailPlaceholder} onChange={onChange} />
        <Form.Control.Feedback type="invalid">
          Please enter a valid email address.
          </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className='login-row' controlId="formPassword" >
        <Form.Label>{labels.password}</Form.Label>
        <Form.Control disabled={loggingIn || (password && otpRequired)} isValid={password && otpRequired} required name="password" type="password" value={password} placeholder={labels.passwordPlaceholder} onChange={onChange} />
        <Form.Control.Feedback type="invalid">
          Please enter your account password
          </Form.Control.Feedback>
      </Form.Group>
      {otpRequired && <Form.Group className='login-row' controlId="formOTP" >
        <Form.Label>{labels.OTP}</Form.Label>
        <Form.Control disabled={loggingIn} required name="otp" type="text" value={otp} placeholder={labels.otpPlaceholder} onChange={onChange} />
        <Form.Control.Feedback type="invalid">
          Please enter your code
          </Form.Control.Feedback>
      </Form.Group>}
      <Form.Group>
        <Button size='sm' disabled={loggingIn} variant={Variant.Link} style={{ paddingLeft: 0 }}
          onClick={handleOpen}
        >I forgot my password</Button>
      </Form.Group>
      <Button disabled={loggingIn} type="submit">{labels.signIn}</Button>
    </Form>
    <ResponsiveModal
      show={showResetDialog}
      header={header}
      body={body}
      handleClose={handleClose}
    />
  </>
  );
}
