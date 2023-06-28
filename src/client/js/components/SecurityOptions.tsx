import React, { useEffect, useState } from 'react';
import qrcode from 'qrcode';
import ResponsiveModal from '@components/Modal';
import {
  Alert,
  Button, Col, Container, Form, FormControl, InputGroup, Row, Spinner,
} from 'react-bootstrap';
import { API } from '@api';
import { useDispatch } from 'react-redux';
import CheckCircle from '@mui/icons-material/CheckCircle';
import FileCopy from '@mui/icons-material/FileCopy';
import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import OpenInNew from '@mui/icons-material/OpenInNew';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Brand from '@brand/brandLabels';
import { getUserInfo, handleMessageAndError } from '../admin/admin.store';
import Labels from './SecurityOptions.Lables';
import { AlertVariant } from '../store/state';
import { SiteTitle } from '../labels';

interface SecurityOptionsProps {
  show: boolean
  onClose: () => void
}

export function SecurityOptions(props: SecurityOptionsProps) {
  const { show, onClose } = props;
  const { userinfo, userinfoLoading, mutate } = getUserInfo();
  const { otpRequired } = userinfo || { otpRequired: false };
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (userinfoLoading) { setBusy(true); }
  }, [userinfoLoading]);

  const dispatch = useDispatch();
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getSecret = async () => {
    setLoading(true);
    const { error, message, secret: generatedSecret } = await API.Users.GenerateTempOTPSecret.get();
    setLoading(false);
    if (error || message) handleMessageAndError({ error, message }, dispatch);
    setSecret(generatedSecret);
  };

  const [qrcodeURL, setQRCodeURL] = useState('');
  useEffect(() => {
    if (!secret) return setQRCodeURL('');
    const uri = `otpauth://totp/${encodeURIComponent(Brand.MidName)}:${userinfo?.email}?secret=${secret}&period=30&digits=6&algorithm=SHA1&issuer=${encodeURIComponent(Brand.MidName)}`;
    return qrcode.toDataURL(uri, (err, imageURL) => {
      if (err) handleMessageAndError({ error: err.message }, dispatch);
      return setQRCodeURL(imageURL);
    });
  }, [secret]);

  const [secretCopied, setSecretCopied] = useState(false);
  const copySecretToClipboard = () => {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 3000);
  };
  const [accountNameCopied, setAccountNameCopied] = useState(false);
  const accountName = `${SiteTitle}:${userinfo?.email}`;
  const copyAccountNameToClipboard = () => {
    navigator.clipboard.writeText(accountName);
    setAccountNameCopied(true);
    setTimeout(() => setAccountNameCopied(false), 3000);
  };

  const [submitted, setSubmitted] = useState(false);
  const [codeIsValid, setCodeIsValid] = useState(false);
  const onCodeEntered = (value: string) => {
    setSubmitted(false);
    const newCode = value.replace(/[^0-9]+/, '').substring(0, 6);
    setCode(newCode);
    if (newCode.length === 6) { setCodeIsValid(true); } else { setCodeIsValid(false); }
    setSubmitted(false);
  };

  const validateCode = async () => {
    setLoading(true);
    const { error, message, success } = await API.Users.ValidateTempOTPSecret.post({ code, password });
    setLoading(false);
    setSubmitted(true);
    if (success) {
      mutate();
      setPassword('');
      setSubmitted(false);
      setCode('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    event.stopPropagation();
    validateCode();
  };

  const disableOTPClicked = async () => {
    setLoading(true);
    const { error, message, success } = await API.Users.DisableOTP.post({ password });
    setLoading(false);
    if (success) {
      mutate();
      setPassword('');
    }
  };

  return <ResponsiveModal
    header={<h3>{Labels.securityOptions}</h3>}
    body={<>
      <Container>
        <Row>
          <Row className='justify-content-center fs-5'>
            <Col>
              <div className='d-flex align-items-center flex-wrap'>{Labels.status}:{otpRequired
                ? <span className='text-success'><span className='ps-2'>{Labels.otpEnabled} </span><span style={{ fontSize: '1.5em' }}><Lock /></span></span>
                : <span className='text-secondary'><span className='ps-2'>{Labels.otpDisabled}</span><span style={{ fontSize: '1.5em' }}><LockOpen /></span></span>
              }</div>
            </Col>
          </Row>
          <Row className='justify-content-center'><Col>{Labels.otpInstructions}</Col></Row>
          <Row className='justify-content-center mt-2'><Col><span className='text-danger'>{Labels.otpWarning}</span></Col></Row>
        </Row>
        <hr />
        {otpRequired && <>
          <Row className='mb-2'>
            <Col>{Labels.otpDisablePrompt}</Col>
          </Row>
          <Row className='mb-2'>
            <Col>
              <Form.Control type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder={Labels.enterPasswordToDisable} />
            </Col>
          </Row>
          <Row>
            <Col>
              <Button onClick={disableOTPClicked} disabled={loading || !password}>
                {Labels.otpDisableLabel} {loading && <Spinner animation='grow' size='sm' />}
              </Button>
            </Col>
          </Row>
        </>}
        {!otpRequired && <>
          {!secret && <>
          <Row className='justify-content-center mb-2 fs-6'><Col>{Labels.toEnable}</Col></Row>
            <Row className='justify-content-center mb-2'><Col>{Labels.otpExtraInstructions}</Col></Row>
            <Row className='justify-space-between'>
              <Col className='justify-content-center'>
                <strong>{Labels.GoogleAuthenticator}</strong>
                <div><a target='_blank' rel='noreferrer' href='https://apps.apple.com/app/google-authenticator/id388497605'>
                  {Labels.iPhone} <OpenInNew /></a></div>
                <div><a target='_blank' rel='noreferrer' href='https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2'>
                  {Labels.Android} <OpenInNew /></a></div>
              </Col>
              <Col className='justify-content-center mb-2'>
                <strong>{Labels.MicrosoftAuthenticator}</strong>
                <div><a target='_blank' rel='noreferrer' href='https://apps.apple.com/us/app/microsoft-authenticator/id983156458'>{Labels.iPhone} <OpenInNew /></a></div>
                <div><a target='_blank' rel='noreferrer' href='https://play.google.com/store/apps/details?id=com.azure.authenticator'>{Labels.Android} <OpenInNew /></a></div>
              </Col>
            </Row>
            <Row className='justify-content-between'>
              <Col>
                {Labels.otpExtraInstructions2}
              </Col>
            </Row>
            <Row>
              <Col className='d-flex justify-content-center mt-2'>
                <Button onClick={getSecret} disabled={loading}>
                  {Labels.generateSecret} {loading && <Spinner animation='grow' size='sm' />}
                </Button>
              </Col>
            </Row>
          </>}

          {secret && <>
            <Row className='justify-content-center mb-2 fs-6'><Col>{Labels.otpSetupHeader}</Col></Row>
            <Row>
              <Col>
                {Labels.otpExtraInstructions3}
              </Col>
            </Row>
            <Row>
              <Col className='d-flex justify-content-center'>
                <img src={qrcodeURL} />
              </Col>
            </Row>
            <div className='mb-2'>{Labels.otpExtraInstructions4}</div>
            <Row>
              <Col>
                {Labels.accountName}
                <InputGroup>
                  <Form.Control readOnly value={accountName}/>
                  <Button onClick={copyAccountNameToClipboard} variant={accountNameCopied ? AlertVariant.Success : AlertVariant.Primary}>{accountNameCopied ? <CheckCircle/> : <ContentCopy/>}</Button>
                </InputGroup>
              </Col>
            </Row>
            <Row>
              <Col>
                {Labels.secretKey}
                <InputGroup>
                  <Form.Control readOnly value={secret} />
                  <Button onClick={copySecretToClipboard} variant={secretCopied ? AlertVariant.Success : AlertVariant.Primary}>{secretCopied ? <CheckCircle/> : <ContentCopy/>}</Button>
                </InputGroup>
              </Col>
            </Row>
            <hr />
            <Form noValidate onSubmit={handleSubmit}>
              <Form.Group className='mb-2'>
                <Form.Label>{Labels.codeLabel}</Form.Label>
                <Form.Control
                  value={code}
                  name='otp'
                  type='text'
                  onChange={(e) => onCodeEntered(e.target.value)}
                  placeholder={Labels.codePlaceholder}
                  isInvalid={submitted}
                />
              </Form.Group>
              <Form.Group className='mb-2'>
                <Form.Control
                type='password'
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={Labels.enterPasswordToEnable}
                isInvalid={submitted}
                />
                {submitted && <FormControl.Feedback type='invalid'>{Labels.invalidCode}</FormControl.Feedback>}
              </Form.Group>
              <Form.Group>
                <Button
                disabled={loading || !codeIsValid || !password}
                type='submit'
                >
                  {Labels.validateCode}{loading && <Spinner size='sm' animation='grow'/>}
                </Button>
              </Form.Group>
            </Form>
          </>}
        </>}
        </Container>
    </>}
    show={show}
    handleClose={onClose}
  />;
}
