import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { DateTime } from 'luxon';
import { IRequest, RequestStatus } from '@interfaces';

type DistributionEmailInput = {
  siteUrl: string;
  request: IRequest;
  sendBy: number;
};

export function distributionRequestedEmailTemplate({
  siteUrl, request, sendBy,
}: DistributionEmailInput) {
  const errorPrefix = 'Could not generate distribution request email template as';
  const errors = [];
  if (request.id == null || Number.isNaN(+request.id)) { errors.push('the request ID was missing'); }
  if (request.datetime == null || Number.isNaN(request.datetime)) { errors.push('the request datetime was missing'); }
  if (request.amount == null || Number.isNaN(+request.amount)) { errors.push('the request amount was not a number'); }
  if (errors.length > 0) throw new Error(`${errorPrefix} ${errors.join(', ')}.`);

  const date = DateTime.fromMillis(request.datetime);
  const sendDate = DateTime.fromMillis(sendBy);
  const emailTemplate = <html>
      <body>
        <p>Greetings,</p>
        <p>This email confirms that we {request.admin ? 'registered' : 'received your'} {request.status === RequestStatus.Recurring ? 'recurring ' : ''}distribution request #{request.id}.</p>
        <p>We will send your distribution via bank wire transfer to the bank account specified on your request. You should expect to receive this transfer by the end of {sendDate.isValid ? sendDate.toFormat('MMMM') : date.plus({ month: 1 }).toFormat('MMMM')}.</p>
        <p>You will receive another email when we send your transfer.</p>
        <p>For more information, please sign into your account at <a href={siteUrl}>{siteUrl}</a>.</p>
        <p>Regards,</p>
        <p>The Administration Team</p>
      </body>
    </html>;
  return emailTemplate;
}
