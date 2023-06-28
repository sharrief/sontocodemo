/* eslint-disable no-param-reassign */
import {
  Action,
  AnyAction,
  AsyncThunkPayloadCreator, createAsyncThunk, createSlice, PayloadAction, ThunkAction,
} from '@reduxjs/toolkit';
import { API, endpoints } from '@api';
import {
  FetchStatus,
  RootState, rootState, selectApplication, selectUI, StepName, UIState,
} from '@application/application.store';
import { Application } from 'shared/models';
import { isValidationMessageAndValue, NestedValidations } from '@validation';
import { PromiseValue } from 'type-fest';
import { IApplication } from '@interfaces';
import Labels from './Labels';

type EmailAndPIN = Parameters<typeof API.Applications.Load.post>[0];
const fetchLoadApp = (args?: EmailAndPIN) => API.Applications.Load.post(args);
export const loadApplication = createAsyncThunk('loadApplication', fetchLoadApp);

const fetchLoadFromSession = () => API.Applications.Load.get();
export const loadFromSession = createAsyncThunk('loadFromSession', fetchLoadFromSession);

const fetchLoadById = (args: { uuid: string }) => API.Applications.View.post(args);
export const loadById = createAsyncThunk('loadById', fetchLoadById);

type PartialApp = Parameters<typeof API.Applications.Save.post>[0]['application']
const fetchSaveApp = (application: PartialApp) => API.Applications.Save.post({ application });
export const saveApplication = createAsyncThunk('saveApplication', fetchSaveApp);

export const exitAppSession = (): ThunkAction<void, RootState, unknown, null> => () => {
  window.location.href = endpoints.exitApplication;
};

type ClickedStepButtonArgs = {
  goToStep?: StepName;
  skipSave?: boolean;
}
type ClickedStepButtonReturn = {
  goToStep?: StepName;
  skipSave?: boolean;
  response: PromiseValue<ReturnType<typeof fetchSaveApp>>;
}

export const clickedStepButton = createAsyncThunk<ClickedStepButtonReturn, ClickedStepButtonArgs, { state: RootState }>('clickedStepButton',
  async ({ goToStep, skipSave }, thunkAPI) => {
    let response;
    const { app } = thunkAPI.getState().dataState;
    if (!skipSave && !app.clickedToSign) {
      response = await fetchSaveApp(thunkAPI.getState().dataState.app);
    }
    return ({ goToStep, skipSave, response });
  });

export const clickedDisclaimerAccept = createAsyncThunk('clickedDisclaimerAccept',
  (async function saveApp(_app, thunkAPI) {
    const { app } = thunkAPI.getState().dataState;
    if (app.clickedToSign) return null;
    return fetchSaveApp({ ...app, hasReadDisclaimer: true });
  }) as AsyncThunkPayloadCreator<null, null, {state: RootState}>);

const asyncValidateApplication: AsyncThunkPayloadCreator<NestedValidations<IApplication>, null, {state: RootState}> = async (_arg, thunkAPI) => Application.getValidationMessages(thunkAPI.getState().dataState.app, !thunkAPI.getState().uiState.wasValidatedByServer);
export const validateApplication = createAsyncThunk('validateApplication', (asyncValidateApplication));

let validateTimer: NodeJS.Timeout;
const debounceTime = 500;
export const applyThenValidate = (action: AnyAction): ThunkAction<void, RootState, unknown, Action<string>> => (dispatch) => {
  dispatch(action);
  if (validateTimer) {
    clearTimeout(validateTimer);
  }
  validateTimer = setTimeout(() => {
    dispatch(validateApplication());
  }, debounceTime);
};

const getInvalidFields = (state: RootState, validationMessages?: RootState['uiState']['validationMessages']) => Object.keys(validationMessages)
  .filter(<K extends keyof typeof validationMessages>(property: K) => {
    const propMustBeValid = state.uiState.validateFieldNamesByStepIndex[state.uiState.currentStep]?.includes(property);
    const validation = validationMessages[property];
    if (isValidationMessageAndValue(validation)) {
      return propMustBeValid && Application.ValidationIsInValid(validation);
    }
    return propMustBeValid && Application.NestedValidationIsInvalid(validation as NestedValidations<IApplication>);
  });

