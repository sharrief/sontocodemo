import React from 'react';
import {
  Row, Col, Button, Spinner,
} from 'react-bootstrap/esm';
import ResponsiveModal from '@components/Modal';

const confirmationDialog: React.FunctionComponent<{
  show: boolean;
  title: string;
  cancelLabel: string;
  onCancel: () => void;
  acceptLabel: string;
  busy: boolean;
  canAccept?: boolean;
  onAccept: () => void;}> = (props) => {
    const {
      show, title, children, cancelLabel, onCancel, acceptLabel, canAccept, onAccept, busy,
    } = props;
    const cancel = () => !busy && onCancel();
    const accept = (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!busy && (canAccept !== false)) onAccept();
    };
    const header = <h5>{title}</h5>;
    const body = children;
    const footer = (
    <Row className='w-100'>
      <Col xs={6}>
        <Button className='w-100' disabled={busy} variant='secondary' onClick={cancel}>{cancelLabel || 'Cancel'}</Button>
      </Col>
      <Col xs={6} className='d-flex justify-content-end'>
        <Button className='w-100' onClick={accept} disabled={busy || canAccept === false} variant='primary'><span>{acceptLabel || 'Accept'} {busy ? <Spinner as='span' animation='grow' size='sm' /> : null}</span></Button></Col>
    </Row>
    );
    return (
      <ResponsiveModal
        header={header}
        body={body}
        footer={footer}
        handleClose={cancel}
        show={show}
      />);
  };
export default confirmationDialog;
