import {
  IRequest, IDocument, OperationType, RequestStatus,
} from '@interfaces';
import { Duration } from 'luxon';
import Brand from '@brand/brandLabels';
import { currency } from './core/helpers';

export const SiteTitle = Brand.MidName;
export const loginLabels = {
  title: `Sign into your ${Brand.ShortName} account`,
  noResponse: 'There was an error contacting the website. Please refresh your browser and try again.',
  serverError: `There was an error with the server while trying to login. If this error persists, please email ${Brand.AdminEmail}`,
  authFail: 'We were not able to sign you in. Please verify your information and try again',
  authSuccess: 'You\'re signed in. We are redirecting you to your account now',
  loggedOut: 'You\'ve been logged out',
  email: 'Email',
  emailPlaceholder: `Enter your ${Brand.ShortName} account email here`,
  password: 'Password',
  OTP: 'Code',
  passwordPlaceholder: `Enter your ${Brand.ShortName} account password here`,
  otpPlaceholder: 'Enter your code here',
  signIn: 'Sign in',
  prepareLogin: 'Preparing to log you in ',
};
export const passwordResetLabels = {
  title: `Reset your ${Brand.ShortName} Account password`,
  NewPassPlaceholder: 'Enter a new password',
  ConfirmPassPlaceholder: 'Enter the password again',
  ResetPassword: 'Reset password',
  Password: 'Password',
  ConfirmPassword: 'Confirm password',
  ResettingPassword: 'Resetting your password',
};
export const AlertLabels = {
  showAll: 'Show logs',
  Error: 'Error',
  Success: 'Success',
  Message: 'Message',
  hideAll: 'Hide logs',
};
export const menuLabels = {
  Brand: Brand.FullName,
  Settings: 'settings',
  PersonalInfo: 'my information',
  Preferences: 'preferences',
  ResetPassword: 'reset password',
  SecurityOptions: 'security options',
  ToggleTheme: 'night mode',
  Logout: 'log out',
  Loading: 'Loading',
  NoNav: 'Could not load navigation',
};
export const Navigation = {
  accounts: 'Accounts',
  administration: 'Administration',
};
export const documentLabels = {
  credit: 'Credit Request email',
  distribution: 'Distribution Request email',
};
export const accountStatementsLabels = {
  NoStatements: 'No statements were found',
  LoadingStatements: 'Loading statements...',
  Heading: 'Statements',
  Settings: 'Settings',
  PendingOps: 'Pending operations',
  PendingBal: 'Pending balance',
  LastStatementReturn: 'Latest',
  YTDReturn: 'YTD',
  RunningYearROI: 'Last 12',
  LifetimeReturn: 'Lifetime',
  InfoClickStatement: 'Click on a statement date to see more details.',
  BalanceHeader: 'as of {1}',
  Statements: {
    Download: 'Download',
    Email: 'E-mail',
    Date: 'Date',
    GrossReturn: 'Gross return',
    NetDividend: 'Net dividend',
    DividendAmount: 'Dividend',
    Credits: 'Credits',
    Distributions: 'Distributions',
    ClosingBalance: 'Ending balance',
    OpeningBalance: 'Opening balance',
    NetChange: 'Net change',
    NetReturn: 'Net return',
    PerformanceFee: 'Fee',
    HighwaterMark: 'Highwater Mark',
  },
  LoadingDetails: 'Loading statement...',
};

