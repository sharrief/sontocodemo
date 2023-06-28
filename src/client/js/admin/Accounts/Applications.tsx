import {
  useDispatch, useSelector,
} from 'react-redux';
import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/esm/Form';
import Row from 'react-bootstrap/esm/Row';
import Table from '@client/js/components/Table';
import { Documents as DocumentLabels } from '@labels';
import ModalResponsive from '@components/Modal';
import {
  deleteApplication, getManagers, useAccounts, useApplications,
} from '@admin/admin.store';
import {
  ButtonGroup, Col, FormControl, InputGroup,
} from 'react-bootstrap';
import { createSelector } from 'reselect';
import CombinedState from '@client/js/store/state';
import NewApplication from '@containers/Admin.Applications.New';
import ApplicationListColumns from './Accounts.Invited.Columns';

const { Applications: Labels } = DocumentLabels;
const selector = createSelector([(state: CombinedState) => state.global.theme], (theme) => ({ theme }));

const tableId = 'applicationsList';

const Applications = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector(selector);

  const { applications: apps, loading } = useApplications(dispatch);
  const { accounts } = useAccounts();
  const { managers } = getManagers();

  const [filterText, setFilterText] = useState('');
  const applications = apps
    .filter(({ authEmail, name }) => {
      if (!filterText) return true;
      return authEmail.toLowerCase()
        .indexOf(filterText.toLowerCase()) >= 0
        || name.toLowerCase()
          .indexOf(filterText.toLocaleLowerCase()) >= 0;
    })
    .map((app) => ({
      ...app,
      accountNumber: accounts?.find(({ id }) => id === app.userId)?.accountNumber,
      manager: managers?.find(({ id }) => id === app.fmId)?.displayName,
    }));

  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteConfirmEnabled, setCanConfirmDelete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [delApp, setDelApp] = useState(null);

  const clickedDeleteApp = (uuidToDel: string) => {
    const app = applications?.find(({ uuid: u }) => uuidToDel === u);
    if (app) {
      setDelApp(app);
      setShowDeletePrompt(true);
    }
  };
  const [tableColumns] = useState(ApplicationListColumns(clickedDeleteApp));
  const cancelDelete = () => {
    setShowDeletePrompt(false);
  };
  const confirmDelete = async () => {
    setProcessing(true);
    await deleteApplication(delApp.uuid, dispatch);
    setProcessing(false);
    setShowDeletePrompt(false);
  };

  useEffect(() => {
    if (showDeletePrompt) {
      setTimeout(() => {
        setCanConfirmDelete(true);
      }, 5000);
    } else if (deleteConfirmEnabled) {
      setCanConfirmDelete(false);
    }
  }, [delApp]);

  return <>
    <Row>
      <Col xs={true}>
        <InputGroup className='mb-2'>
          <NewApplication />
          <FormControl
            value={filterText}
            placeholder={Labels.FilterApplications}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </InputGroup>
      </Col>
    </Row>
    <Row>
      <Table
        id={tableId}
        rowClickHandler={null}
        manualPagination={false}
        initialPageSize={11}
        disableSearch={true}
        cardHeaderColumns={['uuid']}
        hiddenColumnAccessors={['accountNumber']}
        cardLabels={true}
        data={applications}
        columns={React.useMemo(() => tableColumns, [tableColumns])}
        itemLabelPlural={Labels.TabTitle}
        loading={loading}
        theme={theme}
      />
    </Row>
    <ModalResponsive
      show={showDeletePrompt}
      header={<span className='fs-5'>{Labels.DeleteSure}</span>}
      body={<><h5><strong>{Labels.DeletePrompt}</strong></h5>
        <Form>
          <Form.Group>
            <Form.Label>{Labels.ApplicantUsername}</Form.Label>
            <Form.Control disabled readOnly value={delApp?.authEmail} />
            <Form.Label>{Labels.AppPIN}</Form.Label>
            <Form.Control disabled readOnly value={delApp?.appPIN} />
            <Form.Label>{Labels.ApplicationStarted}</Form.Label>
            <Form.Control disabled readOnly value={delApp?.Started || Labels.NotStarted} />
            <Form.Label>{Labels.DateEnded}</Form.Label>
            <Form.Control disabled readOnly value={delApp?.dateEnded || Labels.NotCompleted} />
          </Form.Group>
        </Form></>}
      footer={<ButtonGroup className='w-100'>
        <Button className='w-50' variant='danger' disabled={!deleteConfirmEnabled || processing} onClick={confirmDelete}>{Labels.DeleteNow}</Button>
        <Button className='w-50' variant='primary' disabled={processing} onClick={cancelDelete}>{Labels.Cancel}</Button>
      </ButtonGroup>}
      handleClose={cancelDelete}
    />
  </>;
};
export default Applications;
