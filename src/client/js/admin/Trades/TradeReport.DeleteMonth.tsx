import ResponsiveModal from '@client/js/components/Modal';
import { TradeReport as labels } from '@labels';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import {
  Button, Col, Row, Spinner,
} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { DeleteTradeReport, useUnpublishedTrades } from '../trades.store';

const DeleteMonth = (props: { month: number; year: number; handleClose: () => void }) => {
  const { month, year, handleClose } = props;
  const dispatch = useDispatch();
  const { trades, refreshTrades } = useUnpublishedTrades();
  const monthPublished = trades?.reduce((published, t) => published && t.published, true);
  const [saving, setSaving] = useState(false);
  const handleDeleteReportConfirmed = async () => {
    if (!monthPublished) {
      setSaving(true);
      const success = await DeleteTradeReport(month, year, dispatch);
      if (success) refreshTrades();
      setSaving(false);
      handleClose();
    }
  };
  return <ResponsiveModal
    show={!!(month && year)}
    header={<span className='fs-5'>{labels.DeleteTradeReport}</span>}
    body={<span>{labels.DeleteTradeReportInstruction(DateTime.fromObject({ month, year }).toFormat('MMMM yyyy'))}</span>}
    footer={
      <Row className='w-100 justify-content-between'>
        <Col xs='auto'><Button onClick={handleClose} variant='secondary' disabled={saving}>{labels.cancel}</Button></Col>
        <Col xs='auto'>
          <Button onClick={handleDeleteReportConfirmed} variant='danger' disabled={saving || monthPublished}>
          {saving ? <Spinner size='sm' animation='grow' /> : null}{labels.Delete}
          </Button></Col>
      </Row>
    }
    handleClose={handleClose}
  />;
};

export default DeleteMonth;
