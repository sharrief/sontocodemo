/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React from 'react';
import { Variant } from '@store/state';
import {
  useAccount, useStatements,
} from '@admin/admin.store';
import { useTradesByMonth } from '@admin/trades.store';
import { statementDetailsLabels as labels } from '@client/js/labels';
import {
  ButtonGroup, Button, Alert,
} from 'react-bootstrap';
import {
  PDFViewer, usePDF,
} from '@react-pdf/renderer';
import { DateTime } from 'luxon';

import Brand from '@brand/brandLabels';
import StatementDetailsPdf from './StatementDetails.pdf';
import ResponsiveModal from './Modal';
import useSiteMetadata from '../core/useSiteMetadata';

export const StatementDetailsComponent = (props: {
  accountNumber: string;
  month: number;
  year: number;
  handleClose: () => void;
}) => {
  const {
    accountNumber, month, year, handleClose,
  } = props;
  const { siteUrl } = useSiteMetadata();
  const { account, accountLoading } = useAccount(accountNumber);
  const { statements, statementsLoading } = useStatements(accountNumber);
  const { trades, tradesLoading } = useTradesByMonth(month, year);
  const loading = accountLoading || statementsLoading || tradesLoading;

  const doc = <StatementDetailsPdf
  account={account}
    statements={statements}
    trades={trades}
    month={month}
    year={year}
    siteUrl={siteUrl}
  />;
  const statementMonth = DateTime.fromFormat(`${month}-${year}`, 'M-yyyy');
  const statementMonthShort = statementMonth.toFormat('MMMM yyyy');
  const [instance] = usePDF({ document: doc });
  const saveToFile = async () => {
    if (!instance.loading && !instance.error) {
      saveAs(instance.blob, `${Brand.ShortName} ${labels.AccountStatement} - ${account?.displayName} - ${statementMonthShort}.pdf`);
    }
  };

  const header = null;
  const body = loading
    ? <Alert variant={Variant.Primary}>
        {labels.Loading}
      </Alert>
    : <div className='w-100 h-100'><PDFViewer style={{ width: '100%', height: '900px' }}>{doc}</PDFViewer></div>;
  const footer = <ButtonGroup aria-label="Export statement">
    <Button onClick={saveToFile}>Download</Button>
    <Button variant="secondary" onClick={handleClose}>Close</Button>
  </ButtonGroup>;

  return (
    <ResponsiveModal wide={true} show={!!(month && year)} handleClose={handleClose}
      header={header} body={body} footer={footer}
    />
  );
};

StatementDetailsComponent.displayName = 'StatementDetails';

export default StatementDetailsComponent;