export const dashboardLabels = {
  MyAccounts: 'My accounts',
  Loading: 'Loading',
  NoManager: 'No manager found',
  TabTitleStatements: 'Statements',
  TabTitleActivity: 'Transfers',
  TabTitleInformation: 'Information',
  TabTitleBankAccounts: 'Bank info',
  WelcomeMessages:
    [
      'Looking good',
      'Welcome back',
      'Good day',
      'Godspeed',
      "All's well",
    ],
  WelcomeQuotes:
    [
      {
        msg: '"Wide diversification is only required when investors do not understand what they are doing."',
        author: '- Warren Buffet',
      },
      {
        msg: '"I would not pre-pay. I would invest instead and let the investments cover it."',
        author: '- Dave Ramsey',
      },
      {
        msg: '"An investment in knowledge pays the best interest."',
        author: '- Benjamin Franklin',
      },
      {
        msg: '"With a good perspective on history, we can have a better understanding of the past and present, and thus a clear vision of the future."',
        author: '- Carlos Slim Helu',
      },
      // {
      //   msg: '"It\'s not whether you\'re right or wrong that\'s important, but how much money you make when you\'re right and how much you lose when you\'re wrong."',
      //   author: '- George Soros',
      // },
      {
        msg: '"I don\'t look to jump over seven-foot bars; I look around for one-foot bars that I can step over."',
        author: '- Warren Buffet',
      },
      {
        msg: '"How many millionaires do you know who have become wealthy by investing in savings accounts? I rest my case."',
        author: '- Robert G. Allen',
      },
      {
        msg: '"The individual investor should act consistently as an investor and not as a speculator."',
        author: '- Ben Graham',
      },
    ],
  prefix: [
    'Mr.',
    'Ms.',
    'Mrs.',
    'Dr.',
  ],
};
export const statementDetailsLabels = {
  Loading: 'Loading the statement details',
  DownloadStatement: 'Download statement for',
  NoStatement: 'No statement was loaded',
  StatementDetails: 'Statement details',
  AccountStatement: 'Account statement',
  YourAccount: 'Your Account Statement',
  AccountSummary: 'Statement summary',
  Date: 'Date',
  Description: 'Description',
  Note: 'Note',
  Percentage: 'Dividend percentage',
  Net: 'Net gain/loss from investment activity',
  PositionDescription: 'Position opened & closed: ',
  Amount: 'Amount',
  DividendAmount: 'Gross gain/loss from investment activity',
  OperationAmount: 'Operation',
  Credits: 'Deposits and other credits',
  Distributions: 'Distributions and other debits',
  FeesAmount: 'Incentive fees (30% of gross gain/loss)',
  IncentiveFee: 'Incentive fee',
  StartingBalance: 'Beginning balance on',
  EndingBalance: 'Ending balance on',
  Total: 'Total',
  TradeActivity: 'Trade activity',
  TransactionActivity: 'All other activity',
  DepositCredit: 'Deposit credit',
  WithdrawalDebit: 'Distribution debit',
  TotalTradeActivity: 'Total investment activity gain/loss',
  TotalCreditsAndDebits: 'Total of transfers and other activity',
  CustomerService: 'Email us questions about your statement',
  AccessYourAccount: 'Access your account at',
  StatementFooterMessage: 'All amounts are denominated in USD',
};
export const dropDownLabels = {
  filterPlaceholder: 'Type to filter...',
  NoManager: 'No manager for this account',
};
export const transactionLabels = {
  Heading: 'Activity',
  Settings: 'Settings',
  HeadingCredits: (amount: string) => `Credits: ${amount}`,
  HeadingDebits: (amount: string) => `Distributions: ${amount}`,
  PendingBal: 'Pending balance',
  PendingActivity: 'Pending activity',
  PostedActivity: 'Posted activity',
  InfoClickStatement: 'Click on a statement date to see more details.',
  NewCreditRequest: 'New credit request',
  DepositDialogHeader: 'Submit a credit request',
  WithdrawalDialogHeader: 'Submit a distribution request',
  Deposit: 'Deposit',
  StartDeposit: 'Start deposit',
  Withdraw: 'Withdraw',
  StartWithdrawal: 'Start withdrawal',
  SendEmail: 'Send request confirmation email',
  OK: 'OK',
  Submit: 'Submit',
  Cancel: 'Cancel',
  Success: 'Done!',
  Error: 'Error!',
  NewDebitRequest: 'New distribution request',
  DepositInstructions: 'Submitting a credit request informs us of your intention to deposit to the account, and provides us with notice to expect the transfer.',
  WithdrawalInstructions: 'Submitting a distribution request informs us of your intention to withdraw from the account at the end of the investment month, and provides us with the banking information that we need to send the transfer',
  ConfirmWithdrawal: 'Once you submit the distribution request you will not be able to change the specified bank account. You will need to cancel the request and submit a new one to change the bank account.',
  ConfirmWithdrawalBank: 'I understand',
  DepositAmount: 'Amount',
  DepositAmountInstruction: 'Specify the amount of the transfer that we should be expecting:',
  WithdrawalAmountInstruction: 'Specify the amount of the withdrawal:',
  WithdrawalAmountInvalid: 'Enter an amount in USD greater than 0',
  WithdrawalAmountTooGreat: (date?: string) => `This amount exceeds your ${date ?? 'current'} account balance. Please specify a lesser amount`,
  WithdrawalFees: 'Our bank may charge a fee for sending the transfer. This fee will be assessed to the account so that the transfer we send is the full amount of your request. Your bank (or intermediate banks) may take additional fees from the transfer amount.',
  WireInstructions: `Send your deposit to ${Brand.ShortName} using this banking transfer information.`,
  AfterWireInstructions: `After sending your deposit using the information above, check the box below then press the Submit button. This will notify ${Brand.ShortName} that you have sent your transfer and that we should start monitoring our account for a transfer in the specified amount.`,
  ConfirmWireSent: 'I confirm I have sent the transfer',
  ConfirmWireSentValidation: 'You should send your transfer before submitting the credit request, unless otherwise instructed by your account manager',
  EmailWireInstructions: 'Email the wire instructions',
  EmailWithdrawalInstructions: 'Email the withdrawal confirmation',
  BankInfoInstructions: 'Select the bank account we should send the transfer to:',
  BankInfoSelect: 'Select from the list...',
  SubmitCreditRequest: 'Click the Submit button to submit the request.',
  SubmitDistributionRequest: 'Click the Submit button to submit the request.',
  EnterAmount: 'Enter an amount in USD',
  AccountEnding: 'Account ending',
  AddNewAccount: 'To add a new bank account, stop here and go to',
  AdminNoAccountMessage: 'As a director/administrator you can start a withdrawal now and specify the bank account later in the Administration area',
  CancelRequestDialogTitle: 'Do you want to cancel request',
  ModifyingRequest: 'Modifying request',
  MakeRecurringDetails1: 'Making this a recurring request will indicate that we should send a transfer for the request amount at the end of each subsequent statement period automatically and indefinitely (assuming a sufficient account balance). No action will be required on your part. We will debit your account as usual (fees may apply) and you will receive an email confirmation each time that we send the transfer.',
  MakeRecurringDetails2: 'You can cancel the recurring request at any time before the end of a statement period to indicate that you wish for the automatic withdrawals to stop. You can submit a new request and make it recurring at any time.',
  MakeRecurringDetails3: 'If you make other withdrawals (distributions) in the same statement period, all withdrawal amounts are addded together and sent as one transfer for that statement period.',
  ModifyOther: 'To make other changes to this request, like changing the amount or the bank account, please cancel the request and submit a new one.',
  MakeRecurring: 'Make recurring',
  id: 'Operation ID',
  amount: 'Amount',
  manager: 'manager',
  datetime: 'Requested at',
  status: 'Operation status',
  docId: 'Document ID',
  timestamp: 'Document sent',
  docStatus: 'Status',
  link: 'Open document',
  month: 'End of Month',
  year: 'Year',
};
export const transactionListLabels = {
  stages: {
    credit: [
      'Request submitted',
      'Manager signature',
      'Your signature',
      'Funds received',
      'Request completed',
    ],
    debit: [
      'Request submitted',
      'Manager signature',
      'Your signature',
      'Distribution sent',
      'Receipt confirmation',
      'Request complete',
    ],
  },
  credit: [
    'Waiting for you to complete the Credit Request Form.',
    "Waiting for your account manager's signature on the Credit Request Form.",
    'Waiting for your signature on the Credit Request Form.',
    "Waiting for receipt of your funds. If you haven't already, please send the credit amount to the bank information specified in the Credit Request Form.",
    'This credit request is completed. The credited amount will appear on the account statement for the corresponding statement period.',
  ],
  debit: [
    'Waiting for you to complete the Distribution Request Form.',
    "Waiting for your account manager's signature on the Distribution Request Form.",
    'Waiting for your signature on the Distribution Request Form.',
    'Waiting for the end of the current statement period to process the distribution',
    'Waiting for you to confirm receipt of funds.',
    'This distribution request is completed. The distributed amount will appear on the account statement for the corresponding statement period.',
  ],
  statuses: {
    requested: 'Waiting to send email with document link.',
    client: 'Waiting for client to sign request document.',
    manager: 'Waiting for manager to sign request document.',
    review: 'The distribution request is undergoing normal review.',
    waiting: 'Waiting to confirm receipt of funds.',
    exception: 'There was an issue when reviewing your request. Your manager will reach out with more information.',
    ready: 'Your distribution request is ready to be processed at the end of the month.',
    sent: 'Your distribution request has been sent. The amount will appear on your next statement.',
    received: 'Your credit request has been completed. The amount will appear on your next statement.',
  },
  Void: 'Void',
  Cancel: 'Cancel',
  Details: 'Details',
  Status: 'Status: ',
  statusLastUpdated: 'Status last updated',
  requestSubmitted: 'Request submitted',
  noDoc: 'Pending',
  request: 'request',
};
export const operationRequestLabels = {
  NoRequestFromNewOpReq: 'The server did not return the request with the attempt to create a new operation request. This likely means the request was not created correctly.',
  SuccessFromNewOpReq: 'The request was created successfully.',
  NoSuccess: 'There appears to have been an issues processing the change. Please refresh the page and try again.',
  UnableToRefresh: 'The changes appear to have been saved, but there was an issue while trying to refresh this section. Please manually refresh the page.',
};
export const Loading = {
  Userinfo: 'Loading your user info',
  Accounts: 'Loading client accounts',
  Managers: 'Loading manager accounts',
  Requests: 'Loading operation requests',
  Documents: 'Loading request documents',
  NewRequest: 'Creating the request',
  SaveRequest: 'Saving your changes...',
  PostRequest: 'Posting the request...',
  VoidRequest: 'Voiding the request...',
};

