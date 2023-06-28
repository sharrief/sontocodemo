import React from 'react';
import {
  Modal,
} from 'react-bootstrap';

export default function ResponsiveModal(props: {
  body: React.ReactNode;
  header: React.ReactNode;
  footer?: React.ReactNode; handleClose: () => void;
  show: boolean;
  wide?: boolean;
}) {
  const {
    body, header, footer, handleClose, show, wide,
  } = props;
  return <>
      <style>{`
        @media (min-width: 768px) {
          .wideDialog .modal-dialog{
            max-width: 90%;
          }
        }
      `}</style>
      <Modal className={`${wide ? 'wideDialog' : ''}`} fullscreen='md-down' show={show} onHide={handleClose}>
        <>
          {(header || handleClose) && <Modal.Header closeButton>
            {header}
          </Modal.Header>}
          {body && <Modal.Body>
            {body}
          </Modal.Body>}
          {footer && <Modal.Footer>
            {footer}
          </Modal.Footer>}
        </>
      </Modal>
  </>;
}
