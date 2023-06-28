import React from 'react';
import { DateTime } from 'luxon';
import { IStatement, IUser } from '@interfaces';

export function statementGeneratedEmailTemplate({
  statement: { month, year }, ps, manager: { displayName: manager },
}: {
  statement: Pick<IStatement, 'month'|'year'>;
  manager: Pick<IUser, 'displayName'>;
  ps?: string;
}) {
  const statementDate = DateTime.fromObject({ year, month }).toFormat('MMMM yyyy');

  const emailTemplate = <html>
    <p>Greetings,</p>

    <p>The {statementDate} statement is ready for account. You can sign in to your account to view your statement.</p>

    <p>Regards,</p>

    <p>The Administration team</p>
    <p>On behalf of {manager}</p>
    {ps ? <>
      <p>P.S. {ps}</p>
      <p>- {manager}</p>
    </> : null}
  </html>;
  return emailTemplate;
}

export function oldStatementPopulatedEmailTemplate({
  name, accountNumber, dateString, host,
}: {
  name: string;
  accountNumber: string;
  dateString: string;
  host: string;
}) {
  const emailTemplate = <html>
    <body style={{ background: '#fff', paddingLeft: '50px' }}>
      <img height="150" width="276" src={`${host}/images/logointerna.png`} />
      <p style={{ fontSize: '18px', padding: '30px', background: '#f9f9f9' }}>
        Hello {name}!<br /><br />
        Account number: {accountNumber} <br /><br />
        Your account was just populated. <br />
        Now you can see {dateString} report at <a href={host}>{host}</a><br />
      </p>
      <br />
    </body>
  </html>;
  return emailTemplate;
}

export function GenerateOldTextStatementEmail({
  name, accountNumber, dateString, host,
}: {
  name: string;
  accountNumber: string;
  dateString: string;
  host: string;
}) {
  return `Hello ${name}! 
Account number ${accountNumber} 
Your account was just populated 
Now you can see ${dateString} report at ${host}  `;
}