export const Admin = {
  AdminWebpageTitle: `${SiteTitle} - Administration`,
  OperationsTableTitle: 'All operations',
  AdminPageTitle: 'Administration',
  TransfersTab: 'Transfers',
  TransfersTabWebpageTitle: `${SiteTitle} - Administration:Activity`,
  Forms: 'Forms',
  Statements: 'Statements',
  Accounts: 'Accounts',
  Applications: 'Applications',
  Trades: 'Trades',
  Analytics: 'Portfolio',
  Processing: 'Processing',
  NoResultFromUpdateOpReq: (id: IRequest['id']) => `There was an issue saving operation request #${id}`,
  NoMessageFromUpdateDoc: (id: IDocument['id']) => `There was an issue saving document #${id}`,
  NoChangeToOpReq: (id: IRequest['id']) => `Did not save request #${id} because no changes were made`,
  SavedUpdateOpReq: (id: IRequest['id']) => `Saved operation request #${id}`,
  PostedOpReq: (id: IRequest['id']) => `Posted request #${id}`,
  NoChangeToDoc: (id: IDocument['id']) => `Did not save document #${id} because no changes were made`,
  SavedUpdateDoc: (id: IDocument['id']) => `Saved document #${id}.`,
  VoidedOpReq: (id: IRequest['id']) => `Voided request #${id}`,
  NoSuccessFromServer: 'The server did not return a success flag. This likely means the change did not occur correctly.',
  FetchFailed: 'The attempt to contact the server failed. Check your connection and try again ',
};

