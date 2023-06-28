/* eslint-disable no-param-reassign */
import { DefaultApplication, IApplication } from '@interfaces';
import {
  configureStore, getDefaultMiddleware, PayloadAction,
} from '@reduxjs/toolkit';
import logger from 'redux-logger';
import {
  Name, PhoneAndEmail, Address, InvestmentExperience,
  Personhood, IdentificationNumber, DoB, TaxCountry,
  InvestmentTargets, FinancialStatus as FinancialStatusField, Education,
  Acknowledgement,
} from '@application/Fields';
import { ApplicationFormReducer, applicationFormState } from '@application/applicationForm.behavior';
import { GetDefaultValidation } from '@application/Validation';
import { Step2FieldNames, Step6FieldNames } from './Steps';
import Labels from './Labels';

export const initialApplication: IApplication = DefaultApplication;

export enum StepName {
  Disclaimer, Information, Experience,
  Targets, FinancialStatus, Contact,
  Fund, Sign,
}

export const StepNames = Object.keys(StepName).filter((key) => Number.isNaN(Number(key)));

export enum FetchStatus {
  Idle, Loading, Loaded, Saving, Saved, Error,
}

export const initialUiState = {
  loginMessage: Labels.LoginApplication,
  loggedOut: false,
  canStepBack: true,
  canStepNext: true,
  showBackAndNext: false,
  showErrorDialog: false,
  currentStep: null as StepName,
  pendingNextStep: null as StepName,
  numberOfSteps: StepNames.length,
  fetchStatus: FetchStatus.Idle,
  loadedApplication: false,
  completedFirstLoad: false,
  fetchError: '',
  savedApplication: initialApplication,
  validationMessages: GetDefaultValidation(initialApplication),
  wasValidatedByServer: false,
  invalidFields: [] as string[],
  validateFieldNamesByStepIndex: [
    [] as string[],
    Step2FieldNames,
    InvestmentExperience.validateFieldNames,
    InvestmentTargets.validateFieldNames,
    FinancialStatusField.validateFieldNames,
    Step6FieldNames,
    [] as string[],
    [] as string[],
  ],
};

export type UIState = typeof initialUiState;

export const rootState = {
  dataState: { app: initialApplication },
  uiState: initialUiState,
  applicationForm: applicationFormState,
};
export enum LoadingState {
  pending, fetching, succeeded, failed,
}

export type RootState = typeof rootState;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reducer = (state: RootState, action: PayloadAction<any>) => {
  const { dataState, uiState, applicationForm } = ApplicationFormReducer(state, action);
  const { app } = dataState;
  return ({
    dataState: {
      app: {
        ...app,
        applicantContact: {
          identificationNumber: IdentificationNumber.applicantReducer(app.applicantContact.identificationNumber, action),
          name: Name.applicantReducer(app.applicantContact, action).name,
          lastName: Name.applicantReducer(app.applicantContact, action).lastName,
          dateOfBirth: DoB.applicantReducer(app.applicantContact.dateOfBirth, action),
          phone: PhoneAndEmail.applicantReducer(app.applicantContact, action).phone,
          email: PhoneAndEmail.applicantReducer(app.applicantContact, action).email,
          legalAddress: Address.applicantReducer(app.applicantContact.legalAddress, action),
        },
        representativeContact: {
          identificationNumber: IdentificationNumber.representativeReducer(app.representativeContact.identificationNumber, action),
          name: Name.representativeReducer(app.representativeContact, action).name,
          lastName: Name.representativeReducer(app.representativeContact, action).lastName,
          dateOfBirth: app.representativeContact.dateOfBirth,
          phone: PhoneAndEmail.representativeReducer(app.representativeContact, action).phone,
          email: PhoneAndEmail.representativeReducer(app.representativeContact, action).email,
          mailingAddress: Address.representativeReducer(app.representativeContact.mailingAddress, action),
          legalAddress: app.representativeContact.legalAddress,
          educationLevel: Education.reducer(app.representativeContact, action).educationLevel,
          profession: Education.reducer(app.representativeContact, action).profession,
        },
        entityType: Personhood.reducer(app.entityType, action),
        taxCountry: TaxCountry.reducer(app.taxCountry, action),
        expectedInvestmentLengthInYears: InvestmentTargets.reducer(app, action).expectedInvestmentLengthInYears,
        expectedInvestmentLengthOther: InvestmentTargets.reducer(app, action).expectedInvestmentLengthOther,
        riskProfile: InvestmentTargets.reducer(app, action).riskProfile,
        investmentExperience: InvestmentExperience.reducer(app, action).investmentExperience,
        investmentExperienceOther: InvestmentExperience.reducer(app, action).investmentExperienceOther,
        incomeSource: FinancialStatusField.reducer(app, action).incomeSource,
        incomeSourceOther: FinancialStatusField.reducer(app, action).incomeSourceOther,
        incomeSize: FinancialStatusField.reducer(app, action).incomeSize,
        financialAssets: FinancialStatusField.reducer(app, action).financialAssets,
        financialCommitments: FinancialStatusField.reducer(app, action).financialCommitments,
        financialLiabilities: FinancialStatusField.reducer(app, action).financialLiabilities,
        assetTypes: FinancialStatusField.reducer(app, action).assetTypes,
        assetTypeOther: FinancialStatusField.reducer(app, action).assetTypeOther,
        checkedAuthorizedByEntity: FinancialStatusField.reducer(app, action).checkedAuthorizedByEntity,
        checkedAuthentic: Acknowledgement.reducer(app, action).checkedAuthentic,
        checkedNotUnlawful: Acknowledgement.reducer(app, action).checkedNotUnlawful,
        clickedToSign: Acknowledgement.reducer(app, action).clickedToSign,
      },
    },
    uiState,
    applicationForm,
  });
};
export const selectState = (state: RootState) => state;
export const selectApplication = (state: RootState) => selectState(state).dataState.app;
export const selectUI = (state: RootState) => selectState(state).uiState;
export const store = configureStore(({ reducer, preloadedState: rootState, middleware: [...getDefaultMiddleware({ serializableCheck: false, immutabilityCheck: false }), logger] }));
