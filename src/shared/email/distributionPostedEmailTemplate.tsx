import React from 'react';
import { IRequest } from '@interfaces';

export function distributionPostedEmailTemplate({
  requestId, siteUrl, ps, displayName,
}: {
  requestId: IRequest['id'];
  siteUrl: string;
  ps?: string;
  displayName?: string;
}) {
  const psTemplate = ps ? <>
    <p>P.S. {ps}</p>
    <p>- {displayName}</p>
  </> : null;
  const emailTemplate = <html>
    <p>Greetings,</p>
    <p>We have processed your distribution request #{requestId}.</p>
    <p>For more information, please sign into your account at <a href={siteUrl}>{siteUrl}</a>.</p>
    <p>Regards,</p>
    <p>The Administration Team</p>
    {psTemplate}
  </html>;

  return emailTemplate;
}