export const Activity = {
  CopyToClipboard: (value: string) => `Copy "${value}" to the clipboard`,
  header: 'Transfer requests',
  Busy: 'Processing...',
  Loading: 'Loading...',
  Transfers: 'transfers',
  ActiveTransfers: 'Active transfers',
  HistoricTransfers: 'Transfer history',
  NoCurrentActivity: 'There are no active transfers',
  NoHistory: 'There are no past transfers',
  TransferRequests: 'transfer requests',
  All: 'All',
  Filters: 'Filters',
  Options: 'Options',
  Apply: 'Apply',
  Action: 'Action',
  Edit: 'Edit',
  Save: 'Save',
  Cancel: 'Cancel',
  Modify: 'Modify',
  Post: 'Post',
  Yes: 'Yes',
  No: 'No',
  CannotPosted: '(Cannot post)',
  SearchAcross: (count: number) => `Filter across ${count} transfers...`,
  Status: 'Status',
  Type: 'Type',
  Stage: 'Stage',
  NoDocument: 'Pending',
  DocumentDetails: 'Document details',
  Notes: 'Notes',
  Actions: 'Actions',
  Delete: 'Delete',
  Posted: 'Posted',
  Effective: 'End of month',
  Progress: 'Progress',
  PostingDetails: 'Posting details',
  AreYouSure: 'Are you sure?',
  DeletePostingPrompt: 'Are you sure you want to delete this posted operation? You will need to manually re-generate the affects statement(s) afterwards.',
  PostedBy: (name: string, date: string, time: string) => `Posted by ${name} on ${date} at ${time}`,
  PostedOperations: 'Posted operations',
  OperationDate: 'Effective',
  Amount: 'Amount',
  ID: 'ID',
  Account: 'Account',
  AccountDetails: 'Account details',
  Manager: 'Manager',
  ManagerDetails: 'Manager details',
  AccountNumber: 'Account #',
  Name: 'Name',
  ContactName: 'Contact',
  Entity: 'Entity',
  Email: 'Email',
  Requested: 'Requested',
  NotPosted: 'None found',
  DCAF: 'DCAF',
  AccountEnding: 'Bank last 4',
  Saved: 'Saved',
  BofA: 'BofA',
  Link: 'Link',
  NA: 'N/A',
  LastUpdated: 'Updated',
  WireConfirmation: 'Confirmation',
  Export: 'Export',
  ExportTransferList: 'How many records do you want to export?',
  ExportTransferListLoading: (count: number) => `Loading ${count ?? ''} transfers...`,
  ExportTransferListExporting: 'Preparing transfers for export...',
  ExportTransferListReady: 'Export ready',
  ExportDownload: 'Download',
};
export const Forms = {
  Application: {
    tabTitle: 'Application',
    header: 'Client Application Form',
    Form: {
      clientInstructions: 'Enter the information for the individual who will complete the application. If the application will be completed on behalf of a legal entity, specify the information for the individual who will be the contact for the legal entity.',
      clientNamePlaceholder: 'Full name',
      clientEmailPlaceholder: 'Email address',
      crfOptionLabel: 'Include initial Credit Request Form (CRF)',
      crfOptionText: `If you do not include the initial CRF, client will need to sign into their ${Brand.ShortName} account and make a credit request, and then sign a Distribution and Credit Request Form before their initial credit will be processed.`,
      spanishOptionLabel: 'Spanish version',
      sendButtonText: 'Clicking the button above will take you to DocuSign. You will not need to fill or sign anything on the form until the client completes it, so you can close the form by clicking "Close" for now.',
      sendButtonLabelPrefix: 'Send application',
      sendButtonLabelWithCRF: ' with CRF',
      sendButtonLabelInSpanish: ' in Spanish',
      previewForm: 'Preview form',
    },
    PDFDoc: {
      Prev: 'prev',
      Next: 'next',
      Page: 'page',
    },
  },
  Transfers: {
    tabTitle: 'Transfers',
    paneHeader: 'Transfer forms',
    formInstructions: 'Only accounts with pending requests appear in this list',
    credit: 'credit',
    distribution: 'distribution',
    selectAccount: 'Select an account...',
    selectRequest: 'Select a request...',
    documentExists: 'It appears that a form has already been sent for this request',
    documentLink: 'Open form',
    spanishOptionLabel: 'Spanish version',
    sendButtonLabelInSpanish: ' in Spanish',
    sendButtonLabelPrefix: 'Send',
    sendDistributionRequestForm: ' Distribution Request Form',
    sendCreditRequestForm: ' Credit Request Form',
    sendButtonText: 'Clicking the button above will take you to DocuSign to sign the form. You can use the menu when signing to choose to sign the document later.',
    transferDatePrefixCredit: 'Start of',
    transferDatePrefixDistribution: 'End of',
  },
  Beneficiary: {
    tabTitle: 'Beneficiary',
    header: 'Beneficiary Designation Form',
    Form: {
      account: 'Client account',
      selectAccount: 'Select an account...',
      manager: 'Account manager',
      spanishOptionLabel: 'Spanish version',
      sendButtonText: 'Clicking the button above will take you to DocuSign. You will not need to fill or sign anything on the form until the client completes it, so you can close the form for now.',
      sendButtonLabelPrefix: 'Send beneficiary form',
      sendButtonLabelInSpanish: ' in Spanish',
    },
  },
  Transfer: {
    tabTitle: 'Transfer',
  },
};
export const Documents = {
  Applications: {
    OpenAccountInstruction: (name: string) => `You can open the account for ${name} from the completed application`,
    TabTitle: 'Invited',
    sendInvitation: 'Send invitation',
    sendNewInvitation: 'Send Application',
    sendInvite: 'Click the button to send the invite',
    loadingManagers: 'Loading managers...',
    loadingApplications: 'Loading applications...',
    ApplicationActions: 'Actions',
    DeleteApplication: 'Delete application',
    Actions: 'Actions',
    DeleteSure: 'Are you sure?',
    DeletePrompt: 'Do you want to INSTANTLY and PERMANENTLY delete all information related to this application?',
    ViewApplication: 'View application',
    ApplicantUsername: 'Email',
    ApplicantName: 'Applicant name',
    ApplicantEmailPlaceholder: 'Enter the applicant email address',
    NamePlaceholder: 'Enter the applicant\'s first name/Business name',
    SelectApplication: 'Select an application',
    SelectAManager: 'Select a manager for the applicant',
    SelectAccountManager: 'Select a manager for the account',
    SelectOpenMonth: 'Select the first statement month',
    SelectMonth: 'Choose the month...',
    SelectYear: 'Choose the year...',
    SelectOpenMonthInstruction: 'You should select the month in which the first deposit is made. After the deposit is made and the first statement is populated, the statement will show an opening balance of zero and an ending balance equal to the first deposit amount.',
    Choose: 'Choose from the list...',
    PreviewEmail: 'Preview the invitation email',
    AppPIN: 'PIN',
    Manager: 'Manager',
    CreatedBy: 'Created by',
    ApplicationStarted: 'Started',
    NotStarted: 'Not started',
    DateCreated: 'Created',
    DateEnded: 'Completed',
    NotCompleted: 'Not completed',
    DeleteNow: 'Delete now',
    Cancel: 'Cancel',
    OpenAccountClick: 'Click the button to open the account',
    OpenAccount: 'Open account',
    AppIncomplete: 'Application incomplete',
    GoToAccount: 'View account',
    FilterApplications: 'Filter by email or applcant name',
  },
  Accounts: {
    TabTitle: 'Active',
    NewAccountInstruction: `You can open a new ${Brand.ShortName} client account by providing the following information`,
    NewAccount: 'New account',
    Actions: 'Actions',
    ShowSelected: 'Hide unselected',
    ShowAll: 'Show all',
    SelectAll: 'Select all',
    UnselectAll: 'Unselect all',
    SearchBy: 'Search by',
    ViewAccount: 'Go to dashboard',
    EditAccount: 'Account details',
    Contact: 'Contact',
    firstName: 'First name',
    name: 'Name',
    AccountHolder: 'Account holder',
    lastName: 'Last name',
    businessEntity: 'Legal entity name (leave blank if none)',
    email: 'Email',
    openingMonth: 'Opening month',
    openingYear: 'Opening year',
    latestBalance: 'Latest balance',
    asOf: 'as of',
    tooHigh: 'too high',
    tooLow: 'too low',
    pendingTransfers: 'pending transfers',
    no: 'no',
    AccountNumber: 'Account number',
    selectManager: 'Select a manager',
    manager: 'Manager',
    sendEmail: 'Send account opening email (with link to set password)',
    Cancel: 'Cancel',
    Choose: 'Choose from the list...',
    loading: 'Loading...',
    Refresh: 'Refresh',
    Subject: 'Subject',
    To: 'To',
    Cc: 'Cc',
    TBD: '[Account number will be generated]',
    Link: '[Link will be generated]',
  },
};
export const AccountDetails = {
  AccountInfo: 'Account information',
  AccountFirstName: 'First name',
  AccountLastName: 'Last name',
  BusinessEntity: 'Business entity',
  AccountNumber: 'Account number',
  Email: 'Email',
  AccountManager: 'Account manager',
  AccountOpened: 'Opened',
  NewSiteAccess: 'Has access to new portal',
  NewSiteOn: 'Yes',
  NewSiteOff: 'No',
  Edit: 'Edit',
  Save: 'Save',
  Cancel: 'Cancel',
};
export const PasswordReset = {
  ResetPassword: 'Reset password',
  EmailWillBeSent: 'The following email will be sent',
  Send: 'Send',
  Sending: 'Sending',
  To: 'To',
  Cc: 'Cc',
  TBD: '[Account number will be generated]',
  Link: '[Link will be generated]',
};
export const ChangeEmail = {
  EditEmail: 'Change email',
  ChangeEmailFor: 'Change email for',
  EnterNewEmail: 'Enter the new email address',
  SendEmail: 'Send confirmation email',
  Cancel: 'Cancel',
  Save: 'Save',
  Instruction: 'The change takes affect immediately after saving. At the next sign-in the new email address must be used. All automated emails and electronic documents will go to this email as well.',
};
export const ActiveAccountsFilter = {
  FilterAccounts: 'Filter by account manager',
  Cancel: 'Cancel',
  Apply: 'Apply',
  Filter: 'Filter',
};
export const PopulateStatementsDialog = {
  PopulateSelected: 'Populate selected',
  PopulateStatements: 'Populate statements',
  PopulateFrom: 'From',
  SendEmails: 'Send emails on statement population',
  SendEmailDescription: 'Below is a sample of the email that will be sent for each statement',
  Cancel: 'Cancel',
  Save: 'Save',
  SelectFromMonth: 'Select starting month',
  SelectToMonth: 'Select ending month',
  UpdateStatementsPrompt: (fromDate: string, toDate: string, count: number, name?: string) => `Would you like to populate statements for ${name || `the ${count} selected account${count > 1 ? 's' : ''}`}${fromDate && toDate ? `, ${fromDate === toDate ? `for ${toDate}` : `from ${fromDate} to ${toDate}`}` : ''}? If a statement already exists it will be re-calculated based on current system data which may result in a different balance.`,
};
export const AccountStatementsModal = {
  ViewStatements: 'View statements',
  Statements: 'Statements',
};
export const TransfersModal = {
  ViewTransfers: 'View transfers',
  Transfers: 'Transfers',
};
export const Portfolio = {
  SummaryTabTitle: 'Overview',
  PortfolioSummary: 'Portfolio Summary',
  ManagerFeeRate: 'Commission',
  UnderManagement: 'Under management',
  GainLoss: 'Gain/Loss',
  ManagerFeeRateExplanation: 'The fee rate seen here is only used to calculate the theoretical commissions in the charts and tables. All commissions must be manually reviewed before they are approved.',
  SelectedManagerLabel: 'Showing portfolio for',
  All: 'All',
  Clear: 'Clear',
  Cancel: 'Cancel',
  Apply: 'Apply',
  NoStatements: 'There are no statements available',
  Loading: 'Loading this data could take a while',
  Statements: 'Statements',
  Find: 'Find',
  FindStatements: 'Find statements by account',
  StatementsTableHeaders: {
    AccountNumber: 'Number',
    Account: 'Name',
    Month: 'Month',
    StartBalance: 'Start balance',
    NetGainLoss: 'Net gain/loss',
    NetTransactions: 'Net transactions',
    EndBalance: 'End balance',
    RoundingError: 'Rounding error',
    Generated: 'Populated',
  },
  Transactions: 'Transactions',
  StatementMonths: 'Months',
  AccountBalance: 'Balance',
  AccountBalances: 'Account balances',
  AccountsTop5: 'Largest 5 accounts',
  Accounts: 'Accounts',
  Managers: 'Managers',
  GenerateStatements: 'Populate',
  GenerateStatementsDialogHeader: 'Populate Statements',
  EmailPreview: 'Email preview',
  SendEmails: 'Send emails after populating statements',
  CCManager: 'CC the account manager on each statement email',
  SendHTMLEmail: 'Send with HTML',
  SendingEmails: 'Sending emails',
  SendingEmailsTime: (ms: number) => {
    const est = Duration.fromMillis(ms).shiftTo('seconds').toObject();
    return `Aprrox ${est.minutes ? `${est.minutes}m ` : ''}${est.seconds}s`;
  },
  Start: 'Start',
  UpdateStatementsPrompt: (fromDate: string, toDate: string) => `Would you like to populate statements for the account(s) selected below, ${fromDate === toDate ? `for ${toDate}` : `from ${fromDate} to ${toDate}`}? If a statement already exists it will be re-calculated based on current system data which may result in a different balance.`,
};

