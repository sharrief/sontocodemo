import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { RequestActions as labels } from '@client/js/labels';
import ConfirmationDialog from '@components/ConfirmationDialog';
import MultiSelector from '@components/MultiSelector';
import { currency } from '@client/js/core/helpers';
import { DateTime } from 'luxon';
import {
  Button, Dropdown,
} from 'react-bootstrap';
import {
  handleTransferUpdate, useOperationsByRequest, useRequest,
} from '@client/js/admin/admin.store';
import { API } from '@api';

function PostedOperations(props: {
    requestId: number;
    showing: boolean;
    onHide: () => void;
  }) {
  const { requestId, showing, onHide } = props;
  const { request, requestLoading } = useRequest(requestId);
  const { operations, operationsLoading } = useOperationsByRequest(requestId);
  const dispatch = useDispatch();
  const { type, status } = request;
  const [saving, setSaving] = useState(false);
  const busy = requestLoading || operationsLoading || saving;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const cancelChanges = () => {
    setSelectedIds([]);
    onHide();
  };
  const saveChanges = async () => {
    setSaving(true);
    const response = await API.Operations.Delete.post({ ids: selectedIds });
    handleTransferUpdate(response, dispatch);
    setSaving(false);
    setSelectedIds([]);
    onHide();
  };

  const canSave = !!selectedIds?.length;
  const options = operations
    .map(({
      id, amount, month, day, year, wireConfirmation,
    }) => ({
      id,
      label: `#${id}: ${currency(amount)} ${DateTime.fromObject({ day, year, month }).toLocaleString(DateTime.DATE_SHORT)} ${wireConfirmation}`,
    }));

  return (
    <ConfirmationDialog
      show={showing}
      title={labels.unPostTitle(request.id, type, status)}
      cancelLabel={labels.Cancel}
      onCancel={cancelChanges}
      acceptLabel={labels.Confirm}
      canAccept={canSave}
      onAccept={saveChanges}
      busy={busy}
    >
      <h5>{labels.undoPostPrompt}</h5>
      <MultiSelector {...{
        options,
        selectedIds,
        setSelectedIds,
      }}/>
    </ConfirmationDialog>
  );
}

function viewOperations(props: {
  requestId: number;
  uiType: 'button' | 'menuItem';

}) {
  const { requestId, uiType } = props;
  const { operations, operationsLoading } = useOperationsByRequest(requestId);
  const [showing, setShowing] = useState(false);
  const onHide = () => setShowing(false);
  const showUnPostOperationsDialog = () => setShowing(true);
  const enabled = !operationsLoading;
  if (operations?.length) {
    if (uiType === 'button') {
      return <>
    <PostedOperations {...{ requestId, showing, onHide }} />
    <Button
      disabled={!enabled}
      variant='outline-secondary'
      onClick={showUnPostOperationsDialog}
    >{labels.unpostRequest}</Button>
    </>;
    }

    if (uiType === 'menuItem') {
      return <>
<PostedOperations {...{ requestId, showing, onHide }}/>
<Dropdown.Item
  disabled={!enabled}
  onClick={showUnPostOperationsDialog}
>{labels.unpostRequest}</Dropdown.Item>
</>;
    }
  }
  return null;
}

export const ViewRequestOperations = React.memo(viewOperations);