const stepHasInvalidFields = (state: RootState, step: StepName) => {
  const { validationMessages } = selectUI(state);
  const app = selectApplication(state);
  const invalidFields = validationMessages && getInvalidFields(state, validationMessages);
  if ((invalidFields?.length && step !== null) || (!app.hasReadDisclaimer && step !== StepName.Disclaimer)) {
    return true;
  }
  return false;
};

const fetchHandler = (
  status: FetchStatus,
  state: RootState,
  payload?: {
    application?: RootState['dataState']['app'];
    error?: RootState['uiState']['fetchError'];
    validationMessages?: RootState['uiState']['validationMessages'];
    noSession?: boolean;
  },
  options?: {goToStep?: StepName; skipSave?: boolean},
) => {
  if (payload) {
    const {
      application, error, validationMessages, noSession,
    } = payload;
    if (noSession) {
      state.uiState.loginMessage = Labels.LoginApplication;
    }

    if (validationMessages) {
      state.uiState.validationMessages = validationMessages;
      const invalidFields = getInvalidFields(state, validationMessages);
      if (invalidFields.length > 0) {
        state.uiState.invalidFields = invalidFields;
      } else {
        state.uiState.invalidFields = [];
      }
    } else {
      state.uiState.validationMessages = {};
      state.uiState.invalidFields = [];
    }
    if (application) {
      if (status === FetchStatus.Loaded) {
        state.dataState.app = application;
        state.uiState.loadedApplication = true;
      }
      if (status === FetchStatus.Saved) {
        /**
         * let components know they should show all validation messages,
         * even for empty fields which would normally not show because user hasn't entered data yet
        */
        state.uiState.wasValidatedByServer = true;
        state.uiState.showErrorDialog = true;
        state.dataState.app = application;
      }
    }
    if (error) {
      state.uiState.fetchError = error;
      state.uiState.loginMessage = error;
    }
  }
  if (options) {
    const { pendingNextStep } = state.uiState;
    const {
      goToStep, skipSave,
    } = options;
    const nextStep = pendingNextStep != null ? pendingNextStep : goToStep;
    if (nextStep != null && (nextStep <= state.uiState.numberOfSteps && nextStep > 0)) {
      if (!stepHasInvalidFields(state, state.uiState.currentStep) || skipSave) {
        state.uiState.wasValidatedByServer = false; //* clear server validations when moving to another step
        state.uiState.showErrorDialog = false;
        if (nextStep > state.uiState.currentStep) {
          state.uiState.canStepNext = nextStep <= state.uiState.numberOfSteps; // No next step on last step
          state.uiState.currentStep = nextStep;
        } else {
          state.uiState.canStepBack = nextStep > 0; // Cant step back on first step
          state.uiState.currentStep = nextStep;
        }
        state.uiState.pendingNextStep = null;
      } else {
        state.uiState.pendingNextStep = goToStep;
      }
    }
  }
  state.uiState.fetchStatus = status;
  switch (status) {
    case FetchStatus.Loaded:
      state.uiState.fetchStatus = FetchStatus.Idle;
      break;
    case FetchStatus.Loading:
      state.uiState.fetchError = '';
      state.uiState.loginMessage = Labels.SigningIn;
      break;
    case FetchStatus.Saving:
      state.uiState.fetchError = '';
      state.uiState.invalidFields = [];
      break;
    case FetchStatus.Saved:
      state.uiState.fetchStatus = FetchStatus.Idle;
      break;
    default:
  }
};

export const applicationFormState: EmailAndPIN = {
  authEmail: '',
  appPIN: '',
};

type ApplicationFormState = EmailAndPIN;

export const selectApplicationFormState = (state: RootState) => state.applicationForm;