export const MultiSelector = {
  SelectItems: (pluralLabel: string) => `${pluralLabel}`,
  Items: 'Items',
  All: 'All',
  Clear: 'Clear',
  Cancel: 'Cancel',
  Apply: 'Apply',
};

export const TransactionProgressBar = {
  clientAction: 'Client action required',
  managerAction: 'Manager action required',
  officeAction: 'Office action required',
  noAction: 'No action required',
  colorKey: 'Color key',
};

export const PortfolioOperationsDialog = {
  loading: 'Loading',
  Operations: (date: string) => `Operations for ${date}`,
};

export const OperationsTableDetails = {
  Save: 'Save',
  Post: 'Post',
  Void: 'Void',
  FieldRequired: 'This field is required.',
};

export const RequestActions = {
  cancelRequest: 'Void request',
  unpostRequest: 'View operations',
  makeRecurring: 'Make recurring',
  manualEdit: 'Manual edit',
  createDocument: 'Register request',
  deleteDocument: 'Un-register request',
  effectiveMonth: 'Effective end of',
  No: 'No',
  Yes: 'Yes',
  Cancel: 'Cancel',
  Confirm: 'Confirm',
  makeRecurringPromptTitle: ({ status, type, id }: {status: RequestStatus; type: OperationType; id: number}) => `Make ${status} ${type} request #${id} a monthly recurring request?`,
  manualEditTitle: ({
    status, type, id, docId, amount,
  }: {status: RequestStatus; type: OperationType; id: number; docId: number; amount: string }) => `Editing ${amount} ${status} ${type} request #${id}${docId ? ` and document ${docId}` : ''}`,
  status: 'Status',
  amount: 'Amount',
  stage: 'Stage',
  notes: 'Notes',
  link: 'Link',
  unPostTitle: (id: number, type: OperationType, status: RequestStatus) => `Operations posted from ${status} ${type} request #${id}`,
  undoPostPrompt: 'Select the operations to delete',
  cancelRequestPromptTitle: ({ status, type, id }: {status: RequestStatus; type: OperationType; id: number}) => `Cancel ${status} ${type} request #${id}?`,
  registerRequestPrompTitle: ({ id }: { id: number }) => `Register request #${id}`,
  sendByMonth: 'Select the distribution period',
  setReceivingBank: 'Select the receiving bank',
  cantEmailNoDCAF: 'Cannot send email because no DCAF was present',
  sendEmail: 'Send email',
  emailWillBeSent: 'The following email will be sent',
  emailMessage: 'You may enter an additional message to be included at the end of the email',
};
export const BankInfoSelector = {
  BankAccount: 'Bank account',
  Default: 'Preferred',
  NoBankAccountsAvailable: 'No saved bank accounts',
  SetClientBankAccount: 'Select a saved bank account',
  NoBankAccountSet: 'No bank account specified for this transfer',
  IntraFundTransfer: '*Intra-fund transfer* (admin only)',
};
export const PostRequestDialog = {
  cancel: 'Cancel',
  confirm: 'Confirm',
  networkError: 'We were unable to load some data for this page. Please refresh the page to try again',
  errorHeader: 'The following errors occurred when loading the data',
  loadingRequest: (id: number) => `Loading Request #${id}`,
  dialogTitle: 'REQUEST',
  transferInformation: 'Transfer confirmation information',
  taskDialogHeader: (id: number) => `Link URL to Request #${id}`,
  openTask: 'Open Task',
  openDocuSign: 'Open DocuSign',
  addTask: 'Add task',
  setTask: 'Enter the URL to the Task',
  saveChanges: 'Save',
  adjustment: 'Reimbursement calculation',
  fee: 'Fee',
  postMonth: 'Effective at end of month',
  wireConfirmation: 'Confirmation number',
  invalidConfirmationNumber: 'Please enter a confirmation number',
  sentAmount: 'Debit amount',
  receivedAmount: 'Credit amount',
  wirePostDate: 'Wire post date',
  transferSentDate: 'Transfer sent on',
  transferReceivedDate: 'Transfer received on',
  closeDialog: 'Close',
  postRequestSummary: (type: OperationType, amount: number, date: string, email?: boolean) => `${type === OperationType.Debit ? 'Debit' : 'Credit'} ${currency(Math.abs(amount))} at end of ${date}${email ? ' and email client' : ''}`,
  postRequest: 'Post transaction',
  sendEmail: 'Email client after posting request',
  dontSendEmail: 'Don\'t email',
  emailPreview: 'Email preview',
  emailTo: 'To',
  emailCC: 'Cc',
  emailSubject: 'Subject',
  emailMessage: 'You may enter an additional message to be included at the end of the email',
  emailInstruction: 'The message above is automatically generated from the available information',
  cantEmail: 'Can\'t send email because',
  noDCAF: 'the bank account does not have a DCAF on file',
  notValidated: 'the bank account info has not been validated',
  relevantAccountInformation: 'Relevant account information',
  accountHolder: 'Account holder',
  dateOpened: 'Opened',
  accountNumber: 'Account number',
  accountManager: 'Manager',
  accountContact: 'Contact',
  gotoAccount: 'Account details',
  accountActions: 'Account actions',
  gotoStatements: 'Statements',
  gotoTransfers: 'Transfers',
  viewBankInfo: 'View bank info',
  clickTo: 'Click to',
  previewBankInfo: 'show bank info',
  hidePreviewBankInfo: 'hide bank info',
  bankInfo: 'Bank info',
  BankAccountsFor: 'Bank accounts for',
  openDCAF: 'Open DCAF',
  openAttachment: 'Open attachment',
  addDCAF: 'Add DCAF',
  thisTransfer: 'This transfer',
  asWire: 'Process as wire',
  previousMonth: 'Previous month',
  thisMonth: 'This month',
  balance: 'balance',
  startBalance: 'Start balance',
  unavailable: 'unavailable',
  pending: 'Pending balance',
  endBalance: 'Statement balance',
  viewActiveTransfers: 'View active transfers',
  pendingTransfers: 'Pending transfers',
  postedTransfers: 'Posted transfers',
  gainLoss: 'Gain/Loss',
  statementNeedUpdating: 'Statement needs updating',
  cannotCalculateBalance: 'Cannot calculate',
  errorBalanceBelowZero: 'Posting this transaction will potentially put the account balance below $0.00. Double check the effective month and debit amount.',
  errorInvalidFutureStatements: (date: string) => `Processing this transaction will potentially invalidate the existing statement for ${date} and the following months`,
  cantPostBecauseOutsideStatementRage: (first: string, latest: string) => `the selected effective end month and year is not within the valid account statement range of ${first}${latest ? ` and ${latest}` : ''}`,
  cantPostBCPosted: (month: string) => `the request has already been posted to ${month}`,
  cantPostBCWireConfirmationEmpty: 'the confirmation number is empty',
  cantPostBCStatus: (status: string) => `the request status is ${status}`,
};

