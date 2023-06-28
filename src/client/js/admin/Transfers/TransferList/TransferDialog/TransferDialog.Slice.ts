/* eslint-disable no-param-reassign */
import {
  DefaultDocument,
  DefaultRequest,
  DefaultUser,
  IRequest,
  OperationType,
  RequestStatus,
} from '@interfaces';
import {
  createSlice, PayloadAction,
} from '@reduxjs/toolkit';
import { saveTaskLinkCaseReducer } from '@client/js/admin/Transfers/TransferList/TransferDialog/Actions/saveTaskLink';
import { makeRequestRecurringCaseReducer } from '@client/js/admin/Transfers/TransferList/TransferDialog/Actions/makeRecurring';
import { cancelRequestCaseReducer } from '@client/js/admin/Transfers/TransferList/TransferDialog/Actions/cancelRequest';
import { unPostOperationsCaseReducer } from '@client/js/admin/Transfers/TransferList/TransferDialog/Actions/deleteOperations';
import { DateTime } from 'luxon';
import {
  createDocumentForRequest, deleteDocumentForRequest, saveManualEditToDocument, saveManualEditToRequest,
} from './RequestActions.Thunks';
import { State } from './TransferDialog.State';

type PA<T> = PayloadAction<T>;

const DefaultState: State = {
  inited: false,
  messages: [],
  errors: [],
  request: DefaultRequest,
  requests: [],
  operations: [],
  statementBalances: [],
  latestStatementBalance: null,
  earliestStatementBalance: null,
  document: DefaultDocument,
  account: DefaultUser,
  manager: DefaultUser,
  bankAccounts: [],
  loading: {
    request: false,
    requests: false,
    account: false,
    manager: false,
    bankAccounts: false,
    document: false,
    operations: false,
    statementBalances: false,
  },
  loaded: {
    request: false,
    requests: false,
    account: false,
    manager: false,
    bankAccounts: false,
    document: false,
    operations: false,
    statementBalances: false,
  },
  prompts: {},
  saving: {
    request: false,
    document: false,
    operations: false,
  },
  transferConfirmation: {
    loading: false,
    ready: false,
    inited: false,
    adjustment: 0,
    month: 0,
    year: 0,
    wireConfirmation: '',
    wireAmount: 0,
    wireDay: 0,
    wireMonth: 0,
    wireYear: 0,
    bankEndingUUID: '',
  },
  taskDialog: {
    newValue: '',
  },
  emailPreview: {
    emailMessage: '',
    requestAmount: null,
    requestType: null,
    canEmail: false,
    sendEmail: false,
  },
  manualEdit: {},
  undoPost: {
    selectedIds: [],
  },
  balancePreview: {
    ready: false,
    lastFetchedAccountNumber: '',
  },
  bankData: {
    inited: false,
    accounts: [],
  },
  processing: {
    loadingBankData: false,
  },
};

