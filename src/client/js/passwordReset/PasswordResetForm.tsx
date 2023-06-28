import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { passwordResetLabels as labels } from '@labels';
import { validatePassword } from '@validation';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { InputGroup } from 'react-bootstrap';

export default function PasswordResetForm(props: {
  busy: boolean;
  done: boolean;
  doReset: (password: string) => void;
}) {
  const { busy, done, doReset } = props;
  const [newPass, setNewPass] = useState('');
  const [newPassValid, setNewPassValid] = useState(false);
  const [newPassFeedback, setNewPassFeedback] = useState(null);
  const [confirmPass, setConfirmPass] = useState('');
  const [confirmPassValid, setConfirmPassValid] = useState(false);
  const [confirmPassFeedBack, setConfirmPassFeedback] = useState('Re-enter the new password');

  const [showPass, setShowPass] = useState(false);
  const toggleShowPass = () => {
    if (!confirmPass) setShowPass(!showPass);
  };
  const hidePass = () => setShowPass(false);

  const disabled = busy || done;
  const canClickReset = !disabled && newPass && confirmPass && newPassValid && confirmPassValid;
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'newPassword') {
      setNewPass(e.target.value);
      const { requirements, valid } = validatePassword(e.target.value);
      setNewPassValid(valid);
      setNewPassFeedback(<div>
        The password must:
        <ul>
          {requirements.map((req, i) => <li key={i}>{req}</li>)}
        </ul>
        </div>);
    }
    if (e.target.name === 'confirmPassword') {
      setConfirmPass(e.target.value);
      if (e.target.value === newPass) {
        setConfirmPassValid(true);
        setConfirmPassFeedback('');
      } else {
        setConfirmPassValid(false);
        setConfirmPassFeedback('Re-enter the new password');
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    if (form.checkValidity() === true) {
      doReset(confirmPass);
    }
  };

  return (
    <Form noValidate onSubmit={handleSubmit} method='POST'>
        <Form.Group className='mb-4' controlId="formNewPass">
          <Form.Label>{labels.Password}</Form.Label>
          <InputGroup hasValidation>
            <Form.Control
              disabled={disabled || !!confirmPass}
              required
              name="newPassword"
              type={showPass ? 'text' : 'password'}
              value={newPass}
              placeholder={labels.NewPassPlaceholder}
              onChange={onChange}
              isValid={newPass && newPassValid}
              isInvalid={newPass && !newPassValid}
            />
            <Button
              disabled={!newPass || !!confirmPass}
              onClick={toggleShowPass}
            >
            {showPass ? <VisibilityOff/> : <Visibility/> }
            </Button>
            <Form.Control.Feedback type="invalid">
              {newPassFeedback}
            </Form.Control.Feedback>
        </InputGroup>
      </Form.Group>
      <Form.Group className='mb-4' controlId="formConfirmPass" >
        <Form.Label>{labels.ConfirmPassword}</Form.Label>
        <Form.Control
          disabled={disabled || !newPass || !newPassValid}
          required
          name="confirmPassword"
          type="password"
          value={confirmPass}
          isValid={confirmPass && confirmPassValid}
          isInvalid={confirmPass && !confirmPassValid}
          placeholder={labels.ConfirmPassPlaceholder}
          onFocus={hidePass}
          onChange={onChange}
        />
        <Form.Control.Feedback type="invalid">
          {confirmPassFeedBack}
        </Form.Control.Feedback>
      </Form.Group>
      <Button disabled={!canClickReset} type="submit">{labels.ResetPassword}</Button>
    </Form>
  );
}