export const Table = {
  Page: 'page',
  PageOf: 'of',
  ShowingPage: 'showing page',
  Show: 'show',
  ShowingItemCount: 'showing up to',
  Export: 'Export',
  Loading: 'Loading',
};

export const BankInfo = {
  header: 'Bank accounts',
  noSavedAccount: 'No saved bank accounts',
  addNew: 'Add',
  deletePromptTitle: 'Are you sure?',
  deletePromptText: (accountEnding: string) => `Delete the saved banking information for the account ending in ${accountEnding}`,
  thisAccountStatus: 'This bank account information is',
  notSaved: 'Not saved',
  open: 'Open',
  selectFromTheList: 'Choose from this list...',
  accountAddress: 'Account holder address',
  accountHolderInfo: 'Account holder information',
  bankAccountInfo: 'Bank account information',
  addressStreet: 'Street number and name',
  addressCity: 'City',
  addressState: 'State',
  addressCountry: 'Country',
  addressPostal: (isDomestic: boolean) => (isDomestic ? 'ZIP Code' : 'Postal code'),
  save: 'Save',
  validate: 'Mark valid',
  openDCAF: 'Open DCAF',
  setDCAF: 'Set DCAF',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  preferred: 'Default',
  usePreferred: 'Use this account as the default account for new withdrawals',
};

