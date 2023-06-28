import { API } from '@api';
import { admin } from '@admin/admin.reducers';
import { PortfolioStatementsSlice } from '@admin/Portfolio/Portfolio.Accounts.Slice';
import { Dispatch } from 'redux';
import { handleMessageAndError } from '../admin.store';

export const populatePortfolioStatements = (args: {
  userIds: number[];
  monthAndYear: {month: number; year: number};
  sendEmails: boolean;
  dispatch: Dispatch;
}) => {
  const {
    userIds,
    monthAndYear,
    sendEmails,
    dispatch,
  } = args;

  const logMessage = (message: string) => handleMessageAndError({ message }, dispatch);
  const logSuccess = (message: string) => handleMessageAndError({ message, success: true }, dispatch);

  if (userIds?.length && monthAndYear) {
    const data = {
      sendEmails,
      emailType: 'old' as 'old'|'text',
      ccManager: false,
      userIds,
      monthAndYear,
    };

    const { actions } = PortfolioStatementsSlice;
    API.Statements.PopulateStarted.on(() => {
      // console.log('Population started');
      dispatch(actions.statementPopulationStarted());
    });
    API.Statements.PopulatedStatement.on((statement) => {
      // console.log(`Populated statement for ${statement.userId} ${statement.month}-${statement.year}`);
      dispatch(actions.statementPopulated(statement));
    });
    API.Statements.PopulateComplete.on(() => {
      // console.log('Population complete');
      logSuccess('Statement population complete!');
      dispatch(actions.statementPopulationComplete());
    });

    API.Statements.PopulateError.on((error) => {
      // console.log('Population error');
      dispatch(actions.statementPopulationComplete());
      dispatch(admin.actions.handleSocketError(error));
    });

    API.Statements.PopulateInfo.on((info) => {
      // console.log(`Population info ${info}`);
      dispatch(admin.actions.handleSocketInfo(info));
    });

    API.Statements.EmailStarted.on((estimates) => {
      logMessage('Sending population emails...');
      dispatch(actions.statementEmailStarted(estimates));
    });

    API.Statements.EmailSent.on(() => {
      // console.log(`${emailedClient.emailed ? 'Sent' : 'Did not send'} statement population email to ${emailedClient.userId}`);
      dispatch(actions.statementEmailSent());
    });

    API.Statements.EmailComplete.on(() => {
      logSuccess('Population emails sent!');
      dispatch(actions.statementEmailComplete());
    });

    API.Statements.Populate.emit(data);
  }
};
