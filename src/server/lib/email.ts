import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { getErrorEmailTemplate } from '@email';
import env from './env';

interface SMTPError extends NodeJS.ErrnoException {
  /** string code identifying the error, for example ‘EAUTH’ is returned when authentication */
  code?: string;
  /** the last response received from the server (if the error is caused by an error response from the server) */
  response?: string;
  /** the numeric response code of the response string (if available) */
  responseCode?: number;
  /** command which provoked an error */
  command?: string;
}

interface SentMessageInfo {
   /** most transports should return the final Message-Id value used with this property */
   messageId: string;
  /** an array of accepted recipient addresses. Normally this array should contain at least one address except when in LMTP mode. In this case the message itself might have succeeded but all recipients were rejected after sending the message. */
  accepted: string[];
  /** an array of rejected recipient addresses. This array includes both the addresses that were rejected before sending the message and addresses rejected after sending it if using LMTP */
  rejected: string[];
  /** if some recipients were rejected then this property holds an array of error objects for the rejected recipients */
  rejectedErrors?: SMTPError[];
  /** the last response received from the server */
  response: string;
  /** how long was envelope prepared */
  envelopeTime: number;
  /** how long was send stream prepared */
  messageTime: number;
  /** how many bytes were streamed */
  messageSize: number;
}

export class Emailer {
  private transporter = nodemailer.createTransport({
    host: env.var.EMAIL_SERVER || 'smtp.office365.com',
    port: env.var.EMAIL_PORT || 587,
    requireTLS: true,
    tls: {
      minVersion: 'TLSv1.2',
      ciphers: 'ECDHE-RSA-AES256-GCM-SHA384',
    },
    auth: {
      user: env.var.EMAIL_USER,
      pass: env.var.EMAIL_PASS,
    },
  });

  async sendMail(sendMailArgs: Omit<Mail.Options, 'from'|'replyTo'|'text'|'email'> & {
    sendingFunction: string;
    emailTemplate: JSX.Element
   }): Promise<SentMessageInfo> {
    let errorMessage = '';
    if (!sendMailArgs.emailTemplate) {
      errorMessage = `${sendMailArgs.sendingFunction}: Email template was missing`;
    }
    if (!sendMailArgs.to) {
      errorMessage = `${sendMailArgs.sendingFunction}: Email recipient was missing`;
    }
    if (errorMessage) {
      return this.transporter.sendMail({
        headers: {
          'X-MC-PreserveRecipients': 'true',
        },
        subject: 'Error sending email',
        from: env.var.EMAIL_FROM,
        to: env.var.EMAIL_DEV,
        html: ReactDOMServer.renderToStaticMarkup(getErrorEmailTemplate(errorMessage)),
      });
    }
    const html = ReactDOMServer.renderToStaticMarkup(sendMailArgs.emailTemplate);
    const result = await this.transporter.sendMail({
      headers: {
        'X-MC-PreserveRecipients': 'true',
      },
      from: env.var.EMAIL_FROM,
      replyTo: env.var.EMAIL_REPLY_TO,
      ...sendMailArgs,
      html,
      to: (env.isProduction) ? sendMailArgs.to : env.var.EMAIL_TEST_CLIENT,
      cc: (env.isProduction) ? sendMailArgs.cc || undefined : env.var.EMAIL_DEV,
      bcc: (env.isProduction) ? sendMailArgs.bcc || undefined : undefined,
    });
    return result;
  }
}