export const { actions, reducer } = createSlice({
  name: 'TransferDialogSlice',
  initialState: DefaultState,
  reducers: {
    clearErrors: (state) => {
      state.errors = [];
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setMessages: (state, { payload }: PA<string[]>) => {
      state.messages = payload;
    },
    setManualEdit: (state, { payload }: PA<State['manualEdit']>) => {
      state.manualEdit = payload;
    },
    setShowMakeRequestRecurringPrompt: (state, { payload }: PA<State['prompts']['showMakeRecurringPrompt']>) => {
      state.prompts = { showMakeRecurringPrompt: payload };
    },
    setShowCancelRequestPrompt: (state, { payload }: PA<State['prompts']['showCancelPrompt']>) => {
      state.prompts = { showCancelPrompt: payload };
    },
    hidePostRequestPrompt: (state) => {
      state.prompts = { showPostPrompt: false };
    },
    showPostRequestPrompt: (state) => {
      state.prompts = { showPostPrompt: true };
    },
    setShowManualEditPrompt: (state, { payload }: PA<State['prompts']['showManualEdit']>) => {
      state.prompts = { showManualEdit: payload };
      if (payload) {
        state.manualEdit = {
          status: state.request.status,
          stage: state.document?.stage ?? null,
          notes: state.document?.status ?? '',
          link: state.document?.documentLink ?? '',
        };
      }
    },
    setShowUnPostPrompt: (state, { payload }: PA<State['prompts']['showUndoPost']>) => {
      state.prompts = { showUndoPost: payload };
    },
    setShowRegisterDialog: (state, { payload }: PA<State['prompts']['showRegisterDialog']>) => {
      state.prompts = { showRegisterDialog: payload };
    },
    setIdsToUnPost: (state, { payload }: PA<State['undoPost']['selectedIds']>) => {
      state.undoPost.selectedIds = payload;
    },
    setTaskLink: (state, { payload }: PA<State['taskDialog']['newValue']>) => {
      state.taskDialog.newValue = payload;
    },
    setTaskDialogShow: (state, { payload }: PA<State['prompts']['showTaskDialog']>) => {
      state.prompts = { showTaskDialog: payload };
    },
    setInited: (state) => {
      state.transferConfirmation.inited = true;
    },
    setBalancePreview: (state, { payload }: PA<State['balancePreview']>) => {
      state.balancePreview = payload;
    },
    setPostData: (state, { payload }: PA<State['transferConfirmation']>) => {
      if (!payload) { state.transferConfirmation = payload; } else {
        let adjustment = 0;
        const amount = payload?.wireAmount || 0;
        if (state.emailPreview.requestType === OperationType.Credit) {
          if (state.emailPreview.requestAmount > amount) {
            adjustment = Math.min(100, Math.abs(state.emailPreview.requestAmount - amount));
          }
        }
        if (state.emailPreview.requestType === OperationType.Debit) {
          adjustment = payload.adjustment;
        }
        state.transferConfirmation = { ...payload, wireAmount: amount, adjustment };
      }
    },
    changePostMonth: (state, { payload }: PA<State['transferConfirmation']['month']>) => {
      state.transferConfirmation.month = payload;
    },
    changePostYear: (state, { payload }: PA<State['transferConfirmation']['year']>) => {
      state.transferConfirmation.year = payload;
    },
    changeWireAmount: (state, { payload }: PA<State['transferConfirmation']['wireAmount']>) => {
      state.transferConfirmation.wireAmount = payload;
    },
    changeBankEnding: (state, { payload }: PA<State['transferConfirmation']['bankEndingUUID']>) => {
      state.transferConfirmation.bankEndingUUID = payload;
    },
    changeWireAdjustment: (state, { payload }: PA<State['transferConfirmation']['adjustment']>) => {
      state.transferConfirmation.adjustment = payload;
    },
    changeWireConfirmation: (state, { payload }: PA<State['transferConfirmation']['wireConfirmation']>) => {
      state.transferConfirmation.wireConfirmation = payload;
    },
    changeWireMonth: (state, { payload }: PA<State['transferConfirmation']['wireMonth']>) => {
      state.transferConfirmation.wireMonth = payload;
    },
    changeWireYear: (state, { payload }: PA<State['transferConfirmation']['wireYear']>) => {
      state.transferConfirmation.wireYear = payload;
    },
    changeWireDay: (state, { payload }: PA<State['transferConfirmation']['wireDay']>) => {
      state.transferConfirmation.wireDay = payload;
    },
    setPostMonth: (state, { payload }: PayloadAction<Pick<State['transferConfirmation'], 'month'|'year'>>) => {
      state.transferConfirmation.month = payload.month;
      state.transferConfirmation.year = payload.year;
    },
    setEmailPreviewState: (state, { payload }: PayloadAction<State['emailPreview']>) => {
      state.emailPreview = payload;
    },
    toggleSendEmail: (state) => {
      state.emailPreview.sendEmail = !state.emailPreview.sendEmail;
    },
    setEmailPS: (state, { payload }: PayloadAction<string>) => {
      state.emailPreview.emailMessage = payload;
    },
    clearData: (state) => ({ ...DefaultState, transferConfirmation: state.transferConfirmation }),
    initTransferConfirmation: (state, { payload }: PayloadAction<IRequest>) => {
      const {
        type, status, datetime, amount,
      } = payload;
      const { month, year } = status === RequestStatus.Recurring
        ? DateTime.now().startOf('month').minus({ months: 1 })
        : DateTime.fromMillis(datetime).startOf('month');
      const now = DateTime.local();
      state.transferConfirmation = {
        ...DefaultState.transferConfirmation,
        adjustment: type === OperationType.Debit ? -60 : 0,
        month,
        year,
        wireConfirmation: '',
        wireAmount: amount,
        wireDay: now.day,
        wireMonth: now.month,
        wireYear: now.year,
        inited: true,
      };
      if (type === OperationType.Credit) {
        state.emailPreview.canEmail = true;
        state.emailPreview.sendEmail = true;
      }
    },
    setPostedEffectiveDate: (state, { payload }: PayloadAction<{month: number; year: number}>) => {
      state.transferConfirmation.month = payload.month;
      state.transferConfirmation.year = payload.year;
      // state.transferConfirmation.posted = true;
    },
  },
  extraReducers: (builder) => {
    saveTaskLinkCaseReducer(builder);
    makeRequestRecurringCaseReducer(builder);
    cancelRequestCaseReducer(builder);
    unPostOperationsCaseReducer(builder);
    builder

      .addCase(saveManualEditToRequest.pending, (state) => {
        state.saving.request = true;
        state.loading.request = true;
      })
      .addCase(saveManualEditToRequest.rejected, (state) => {
        state.saving.request = false;
        state.loading.request = false;
      })
      .addCase(saveManualEditToRequest.fulfilled, (state, { payload }) => {
        const { error, request, message } = payload;
        if (error) state.errors.push(error);
        if (request) {
          state.request = request;
        }
        if (message) state.messages.push(message);
        state.prompts.showManualEdit = false;
        state.saving.request = false;
        state.loading.request = false;
      })
      .addCase(saveManualEditToDocument.pending, (state) => {
        state.saving.document = true;
        state.loading.document = true;
      })
      .addCase(saveManualEditToDocument.rejected, (state) => {
        state.saving.document = false;
        state.loading.document = false;
      })
      .addCase(saveManualEditToDocument.fulfilled, (state, { payload }) => {
        const { error, document: savedDocument, message } = payload;
        if (error) state.errors.push(error);
        if (savedDocument) {
          state.document = savedDocument;
        }
        if (message) state.messages.push(message);
        state.prompts.showManualEdit = false;
        state.saving.document = false;
        state.loading.document = false;
      })
      .addCase(createDocumentForRequest.pending, (state) => {
        state.saving.document = true;
        state.loading.document = true;
      })
      .addCase(createDocumentForRequest.rejected, (state) => {
        state.saving.document = false;
        state.loading.document = false;
      })
      .addCase(createDocumentForRequest.fulfilled, (state, { payload }) => {
        const { error, document, message } = payload;
        if (error) state.errors.push(error);
        if (document) {
          state.document = document;
        }
        if (message) state.messages.push(message);
        state.prompts.showRegisterDialog = false;
        state.saving.document = false;
        state.loading.document = false;
      })
      .addCase(deleteDocumentForRequest.pending, (state) => {
        state.saving.document = true;
        state.loading.document = true;
      })
      .addCase(deleteDocumentForRequest.rejected, (state) => {
        state.saving.document = false;
        state.loading.document = false;
      })
      .addCase(deleteDocumentForRequest.fulfilled, (state, { payload }) => {
        const { error, message } = payload;
        if (error) state.errors.push(error);
        if (!error) {
          state.document = DefaultDocument;
        }
        if (message) state.messages.push(message);
        state.saving.document = false;
        state.loading.document = false;
      });
  },
});
