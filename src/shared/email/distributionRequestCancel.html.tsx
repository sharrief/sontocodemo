import React from 'react';
import { IRequest, RequestStatus } from '@interfaces';

export const generateDistributionRequestCancelTemplate = (
  request: IRequest,
  siteUrl: string,
  sender: string,
  ps?: string,
  displayName?: string,
) => {
  const psTemplate = ps ? <>
    <p>P.S. {ps}</p>
    <p>- {displayName}</p>
  </> : null;
  const emailTemplate = <html>
    <p>Greetings,</p>
    <p>{request.status === RequestStatus.Recurring ? 'Recurring distribution' : 'Distribution'} request #{request.id} has been cancelled.</p>
    <p>For more information, please sign into your account at <a href={siteUrl}>{siteUrl}</a>.</p>
    <p>Regards,</p>
    <p>The Administration Team</p>
    {psTemplate}
  </html>;

  return emailTemplate;
};
