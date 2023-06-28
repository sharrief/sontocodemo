/* eslint-disable no-await-in-loop */
/* eslint-disable class-methods-use-this */
import ReactDOMServer from 'react-dom/server';
import 'reflect-metadata';
import { info } from '@log';
import { Statements, Users } from '@repositories';
import { API } from '@api';
import { getConnection } from '@lib/db';
import env from '@lib/env';
import { sleep } from '@lib/util';
import { Emailer } from '@lib/email';
import {
  statementGeneratedEmailTemplate, oldStatementPopulatedEmailTemplate,
} from '@email';
import { DateTime } from 'luxon';
import type { SessionSocket } from '@types';
import { getOldStatementPoupulatedEmailSubject, getStatementPopulatedEmailSubject } from 'shared/email/labels';

export async function populate(
  socket: SessionSocket,
  body: Parameters<typeof API.Statements.Populate.emit>[0],
) {
  try {
    const authUser = socket.request?.user?.authUser;
    if (!authUser) throw new Error('The user was missing on the request.');
    const authUserId = authUser.id;
    const {
      monthAndYear, userIds, sendEmails, emailType, ccManager,
    } = body;
    const connection = await getConnection();
    const statementsRepo = connection.getCustomRepository(Statements);
    API.Statements.PopulateStarted.serverEmit(socket);
    const { error, statements } = await statementsRepo.generate({
      authUserId,
      userIds,
      monthAndYear,
      onEachStatement: (statement) => {
        API.Statements.PopulatedStatement.serverEmit(socket, statement);
      },
      onEachStatementError: (err) => {
        API.Statements.PopulateInfo.serverEmit(socket, err);
      },
    });
    if (error) {
      API.Statements.PopulateError.serverEmit(socket, error);
    }
    API.Statements.PopulateComplete.serverEmit(socket);

    if (sendEmails) {
      const usersRepo = connection.getCustomRepository(Users);
      const Email = new Emailer();
      API.Statements.EmailStarted.serverEmit(socket, {
        total: statements?.length,
        eachMS: 3000,
      });
      for (let statementIndex = 0; statementIndex < statements.length; statementIndex += 1) {
        const statement = statements[statementIndex];
        const { userId, month, year } = statement;
        const date = DateTime.fromObject({ month, year }).toFormat('MMMM yyyy');
        try {
          const account = await usersRepo.getUserById({ authUserId, id: userId });
          if (account.closed || account?.email?.endsWith('closed') === true || account?.email?.endsWith('pending') === true) {
            API.Statements.EmailSent.serverEmit(socket, { userId: account.id, emailed: false });
            API.Statements.PopulateInfo.serverEmit(socket, `Did not send the ${date} statement email for account ${account.displayName} (${account.accountNumber}) as the account is closed`);
          } else {
            const manager = await usersRepo.getUserById({ authUserId, id: account.fmId });
            const oldEmailTemplateArgs = {
              name: account.displayName,
              accountNumber: account.accountNumber,
              dateString: date,
              host: account.hasAccountsAccess ? env.var.SITE_HOST : env.var.SITE_HOST_2,
            };
            const emailTemplate = emailType === 'text'
              ? statementGeneratedEmailTemplate({
                statement, manager, ps: '',
              })
              : oldStatementPopulatedEmailTemplate(oldEmailTemplateArgs);
            const subject = emailType === 'text'
              ? getStatementPopulatedEmailSubject(date)
              : getOldStatementPoupulatedEmailSubject(oldEmailTemplateArgs.dateString);
            const mail = {
              to: `${account.displayName} <${account.email}>`,
              cc: ccManager ? `${manager.username} <${manager.email}>` : '',
              subject,
              emailTemplate,
              sendingFunction: 'StatementsSockets.populate',
            };
            try {
              info(`Auth user ${authUserId} generated statement and emails for ${date} for account ${account.accountNumber}`);
              await sleep(3000); // O365 has max 30 msg/min max before throttling, so smallest sleep here is 2000ms
              const result = await Email.sendMail(mail);
              API.Statements.EmailSent.serverEmit(socket, { userId: account.id, emailed: !!result?.messageId });
            } catch ({ message: sendError }) {
              API.Statements.PopulateError.serverEmit(socket, `There was an error sending the ${date} statement email for account ${account.accountNumber}: ${sendError}`);
            }
          }
        } catch ({ message: prepError }) {
          API.Statements.PopulateError.serverEmit(socket, `There was an error preparing the ${date} statement email for account ${statement.userId}: ${prepError}`);
        }
      }
      API.Statements.EmailComplete.serverEmit(socket);
    }
  } catch ({ message: error }) {
    API.Statements.PopulateError.serverEmit(socket, error);
  }
}