export const TradeLog = {
  title: 'Trade log',
  Pips: 'Pips',
  Total: 'Total',
  Long: 'Long',
  Short: 'Short',
  image1: 'image 1',
  image2: 'image 2',
};

export const TradeAnalytics = {
  title: 'Analyze',
  symbol: 'symbol',
  symbols: 'symbols',
  model: 'model',
  models: 'models',
  Pips: 'Pips',
  Total: 'Total',
  Trades: 'Trades',
  Long: 'Long',
  Short: 'Short',
};

export const TradeReport = {
  title: 'Fund reports',
  reportDialogHeader: 'Edit trades',
  NewReport: 'New report',
  day: 'Day',
  month: 'Month',
  year: 'Year',
  interest: 'Gain/Loss %',
  gainLoss: 'gain/loss',
  symbol: 'Symbol',
  newTrade: 'New trade',
  specifyInterest: 'Enter a percentage',
  noTradesForDay: 'No trades for this day',
  tradeReport: 'Trade report for',
  saveReport: 'Save',
  cancel: 'Cancel',
  published: 'published',
  Publish: 'Publish',
  Unpublish: 'Unpublish',
  Delete: 'Delete',
  unpublished: 'unpublished',
  CannotChangePublishedReport: 'You cannot modify trades for this month because the monthly report has been published.',
  DeleteTradeReport: 'Delete trade report',
  DeleteTradeReportInstruction: (dateString: string) => `Are you sure you want to delete the trade report for ${dateString}? You will not be able to restore the trades afterwards and you may invalidate existing account statements.`,
  PublishTradeReport: 'Publish trade report',
  PublishTradeReportInstruction: (dateString: string, interest: string) => `Are you sure you want to publish the trade report for ${dateString}, with total gain/loss of ${interest}? Account managers will be emailed that the trade report is ready, and they will immediately be able to publish account statements for their clients.`,
  UnpublishTradeReport: 'Unpublish trade report',
  UnpublishTradeReportInstruction: (dateString: string) => `Are you sure you want to unpublish the trade report for ${dateString}? After you confirm, the system will check for any published account statements that rely on this trade report, and only if none exist will the unpublishing succeed.`,
};
