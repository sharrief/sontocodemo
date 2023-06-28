import React from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { DateTime } from 'luxon';
import { currencyShort, getIconByRequestStatus } from '@helpers';
import {
  IRequest, IDocument, IUser, OperationType, IUserTrimmed, IManager,
} from '@interfaces';
import { transactionListLabels as labels } from '@client/js/labels';
import { Spinner } from 'react-bootstrap';
import RemoveCircle from '@mui/icons-material/RemoveCircle';
import AddCircle from '@mui/icons-material/AddCircle';
import {
  useRequest, useDocument, useUser, useManager,
} from '@admin/admin.store';
import TransactionProgressBar from './TransactionProgressBar';

const TransferSummary = (props: { requestId: number }) => {
  const { request, requestLoading } = useRequest(props.requestId);
  const { document, documentLoading } = useDocument(request?.id);
  const { account } = useUser(request?.userId);
  const { manager } = useManager(account?.accountNumber);
  const loaded = { request: !requestLoading, document: !documentLoading };
  const {
    id, amount, status, datetime, createdId, type,
  } = request;
  const {
    id: docId, stage: docStage, status: docStatus, lastUpdated,
  } = document || {};
  let createdBy = '';
  if (account?.id === createdId) createdBy = `${account.name} ${account.lastname}`;
  if (manager?.id === createdId) createdBy = manager.displayName;
  const loadingSmall = <Spinner animation='grow' size='sm' />;
  const loadingLarge = <Spinner animation='grow' />;
  return (
    <Card key={id || 0} className='w-100 transactions-summary-component'>
      <Card.Body>
        <Container fluid className='px-0 px-md-2'>
          <Row>
            <Col xs={12} lg={6} className='d-flex align-items-center'>
              <Row className='flex-grow-1 justify-content-between'>
                <style>{`
                @media (min-width: 768px) {
                  .transactions-summary-component span.req-data {
                    font-size: 1.5rem;
                  }
                }
              `}</style>
                <Col xs='auto' md={3} className='d-flex align-items-center'>
                  {loaded.request && <span className='req-data align-middle'>#{id}</span>}
                </Col>
                <Col xs='auto' md={5} className='d-flex align-items-center justify-content-center'>
                  {loaded.request && <span className='req-data align-middle'>{getIconByRequestStatus(status)} {status}</span>}
                </Col>
                <Col xs='auto' md={3} className='d-flex align-items-center justify-content-center'>
                  {!loaded.request
                    ? loadingLarge
                    : <>{type === OperationType.Debit ? <RemoveCircle /> : <AddCircle />} <span className='req-data align-middle'>{currencyShort(Math.abs(amount))}</span></>
                  }
                </Col>
              </Row>
            </Col>
            <Col xs={12} lg={6} >
              <Row>
                <Col className='d-none d-md-inline'>
                  {!loaded.document
                    ? loadingSmall
                    : <span>{`${labels.Status} ${docId ? docStatus : labels.noDoc}`}</span>
                  }
                </Col>
                <Col className='d-md-none'>
                  {!loaded.document
                    ? loadingSmall
                    : <span style={{ fontSize: '.75rem' }}>{`${docId ? docStatus : labels.noDoc}`}</span>
                  }
                </Col>
              </Row>
              <Row>
                <Col>
                  <TransactionProgressBar
                    transaction={{ stage: docStage, status, docStatus }}
                  />
                </Col>
              </Row>
              <Row className='d-none d-md-flex'>
                <Col md={5}>
                  {loaded.request && <span>
                    {labels.requestSubmitted}{createdBy ? ` ${createdBy}` : ''}: {datetime && DateTime.fromMillis(datetime).toLocaleString(DateTime.DATETIME_FULL)}
                  </span>
                  }
                </Col>
                <Col md={5}>
                  {loaded.document && <span>{docId ? `${labels.statusLastUpdated}: ${DateTime.fromMillis(lastUpdated).toLocaleString(DateTime.DATETIME_FULL)}` : ''}</span>
                  }
                </Col>
                <Col md={2} className='d-none d-md-inline text-right'>
                  {(loaded.document && !!docId) && <span>Doc #{docId}</span>
                  }
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </Card.Body>
    </Card>
  );
};

export default TransferSummary;
