import React from 'react';
import CSS from 'csstype';
import { IReceivingBank, IRecevingBankLabels as Labels } from '@interfaces';
import useReceivingBank from './useReceivingBank';

type style = { [key: string]: CSS.Properties };

const rootStyles: style = {
  table: {
    width: '80%',
    fontSize: '.9em',
    border: '1px solid black',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  tr: {
    borderBottom: '1px solid black',
  },
  bankField: {
    width: '30%',
    fontWeight: 'bold',
    borderRight: '1px solid black',
  },
  bankFieldHighlight: {
    color: 'red',
  },
  bankFieldData: {
    fontFamily: '"Courier New", Courier, monospace',
  },
};

function WireInstructionsTable(props: { stylesOverride?: style; receivingBank?: IReceivingBank }) {
  const { stylesOverride: styles, receivingBank } = props;
  const {
    bankName, bankAddress, bankRoutingACH, bankRoutingWires, bankSWIFT, bankExtra,
    accountName, accountNumber, accountAddress,
  } = receivingBank;

  return <table style={styles.table}>
    <tr style={styles.tr}>
      <td style={styles.bankField}>
        {Labels.accountName}
      </td>
      <td style={styles.bankFieldData}>
        {accountName}
      </td>
    </tr>
    <tr style={styles.tr}>
      <td style={styles.bankField}>
        {Labels.accountAddress}
      </td>
      <td style={styles.bankFieldData}>
        {accountAddress}
      </td>
    </tr>
    <tr style={styles.tr}>
      <td style={styles.bankField}>
        {Labels.accountNumber}
      </td>
      <td style={styles.bankFieldData}>
        {accountNumber}
      </td>
    </tr>
    <tr style={styles.tr}>
      <td style={styles.bankField}>
        {Labels.bankName}
      </td>
      <td style={styles.bankFieldData}>
        {bankName}
      </td>
    </tr>
    <tr style={styles.tr}>
      <td style={styles.bankField}>
        {Labels.bankAddress}
      </td>
      <td style={styles.bankFieldData}>
        {bankAddress}
      </td>
    </tr>
    {bankRoutingACH && <tr style={styles.tr}>
      <td style={styles.bankField}>
        {Labels.bankRoutingACH}
      </td>
      <td style={styles.bankFieldData}>
        {bankRoutingACH}
      </td>
    </tr>}
    {bankRoutingWires && <tr style={styles.tr}>
      <td style={styles.bankField}>
        {Labels.bankRoutingWires}
      </td>
      <td style={styles.bankFieldData}>
        {bankRoutingWires}
      </td>
    </tr>}
    {bankSWIFT && <tr style={styles.tr}>
      <td style={styles.bankField}>
        {Labels.bankSWIFT}
      </td>
      <td style={styles.bankFieldData}>
        {bankSWIFT}
      </td>
    </tr>}
    {bankExtra && <tr style={styles.tr}>
      <td style={styles.bankField}>
        {Labels.bankExtra}
      </td>
      <td style={styles.bankFieldData}>
        {bankExtra}
      </td>
    </tr>}
  </table>;
}

export function WireInstructions(props: { stylesOverride?: style; receivingBankId?: IReceivingBank['id'] }) {
  const mergedStyles: style = {
    ...rootStyles,
    ...props?.stylesOverride,
  };
  const { receivingBank } = useReceivingBank(props?.receivingBankId);
  return <WireInstructionsTable stylesOverride={mergedStyles} receivingBank={receivingBank} />;
}
