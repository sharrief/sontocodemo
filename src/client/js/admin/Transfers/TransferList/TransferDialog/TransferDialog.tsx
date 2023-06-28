import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/esm/Modal';
import Button from 'react-bootstrap/esm/Button';
import { useDispatch, useSelector } from 'react-redux';
import { PostRequestDialog as labels } from '@client/js/labels';
import {
  AccountOverview, RequestActions, TransferInformation, actions,
} from '@admin/Transfers/TransferList/TransferDialog';
import Col from 'react-bootstrap/esm/Col';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Card, Form, FormControl, InputGroup, Row,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Close from '@mui/icons-material/Close';
import { createSelector } from 'reselect';
import CombinedState from '@client/js/store/state';
import { useRequest } from '@client/js/admin/admin.store';
import TransferSummary from '@components/Transfers/TransactionSummary';

const selectMessagesAndErrors = createSelector([
  (state: CombinedState) => state.transferDialog.inited,
  (state: CombinedState) => state.transferDialog.errors,
  (state: CombinedState) => state.transferDialog.messages,
], (inited, errors, messages) => ({ inited, errors, messages }));
export function TransferDialog(props: { path: string }) {
  const { path } = props;
  const { inited, errors, messages } = useSelector(selectMessagesAndErrors);
  const { reqId } = useParams<{reqId: string}>();
  const navigate = useNavigate();
  const [quickNavReqId, setQuickNavReqId] = useState(reqId);
  useEffect(() => {
    if (reqId !== null && reqId !== quickNavReqId) setQuickNavReqId(reqId);
  }, [reqId]);
  const { request, requestLoading } = useRequest(+reqId);
  const { type } = request;
  const dispatch = useDispatch();
  const dismissMessages = () => dispatch(actions.clearMessages());
  const dismissErrors = () => dispatch(actions.clearErrors());
  useEffect(() => {
    if ((!inited || (request && (request?.id !== +reqId))) && !requestLoading) {
      dispatch(actions.clearData());
    }
  }, [request]);
  const doQuickNav = () => {
    navigate(`../${path}/${quickNavReqId}`);
  };
  const quickNavAble = +quickNavReqId < 10000 && quickNavReqId !== reqId;
  return (
    // TODO add dialog to React router so navigation can't happen in background while dialog is open
    <>
    <style>{`
      .cardHeader {
        display: flex;
        align-items: center;
      }
      .card-header>h5 {
        margin-bottom: 0;
      }
    `}</style>
    <Card>
      <Card.Header>
        <Row className='w-100 flex-row-reverse g-0'>
          <Col className='cardHeader justify-content-end' xs={1}>
            <Button variant='link' onClick={() => navigate(-1)}><Close /></Button>
          </Col>
          <Col className='cardHeader' xs={11}>
            <Modal.Title>
              <Row className='w-100'>
                <Col xs={12} sm='auto' className='me-2'>{type?.toLocaleUpperCase()} {labels.dialogTitle}</Col>
                <Col>
                  <Form onSubmit={(e) => { e.preventDefault(); doQuickNav(); }}>
                    <InputGroup>
                      <InputGroup.Text>#</InputGroup.Text>
                      <FormControl
                        value={quickNavReqId}
                        onChange={(e) => setQuickNavReqId(e.target.value)}
                        />
                      <Button disabled={!quickNavAble} type='submit'><SearchIcon/></Button>
                      </InputGroup>
                  </Form>
                </Col>
              </Row>
            </Modal.Title>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body>
        {errors?.length > 0
        && <Row>
            <Col>
              <Alert variant='danger' onClose={dismissErrors} dismissible>
                <p>{labels.errorHeader}</p>
                <ul>
                  {errors.map((e, idx) => <li key={idx}>{e}</li>)}
                </ul>
              </Alert>
            </Col>
          </Row>}
        {messages?.length > 0
        && <Row>
            <Col>
              <Alert variant='primary' dismissible onClose={dismissMessages}>
                {messages.map((m, idx) => <div key={idx}>{m}</div>)}
              </Alert>
            </Col>
          </Row>}
          <RequestActions requestId={request?.id}/>
        <Row className='mb-2'>
          <Col xs={12}>
            <TransferSummary requestId={+reqId}/>
          </Col>
        </Row>
        <Row>
          <Col xs={12} lg={6} className='order-1 order-md-0'>
            <TransferInformation requestId={+reqId}/>
          </Col>
          <Col xs={12} lg={6} className='mt-2 mt-md-0 order-0 order-md-1'>
            <AccountOverview requestId={+reqId}/>
          </Col>
        </Row>
      </Card.Body>
    </Card>
    </>
  );
}
