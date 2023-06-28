import Brand from '@brand/brandLabels';
import React from 'react';

export function GenerateAccountOpenedEmailTemplate({
  name, accountNumber, link,
}: {
  name: string;
  accountNumber: string;
  link: string;
}) {
  const emailTemplate = <html>
    <p>Congratulations {name},</p>
    <p>Your {Brand.ShortName} Account is ready! Your account number is {accountNumber}.</p>
    <p>You will need to set a password before signing in for the first time. Visit the link below to set your password.
    Note that the link will expire in 30 days.</p>
    <p>{link}</p>
    <p>Please feel free to contact us if you have any issues setting your password or accessing your account.</p>
    <p>Regards,</p>
    <p>The Administration team</p>
  </html>;
  return emailTemplate;
}
