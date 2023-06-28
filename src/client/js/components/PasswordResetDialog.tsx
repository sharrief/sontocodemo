import { API } from '@api';
import { getPasswordResetTemplate } from '@email';
import React, { useEffect, useState } from 'react';
import {
  Form, Button, Spinner, Dropdown, Card,
} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { PasswordReset as Labels } from '@labels';
import Lock from '@mui/icons-material/Lock';
import { handleMessageAndError } from '@admin/admin.store';
import ResponsiveModal from './Modal';
import useSiteMetadata from '../core/useSiteMetadata';

const PasswordResetDialog = (props: { email: string; asDropdownItem?: boolean }) => {
  const { email, asDropdownItem } = props;
  const { adminEmail } = useSiteMetadata();
  const dispatch = useDispatch();
  const [doingReset, setDoingReset] = useState(false);
  const busy = doingReset;
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const handlePasswordResetModalClose = () => setShowPasswordResetModal(false);
  const doPasswordReset = async () => {
    if (busy || !email) return;
    setDoingReset(true);
    const response = await API.Users.StartPasswordReset.post({ email });
    handleMessageAndError(response, dispatch);
    handlePasswordResetModalClose();
    setDoingReset(false);
  };
  const emailTemplate = getPasswordResetTemplate('[Link will be auto-generated when the email is sent]', adminEmail);

  return <><ResponsiveModal
    show={showPasswordResetModal}
    handleClose={handlePasswordResetModalClose}
    header={`Reset password for ${email}`}
    body={<>
      <span>{Labels.EmailWillBeSent}</span>
      <Card>
        <Card.Body>
          {emailTemplate}
        </Card.Body>
      </Card>
    </>}
    footer={<>
      <Button disabled={busy} onClick={() => doPasswordReset()}>{busy ? <>{Labels.Sending} <Spinner animation='grow' size='sm' /></> : Labels.Send}</Button>
    </>}
  />
  {asDropdownItem
    ? <Dropdown.Item onClick={() => setShowPasswordResetModal(true)}><Lock/>&nbsp;{Labels.ResetPassword}</Dropdown.Item>
    : <Button onClick={() => setShowPasswordResetModal(true)}><Lock/>&nbsp;{Labels.ResetPassword}</Button>
  }
  </>;
};

export default React.memo(PasswordResetDialog);
