import {
  IApplication, IApplicantAddress, IContactInfo, IApplicantBirthDate,
} from '@interfaces';

export const Application: {[key in keyof IApplication]: string} = {
  id: 'id',
  uuid: 'uuid',
  deleted: 'deleted',
  fmId: 'fmId',
  manager: 'manager',
  userId: 'userId',
  user: 'user',
  authEmail: 'authEmail',
  managerEmail: 'managerEmail',
  managerName: 'managerName',
  appPIN: 'appPIN',
  dateCreated: 'dateCreated',
  Started: 'Started',
  dateEnded: 'dateEnded',
  status: 'status',
  note: 'note',
  entityType: 'entityType',
  applicantContact: 'applicantContact',
  representativeContact: 'representativeContact',
  taxCountry: 'taxCountry',
  investmentExperience: 'investmentExperience',
  expectedInvestmentLengthInYears: 'expectedInvestmentLengthInYears',
  expectedInvestmentLengthOther: 'expectedInvestmentLengthOther',
  riskProfile: 'riskProfile',
  checkedAuthorizedByEntity: 'checkedAuthorizedByEntity',
  incomeSource: 'incomeSource',
  incomeSourceOther: 'incomeSourceOther',
  incomeSize: 'incomeSize',
  investmentExperienceOther: 'investmentExperienceOther',
  financialCommitments: 'financialCommitments',
  financialAssets: 'financialAssets',
  financialLiabilities: 'financialLiabilities',
  assetTypes: 'assetTypes',
  assetTypeOther: 'assetTypeOther',
  hasReadDisclaimer: 'hasReadDisclaimer',
  checkedAuthentic: 'checkedAuthentic',
  checkedNotUnlawful: 'checkedNotUnlawful',
  clickedToSign: 'clickedToSign',
  documentLink: 'documentLink',
};

export const ContactInfo: {[key in keyof IContactInfo]: string} = {
  name: 'name',
  lastName: 'lastName',
  identificationNumber: 'identificationNumber',
  legalAddress: 'legalAddress',
  dateOfBirth: 'dateOfBirth',
  mailingAddress: 'mailingAddress',
  phone: 'phone',
  email: 'email',
  educationLevel: 'educationLevel',
  profession: 'profession',
};

export const ApplicantAddress: {[key in keyof IApplicantAddress]: string} = {
  line1: 'line1',
  line2: 'line2',
  city: 'city',
  province: 'province',
  country: 'country',
  postal: 'postal',
};

export const ApplicantBirthDate: {[key in keyof IApplicantBirthDate]: string} = {
  year: 'year',
  month: 'month',
  day: 'day',
};
