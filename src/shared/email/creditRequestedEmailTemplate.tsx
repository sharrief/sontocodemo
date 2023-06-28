/* eslint-disable max-len */
import React from 'react';

export function creditRequestedEmailTemplate(siteUrl: string, creditRequestNumber?: number) {
  const emailTemplate = <html>
    <body>
      <p>Greetings,</p>
      <p>
        This email confirms that your credit request{creditRequestNumber ? '#{creditRequestNumber}' : ''} has been registered.
      </p>
      <p>
        You will receive another email when we confirm receipt of your transfer.
      </p>
      <p>For more information, please sign into your account at <a href={siteUrl}>{siteUrl}</a>.</p>
      <p>
        Regards,
      </p>
      <p>
        The Administration Team
      </p>
    </body>
  </html>;
  return emailTemplate;
}
