import React from 'react';

export function GenerateApplicationCompleteEmailTemplate({
  name,
}: {
  name: string;
}) {
  const emailTemplate = <html>
    <p>Thank you {name}
      ,</p>
    <p>To finalize your application please ensure you have signed the digital application document using DocuSign. You may have already done this immediately after completing your application.</p>
    <p>If you did not sign the application using DocuSign, please check your email inbox for a message from DocuSign. The message will contain a link you can use to sign the application. DocuSign will automatically send us the application after you sign it, but you may wish to save the application for your records.</p>
    <p>After we receive your completed and signed application, we will review it and inform you of any other information that may be necessary. If no other information is necessary, then you will soon receive an email with instructions on setting up your account.</p>
    <p>Please feel free to contact us if you have any issues or questions.</p>
    <p>Regards,</p>
    <p>The Administration team</p>
  </html>;
  return emailTemplate;
}
