import React from 'react';
import { IRequest } from '@interfaces';
import { DateTime } from 'luxon';
import Brand from '@brand/brandLabels';

export const generateDistributionRequestMadeRecurringTemplate = (
  request: IRequest,
  siteUrl: string,
  effectiveDate: DateTime,
) => {
  const emailTemplate = <html>
    <p>Greetings,</p>
    <p>We have updated distribution request #{request.id} to a monthly recurring distribution effective end of {effectiveDate.toFormat('MMMM yyyy')}.</p>
    <p>For more information, please sign into your account at <a href={siteUrl}>{siteUrl}</a>.</p>
    <p>Regards,</p>
    <p>The Administration Team</p>
  </html>;
  const subject = `${Brand.ShortName} distribution request #${request.id}`;

  return emailTemplate;
};
