import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';
import { DateTime } from 'luxon';
import logo from '@brand/images/logo-cropped.png';
import mail from '@client/images/mail-black-18dp/2x/baseline_mail_black_18dp.png';
import accountIcon from '@client/images/account_balance_wallet-black-18dp/2x/baseline_account_balance_wallet_black_18dp.png';
import {
  formats, currency, amount,
} from '@helpers';
import {
  IExpandedStatement, ITrade, IUserTrimmed, OperationType,
} from '@interfaces';
import { statementDetailsLabels as labels } from '@client/js/labels';
import Brand from '@brand/brandLabels';

export const StatementDetailsPDF = (props: {
  statements: IExpandedStatement[]; trades: ITrade[]; account: IUserTrimmed; month: number; year: number,
  siteUrl: string
}) => {
  const {
    statements, trades, account, month, year, siteUrl,
  } = props;
  const {
    email, name, lastname, businessEntity, accountNumber,
  } = account;

  if (!statements || !trades || !account || !month || !year) return <Document subject={`${Brand.ShortName} ${labels.AccountStatement}`}></Document>;

  const toLuxonDate = function extractMomentDate({
    day: d,
    month: m,
    year: y,
  }: Pick<ITrade, 'day' | 'month' | 'year'>) {
    return DateTime.fromFormat(`${d}-${m}-${y}`, 'd-M-yyyy');
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statement = statements?.find((s) => (
    s.month === month && s.year === year
  ));

  const {
    grossReturn,
    feeTotal: feeTotalAbs,
    operations,
  } = statement;
  const feeTotal = -Math.abs(feeTotalAbs);
  const feeRate = feeTotal / grossReturn;
  const tradeLines = trades && trades
    .filter(({ month: tMonth, year: tYear }) => (month === tMonth && year === tYear))
    .sort((a, b) => (toLuxonDate(a) > (toLuxonDate(b)) ? 1 : -1));
  const statementOperations = operations && operations
    .filter(({ month: m, year: y }) => (year === y && month === m));
  const transLines = statementOperations;
  const debitsTotal = statementOperations
    .filter(({ amount: a }) => a < 0)
    .reduce((total, { amount: a }) => total + a, 0);
  const creditsTotal = statementOperations
    .filter(({ amount: a }) => a > 0)
    .reduce((total, { amount: a }) => total + a, 0);
  const totalTransactions = creditsTotal + debitsTotal + feeTotal;
  const statementMonth = DateTime.fromFormat(`${statement.month}-${statement.year}`, 'M-yyyy');
  const statementStartDate = statementMonth.startOf('month').toFormat(formats.lastStatementDate);
  const statementEndDate = statementMonth.endOf('month').toFormat(formats.lastStatementDate);
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      flexGrow: 1,
      padding: 30,
    },
    pageHeaderCol: {
      flexDirection: 'column',
      flex: 1,
    },
    pageHeaderRow: {
      flexDirection: 'row',
      flex: 1,
      justifyContent: 'space-between',
    },
    companyHeaderCol: {
      flexDirection: 'column',
      flex: 1,
    },
    companyHeaderAddress: {
      fontSize: 8,
      paddingLeft: 10,
    },
    companyHeaderText: {
      fontSize: 10,
    },
    customerServiceContainer: {
      marginTop: 5,
    },
    accountInfoRow: {
      flexDirection: 'row',
      flexGrow: 1,
    },
    logo: {
      width: 150,
    },
    header: {
      fontSize: '2em',
      paddingBottom: 5,
    },
    container: {
      flex: 1,
      flexDirection: 'column',
    },
    accountStatementLine: {
      flexDirection: 'row',
      fontWeight: 'light',
      justifyContent: 'space-between',
      borderBottom: '1px solid black',
      paddingBottom: 4,
      paddingTop: 4,
    },
    accountStatementLineDataLabel: {
      textAlign: 'right',
    },
    table: {
      borderLeft: 0,
      borderRight: 0,
    },
    tableCell: {
      borderLeft: 0,
      borderRight: 0,
      paddingTop: 3,
      paddingBottom: 3,
    },
  });
  const summaryLine = (label: string, data: string) => (
    <View style={styles.accountStatementLine}>
      <Text>
        {label}
      </Text>
      <Text>{data}</Text>
    </View>
  );
  if (!(month && year && accountNumber)) return null;
  return (
    <Document subject={`${Brand.ShortName} ${labels.AccountStatement}`}>
      <Page style={{
        flexDirection: 'column',
        flexGrow: 1,
        padding: 30,
      }}>
        <View style={{ flexDirection: 'column' }}>
          <View style={{ flexDirection: 'row', marginBottom: 40 }}>
            <View style={{ flexDirection: 'column', flex: 1 }}>
              <Image src={logo} style={styles.logo} />
              <View style={styles.companyHeaderAddress} >
                <Text>{Brand.FullName}</Text>
                <Text>{Brand.StatementAddress.street}</Text>
                <Text>{Brand.StatementAddress.city}, {Brand.StatementAddress.state}</Text>
                <Text>{Brand.StatementAddress.country}</Text>
              </View>
            </View>
            <View style={{
              flexDirection: 'column',
              alignContent: 'flex-end',
              paddingTop: 35,
              fontSize: 8,
            }}>
              <Text style={{ fontSize: 10, fontWeight: 300 }}>
                {labels.CustomerService}
              </Text>
              <View style={{ flexDirection: 'row' }} >
                <Image src={mail} style={{ width: 10, height: 10, marginRight: 5 }} />
                <Text>{Brand.AdminEmail}</Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: 300, marginTop: 5 }}>
                {labels.AccessYourAccount}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <Image src={accountIcon} style={{ width: 10, height: 10, marginRight: 5 }} />
                <Text>{siteUrl}</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'column' }}>
            <View style={{ paddingLeft: 25 }}>
              {businessEntity
                ? <Text style={styles.companyHeaderText}>{businessEntity}</Text>
                : <Text style={styles.companyHeaderText}>{`${name} ${lastname}`}</Text>
              }
              <Text style={styles.companyHeaderText}>Account No. {accountNumber}</Text>
              {businessEntity ? <Text style={styles.companyHeaderText}>{`${name} ${lastname}`}</Text> : null}
              <Text style={styles.companyHeaderText}>{email}</Text>
            </View>
          </View>
        </View>
        <View style={{
          flexDirection: 'column',
          padding: '10 0 10 0',
          borderTop: '1px solid gray',
          borderBottom: '1px solid gray',
          margin: '30 0 30 0',
          fontSize: 11,
          color: '#666',
        }}>
          <Text style={{ textAlign: 'center', fontSize: 14, paddingBottom: 3 }}>Disclaimer</Text>
          <Text>{Brand.StatementMessage}</Text>
        </View>
        <View style={{
          flexDirection: 'row', fontSize: 10,
        }}>
          <View style={{
            padding: 10, borderRadius: 4, backgroundColor: 'rgb(248, 245, 240)', flexDirection: 'column', width: '65%',
          }}>
            <Text style={{ fontWeight: 'extrabold', paddingBottom: 3, fontSize: 14 }}>{labels.YourAccount}</Text>
            <Text style={{ paddingBottom: 3 }}>
              for {statementStartDate} to {statementEndDate}
            </Text>
            <Text style={{ fontWeight: 'heavy', paddingBottom: 3, fontSize: 12 }}>{
              businessEntity || `${name} ${lastname}`
            }</Text>
            <Text style={{ paddingBottom: 5, fontSize: 12, color: 'rgb(124, 65, 33)' }}>{labels.AccountSummary}</Text>
            {summaryLine(`${labels.StartingBalance} ${statementStartDate}`, amount(statement.openingBalance))}
            {summaryLine(labels.DividendAmount, amount(grossReturn))}
            {summaryLine(labels.FeesAmount, amount(feeTotal))}
            {summaryLine(labels.Credits, amount(creditsTotal))}
            {summaryLine(labels.Distributions, `${amount(debitsTotal)}`)}
            <View style={styles.accountStatementLine}>
              <Text style={{ fontWeight: 'heavy', fontSize: 12, color: 'rgb(50, 93, 136)' }}>
                {`${labels.EndingBalance} on ${statementEndDate}`}
              </Text>
              <Text style={{ fontWeight: 'heavy', fontSize: 12, color: 'rgb(50, 93, 136)' }}>
                {currency(statement.endBalance)}
              </Text>
            </View>
          </View>
        </View>
        <View style={{
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'flex-end',
        }}>
          <View style={{
            flexDirection: 'row',
            borderTop: '1px solid black',
            justifyContent: 'space-between',
            paddingTop: 5,
            fontSize: 8,
          }}>
            <Text>All amounts are denominated in USD</Text>
            <Text>Page 1 of 2</Text>
          </View>
        </View>
      </Page>
      <Page style={styles.page}>
        <View style={{
          flexDirection: 'row',
          borderBottom: '1px solid black',
          paddingBottom: 3,
          fontSize: 8,
        }}>
          <Text>{businessEntity || `${name} ${lastname}`}</Text>
          <Text style={{ margin: '0 5 0 5' }}>|</Text>
          <Text>Account # {accountNumber}</Text>
          <Text style={{ margin: '0 5 0 5' }}>|</Text>
          <Text>{statementStartDate} to {statementEndDate}</Text>
        </View>
        <View style={{ flexDirection: 'column', marginTop: 15 }}>
          <Text style={{
            fontSize: 16,
            color: 'rgb(124, 65, 33)',
            marginBottom: 5,
          }}>{labels.TradeActivity}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{
              flexDirection: 'column',
            }}>
              <View style={{
                flexDirection: 'row',
                fontSize: 12,
                borderBottom: '1px solid black',
                paddingBottom: 5,
              }}>
                <Text>{labels.Date}</Text>
              </View>
              {tradeLines.map((trade) => (
                <View key={trade.id} style={{
                  flexDirection: 'row',
                  flexGrow: 1,
                  fontSize: 10,
                  padding: '3 0 3 0',
                  borderBottom: '1px solid black',
                }}>
                  <Text>{toLuxonDate(trade).toFormat(formats.statementLineDate)}</Text>
                </View>))
              }
            </View>
            <View style={{ flexDirection: 'column', flexGrow: 1 }}>
              <View style={{
                flexDirection: 'row',
                fontSize: 12,
                borderBottom: '1px solid black',
                padding: '0 0 5 30',
              }}>
                <Text>{labels.Description}</Text>
              </View>
              {tradeLines.map((trade) => (
                <View key={trade.id} style={{
                  flexDirection: 'row',
                  flexGrow: 1,
                  fontSize: 10,
                  padding: '3 0 3 30',
                  borderBottom: '1px solid black',
                }}>
                  <Text>{labels.PositionDescription}{trade.currency}</Text>
                </View>))
              }
            </View>
            <View style={{ flexDirection: 'column' }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                fontSize: 12,
                borderBottom: '1px solid black',
                paddingBottom: 5,
              }}>
                <Text>{labels.Amount}</Text>
              </View>
              {tradeLines.map((trade) => (
                <View key={trade.id} style={{
                  flexDirection: 'row',
                  flexGrow: 1,
                  fontSize: 10,
                  padding: '3 0 3 30',
                  borderBottom: '1px solid black',
                  justifyContent: 'flex-end',
                }}>
                  <Text>
                    {amount((statement.openingBalance) * ((trade.interest / 100) / (1 - Math.abs(feeRate || 0))))}</Text>
                </View>))
              }
            </View>
          </View>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'rgb(50, 93, 136)',
            padding: '5 0 0 0',
          }}>
            <Text>{labels.DividendAmount}</Text>
            <Text>{currency(statement.grossReturn)}</Text>
          </View>
        </View>
        <View style={{ marginTop: 15 }}>
          <Text style={{
            fontSize: 16,
            color: 'rgb(124, 65, 33)',
            marginBottom: 5,
          }}>{labels.TransactionActivity}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{
              flexDirection: 'column',
            }}>
              <View style={{
                flexDirection: 'row',
                fontSize: 12,
                borderBottom: '1px solid black',
                paddingBottom: 5,
              }}>
                <Text>{labels.Date}</Text>
              </View>
              {transLines.map((trans) => (
                <View key={trans.id} style={{
                  flexDirection: 'row',
                  flexGrow: 1,
                  fontSize: 10,
                  padding: '3 0 3 0',
                  borderBottom: '1px solid black',
                }}>
                  <Text>{toLuxonDate(trans).toFormat(formats.statementLineDate)}</Text>
                </View>))
              }
            </View>
            <View style={{ flexDirection: 'column', flexGrow: 1 }}>
              <View style={{
                flexDirection: 'row',
                fontSize: 12,
                borderBottom: '1px solid black',
                padding: '0 0 5 30',
              }}>
                <Text>{labels.Description}</Text>
              </View>
              {transLines.map((trans) => (
                <View key={trans.id} style={{
                  flexDirection: 'row',
                  flexGrow: 1,
                  fontSize: 10,
                  padding: '3 0 3 30',
                  borderBottom: '1px solid black',
                }}>
                  <Text>{trans.type === OperationType.Credit
                    ? labels.DepositCredit
                    : labels.WithdrawalDebit}</Text>
                </View>))
              }
            </View>
            <View style={{ flexDirection: 'column' }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                flexGrow: 1,
                fontSize: 12,
                borderBottom: '1px solid black',
                paddingBottom: 5,
              }}>
                <Text>{labels.Amount}</Text>
              </View>
              {transLines.map((trans) => (
                <View key={trans.id} style={{
                  flexDirection: 'row',
                  flexGrow: 1,
                  fontSize: 10,
                  padding: '3 0 3 0',
                  borderBottom: '1px solid black',
                  justifyContent: 'flex-end',
                }}>
                  <Text>{amount(trans.amount)}</Text>
                </View>))
              }
            </View>

          </View>
          {/* Fee line */}
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{
              flexDirection: 'row',
              fontSize: 10,
              padding: '3 0 3 0',
              borderBottom: '1px solid black',
            }}>
              <Text>{statementMonth.toFormat(formats.statementLineDate)}</Text>
            </View>
            <View style={{
              flexDirection: 'row',
              flexGrow: 1,
              fontSize: 10,
              padding: '3 0 3 30',
              borderBottom: '1px solid black',
            }}>
              <Text>{labels.IncentiveFee}</Text>
            </View>
            <View style={{
              flexDirection: 'row',
              fontSize: 10,
              padding: '3 0 3 0',
              borderBottom: '1px solid black',
              justifyContent: 'flex-end',
            }}>
              <Text>{amount(feeTotal)}</Text>
            </View>
          </View>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'rgb(50, 93, 136)',
            padding: '5 0 0 0',
          }}>
            <Text>{labels.TotalCreditsAndDebits}</Text>
            <Text>{currency(totalTransactions)}</Text>
          </View>
        </View>
        <View style={{
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'flex-end',
        }}>
          <View style={{
            flexDirection: 'row',
            borderTop: '1px solid black',
            justifyContent: 'space-between',
            paddingTop: 5,
            fontSize: 8,
          }}>
            <Text>All amounts are denominated in USD</Text>
            <Text>Page 2 of 2</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

StatementDetailsPDF.displayName = 'StatementDetails';

export default (StatementDetailsPDF);