export const { actions, reducer: ApplicationFormReducer } = createSlice({
  name: 'applicationForm',
  initialState: rootState,
  reducers: {
    applicationLoadedAndNoStepSet: (state, { payload }: PayloadAction<StepName>) => {
      if (!state.uiState.currentStep && state.uiState.loadedApplication) {
        if (state.dataState.app.hasReadDisclaimer) {
          state.uiState.currentStep = payload || StepName.Information;
        } else {
          state.uiState.currentStep = StepName.Disclaimer;
        }
      }
    },
    canStepNext: (state, { payload }: PayloadAction<UIState['canStepNext']>) => {
      state.uiState.canStepNext = payload;
    },
    clickedStayHere: (state) => {
      state.uiState.showErrorDialog = false;
      state.uiState.invalidFields = [];
      state.uiState.pendingNextStep = null;
    },
    clickedGoAhead: (state) => {
      fetchHandler(FetchStatus.Idle, state, null, { skipSave: true });
    },
    setAuthEmail: (state, { payload }: PayloadAction<ApplicationFormState['authEmail']>) => {
      state.applicationForm.authEmail = payload;
    },
    setAppPIN: (state, { payload }: PayloadAction<ApplicationFormState['appPIN']>) => {
      state.applicationForm.appPIN = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadFromSession.pending, (state) => {
      state.uiState.completedFirstLoad = true;
      fetchHandler(FetchStatus.Loading, state);
    })
      .addCase(loadFromSession.fulfilled, (state, { payload }) => {
        fetchHandler(FetchStatus.Loaded, state, payload);
      })
      .addCase(loadById.pending, (state) => {
        state.uiState.completedFirstLoad = true;
        fetchHandler(FetchStatus.Loading, state);
      })
      .addCase(loadById.fulfilled, (state, { payload }) => {
        fetchHandler(FetchStatus.Loaded, state, payload);
      })
      .addCase(loadApplication.pending, (state) => {
        fetchHandler(FetchStatus.Loading, state);
      })
      .addCase(loadApplication.fulfilled, (state, { payload }) => {
        fetchHandler(FetchStatus.Loaded, state, payload);
      })
      .addCase(loadApplication.rejected, (state) => {
        fetchHandler(FetchStatus.Error, state);
      })
      .addCase(saveApplication.pending, (state) => {
        fetchHandler(FetchStatus.Saving, state);
      })
      .addCase(saveApplication.fulfilled, (state, { payload }) => {
        fetchHandler(FetchStatus.Saved, state, payload);
      })
      .addCase(saveApplication.rejected, (state) => {
        fetchHandler(FetchStatus.Error, state);
      })
      .addCase(clickedDisclaimerAccept.pending, (state) => {
        fetchHandler(FetchStatus.Saving, state);
      })
      .addCase(clickedDisclaimerAccept.fulfilled, (state, { payload }) => {
        const goToStep = Math.min(state.uiState.currentStep + 1, state.uiState.numberOfSteps - 1) as StepName;
        fetchHandler(FetchStatus.Saved, state, payload, { goToStep });
      })
      .addCase(clickedDisclaimerAccept.rejected, (state) => {
        fetchHandler(FetchStatus.Error, state);
      })
      .addCase(clickedStepButton.pending, (state) => {
        fetchHandler(FetchStatus.Saving, state);
      })
      .addCase(clickedStepButton.fulfilled, (state, { payload }) => {
        const { goToStep, response, skipSave } = payload;
        fetchHandler(FetchStatus.Saved, state, response, { goToStep, skipSave });
      })
      .addCase(clickedStepButton.rejected, (state) => {
        fetchHandler(FetchStatus.Error, state);
      })
      .addCase(validateApplication.pending, (state) => {
        state.uiState.invalidFields = [];
      })
      .addCase(validateApplication.fulfilled, (state, { payload: validationMessages }) => {
        fetchHandler(FetchStatus.Idle, state, { validationMessages });
      });
  },
});
