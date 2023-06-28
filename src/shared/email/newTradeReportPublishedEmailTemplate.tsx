import React from 'react';
import { DateTime } from 'luxon';

export function newTradeReportPublishedEmailTemplate({
  user, month, year,
}: {
  user: string;
  month: number;
  year: number;
}) {
  const date = DateTime.fromObject({ month, year }).toFormat('MMMM yyyy');
  const emailTemplate = <html>
    <p>Attention Administrators</p>
    <p>{user} has published a new Trade Report for {date}.</p>
    <p>You (just Sharrief, for now) can review the new Trade Report and notify the account managers that their client accounts are ready to be populated.</p>
    <p>- The administration system</p>
  </html>;
  return emailTemplate;
}
