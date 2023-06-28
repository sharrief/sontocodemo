import { endpoints } from '@api';
import Brand from '@brand/brandLabels';
import useSiteMetadata from '@client/js/core/useSiteMetadata';
import React from 'react';

export function GenerateApplicationInvitationEmailTemplate({
  manager, name, PIN, email,
}: {
  name: string;
  email: string;
  manager: string;
  PIN: string;
}) {
  const { siteName, siteUrl } = useSiteMetadata();
  const path = `${siteUrl}/${endpoints.application}`;
  const emailTemplate = <html>
    <p>Greetings {name},</p>
    <p>You have been invited by {manager} to complete the {Brand.MidName} client application.</p>
    <p>To start the application go to <a href={path}>{path}</a> and enter the information provided below.</p>
    <p>email: {email}</p>
    <p>PIN: {PIN}</p>
    <p>Regards,</p>
    <p>The ${siteName} Administration team</p>
  </html>;
  return emailTemplate;
}
