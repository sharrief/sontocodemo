import ResponsiveModal from '@client/js/components/Modal';
import { saveAs } from 'file-saver';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { RequestParams } from 'shared/api/admin.api';
import { Activity as Labels } from '@client/js/labels';
import { parseAsync } from 'json2csv';
import {
  Button, Col, Form, InputGroup, Row,
} from 'react-bootstrap';
import { currency } from '@client/js/core/helpers';
import { RoleName } from '@interfaces';
import { getUserInfo, handleMessageAndError, useTransferList } from '@admin/admin.store';
import Brand from '@brand/brandLabels';
import { useRequestQueryContext } from './RequestParameters.Provider';
import { TransferListRows } from './TransferList.Types';
import FetchTransfers from './TransferList.FetchTransfers';

const TransferListTableExport = ({ done, show }: {
  done: () => void;
  show: boolean;
}) => {
  const dispatch = useDispatch();
  const [preparing, setPreparing] = useState(false);
  const [exportReady, setExportReady] = useState(false);
  const [exportParams, setExportParams] = useState<RequestParams>(null);
  const {
    transfers: loadedTransfers,
    requestParameters,
    meta: { totalCount },
    busy: transfersLoading,
  } = useRequestQueryContext();
  const {
    type, status, search,
  } = requestParameters;
  const [limit, setLimit] = useState<number>();
  useEffect(() => {
    if (limit == null) {
      setLimit(loadedTransfers.length);
    }
  }, [loadedTransfers]);
  const { userinfo } = getUserInfo();
  const isAdmin = RoleName.admin === userinfo?.role;
  const loading = (exportParams && transfersLoading);
  const busy = loading || preparing;
  const canExport = !busy && limit;

  const handleExportAllClicked = () => {
    setLimit(totalCount);
  };
  const transformTransfersToStringCSV = async (transfers: TransferListRows) => {
    setPreparing(true);
    let rowsString = '';
    try {
      const unparsedRows = transfers
        .map((transfer) => {
          const {
            id, status, amount, datetime,
            account: {
              displayName,
              bankAccounts,
            },
            manager, posted, document,
          } = transfer;
          const [operation] = posted;
          const bankAccount = bankAccounts?.find(({ uuid }) => transfer.bankAccountUUID === uuid) || bankAccounts?.find(({ preferred }) => preferred);
          // const fields = ['ID','Status','Amount','Requested','Account','Manager','BankLast4','BankName','BankCountry', 'Posted', 'Stage', 'Notes'];
          const row = {
            ID: id,
            Status: status,
            Amount: currency(amount),
            Requested: DateTime.fromMillis(datetime).toFormat('D h:m ZZZZ'),
            Account: displayName,
            Manager: manager?.userName,
            'Bank last 4': `...${bankAccount?.accountEnding}`,
            'Bank name': bankAccount?.bankName,
            'Bank country': bankAccount?.bankCountry,
            [`${Brand.ShortName} bank`]: isAdmin && bankAccount?.receivingBankId,
            'Posted amount': operation && currency(operation.amount),
            'Posted date': operation && DateTime.fromObject({ month: operation.month, year: operation.year }).toFormat('MMM yyyy'),
            'Posted ID': operation?.id,
            Stage: document?.stage,
            Notes: document?.notes,
          };
          return row;
        });
      rowsString = await parseAsync(unparsedRows);
    } catch ({ message }) {
      handleMessageAndError({ error: message }, dispatch);
    }
    setPreparing(false);
    setExportReady(true);
    return rowsString;
  };
  const downloadClicked = async () => {
    const { transfers } = await FetchTransfers({ ...requestParameters, limit });
    const exportRows = await transformTransfersToStringCSV(transfers);
    const file = new Blob([exportRows], { type: 'text/csv;charset=utf-8' });
    saveAs(file, `Exported${limit ? ` ${limit}` : ''}${status ? ` ${status?.join(', ')}` : ''} ${type ?? ''}} requests ${search ? `matching search '${search}' ` : ''}on ${DateTime.now().toFormat('DD')}.csv`);
    setExportReady(false);
    done();
  };

  const handleClose = () => {
    done();
    setPreparing(false);
    setExportReady(false);
    setExportParams(null);
  };

  let label = Labels.ExportTransferList;
  if (loading && !exportReady) {
    label = Labels.ExportTransferListLoading(limit);
  } else if (preparing && !exportReady) {
    label = Labels.ExportTransferListExporting;
  } else if (exportReady) {
    label = Labels.ExportTransferListReady;
  }
  const [filtersLabel, setFiltersLabel] = useState<string>();

  useEffect(() => {
    setFiltersLabel(`Export${limit ? ` ${limit}` : ''}${status ? ` ${status?.join(', ')}` : ''} ${type ?? ''} requests ${search ? `matching search "${search}"` : ''}`);
  }, [limit, status, type, search]);

  return <>
  <ResponsiveModal
    show={show}
    handleClose={handleClose}
    header={null}
    body={<Row className='justify-content-center'>
      <Col xs='auto' className='fs-5'>{label}</Col>
      {<>
        <InputGroup>
          <Button
            disabled={limit === totalCount}
            onClick={handleExportAllClicked}
          >
            Export all
          </Button>
          <Form.Control
            value={limit}
            type='number'
            onChange={(e) => +e.target.value && setLimit(+e.target.value)}
          />
        </InputGroup>
        <Form.Range
          value={limit}
          min={0}
          max={totalCount}
          onChange={(e) => +e.target.value && setLimit(+e.target.value)}
        />
        <Col xs='auto'><em>{filtersLabel}</em></Col>

        <Button
          disabled={!canExport}
          onClick={downloadClicked}
        >
          {Labels.ExportDownload}
        </Button>
        </>}
      </Row>}
    footer={null}
  />
  </>;
};

export default React.memo(TransferListTableExport);
