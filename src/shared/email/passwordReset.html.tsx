import React from 'react';

export function getPasswordResetTemplate(
  link: string, adminEmail: string,
) {
  const emailTemplate = (
    <>
      <p>Greetings,</p>
      <p>
        Your password reset has been initiated. If you did not request a password
        reset, please email <a href={`mailto:${adminEmail}`}>{adminEmail}0</a> immediately.
      </p>
      <p>
        You can use the link below to reset your password. Note that the link will
        expire in approximately 1 hour.
      </p>
      <p>
        {link}
      </p>
      <p>
        Regards,
      </p>
      <p>
        The Administration Team
      </p>
    </>
  );
  return emailTemplate;
}

export function getPasswordResetCompleteTemplate(adminEmail: string) {
  const emailTemplate = (
    <>
      <p>Greetings,</p>
      <p>
        Your password reset has been completed. If you did not request a password
        reset, please email <a href={`mailto:${adminEmail}`}>{adminEmail}</a> immediately.
      </p>
      <p>
        Regards,
      </p>
      <p>
        The Administration Team
      </p>
    </>
  );
  return emailTemplate;
}
