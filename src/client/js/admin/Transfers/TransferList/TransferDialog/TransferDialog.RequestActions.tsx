import React from 'react';
import {
  Attachment,
  ViewRequestOperations,
  MakeRecurring,
  ManualEdit,
  CancelRequest,
  RegisterDocument,
} from '@admin/Transfers/TransferList/TransferDialog';
import {
  ButtonGroup,
  ButtonToolbar,
  Dropdown,
} from 'react-bootstrap';

function transferActions(props: {
  requestId: number;
}) {
  const { requestId } = props;
  const actions = <>
  <MakeRecurring requestId={requestId} uiType='button' />
  <ViewRequestOperations requestId={requestId} uiType='button'/>
  <CancelRequest requestId={requestId} uiType='button' />
  <ManualEdit requestId={requestId} uiType='button'/>
  <Attachment requestId={requestId} uiType='button' />
  <RegisterDocument requestId={requestId} uiType='button' />
  </>;
  const items = <>
  <MakeRecurring requestId={requestId} uiType='menuItem'/>
  <ViewRequestOperations requestId={requestId} uiType='menuItem'/>
  <CancelRequest requestId={requestId} uiType='menuItem' />
  <ManualEdit requestId={requestId} uiType='menuItem'/>
  <Attachment requestId={requestId} uiType='menuItem' />
  <RegisterDocument requestId={requestId} uiType='menuItem' />
  </>;
  return (
  <div className='mb-2 justify-content-end justify-content-sm-start d-flex'>
    <ButtonToolbar className='d-none d-sm-inline'>
      <ButtonGroup className='mr-2 mb-2'>
        {actions}
      </ButtonGroup>
    </ButtonToolbar>
    <Dropdown className='d-sm-none'>
      <Dropdown.Toggle variant='outline-primary' id='request-actions'>
        Actions
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {items}
      </Dropdown.Menu>
    </Dropdown>
  </div>
  );
}

export const RequestActions = React.memo(transferActions);
