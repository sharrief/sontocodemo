import ResponsiveModal from '@client/js/components/Modal';
import { percent } from '@client/js/core/helpers';
import { TradeReport as labels } from '@labels';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import {
  Button, Col, Row, Spinner,
} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { PublishTradeReport, useUnpublishedTrades } from '../trades.store';

const PublishMonth = (props: { month: number; year: number; interest: number; handleClose: () => void }) => {
  const {
    month, year, interest, handleClose,
  } = props;
  const interestString = percent(interest / 100);
  const dispatch = useDispatch();
  const { refreshTrades } = useUnpublishedTrades();
  const [saving, setSaving] = useState(false);
  const handlePublishReportConfirmed = async () => {
    setSaving(true);
    const success = await PublishTradeReport(month, year, dispatch);
    if (success) refreshTrades();
    setSaving(false);
    handleClose();
  };
  return <ResponsiveModal
    show={!!(month && year && interest)}
    header={<span className='fs-5'>{labels.PublishTradeReport}</span>}
    body={<span>{labels.PublishTradeReportInstruction(DateTime.fromObject({ month, year }).toFormat('MMMM yyyy'), interestString)}</span>}
    footer={
      <Row className='w-100 justify-content-between'>
        <Col xs='auto'><Button onClick={handleClose} variant='secondary' disabled={saving}>{labels.cancel}</Button></Col>
        <Col xs='auto'><Button onClick={handlePublishReportConfirmed} variant='primary' disabled={saving}>
          {saving ? <Spinner size='sm' animation='grow' /> : null}{labels.Publish}
          </Button></Col>
      </Row>
    }
    handleClose={handleClose}
  />;
};

export default PublishMonth;
