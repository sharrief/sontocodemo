import { API } from '@api';
import { AdminThunk } from '@admin/admin.store';
import { admin } from '@admin/admin.reducers';
import { PortfolioStatementsSlice } from '@admin/Portfolio/Portfolio.Accounts.Slice';
import { DateTime } from 'luxon';

export const generatePortfolioStatements: AdminThunk<void> = () => (dispatch, getState) => {
  const {
    portfolioStatementsState: {
      selectedAccounts,
      filteredMonthIds,
      sendEmails,
      emailType,
      ccManager,
    },
  } = getState();
  const { actions } = PortfolioStatementsSlice;

  if (selectedAccounts?.length && filteredMonthIds?.length) {
    const date = DateTime.fromMillis(Math.min(...filteredMonthIds));
    const data = {
      sendEmails,
      emailType,
      ccManager,
      userIds: selectedAccounts,
      monthAndYear: {
        month: date.month,
        year: date.year,
      },
    };
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
      dispatch(actions.statementEmailStarted(estimates));
    });

    API.Statements.EmailSent.on(() => {
      // console.log(`${emailedClient.emailed ? 'Sent' : 'Did not send'} statement population email to ${emailedClient.userId}`);
      dispatch(actions.statementEmailSent());
    });

    API.Statements.EmailComplete.on(() => {
      dispatch(actions.statementEmailComplete());
    });

    API.Statements.Populate.emit(data);
  }
};
