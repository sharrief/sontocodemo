import {
  IBaseEntityRecord, IContactInfo, ApplicationStatus, ApplicantEntityType, IncomeSource, InvestmentInstrument, RiskProfile, IUser, AssetType,
} from '@interfaces';
import { USDValueBracket } from './Enums';
import { DefaultContactInfo } from './IContactInfo';

export type ContactType = 'applicantContact' | 'representativeContact';

export interface IApplication extends IBaseEntityRecord {
  deleted: boolean;

  id: number;

  uuid: string;

  fmId: number;

  manager?: IUser;

  userId?: number;

  user?: IUser;

  authEmail: string;

  managerEmail: string;

  managerName: string;

  appPIN: string;

  dateCreated: number;

  Started: number;

  dateEnded: number;

  status: ApplicationStatus;

  note?: string;

  entityType: ApplicantEntityType;

  applicantContact: IContactInfo;

  representativeContact?: IContactInfo;

  taxCountry: string ;

  investmentExperience: InvestmentInstrument[];

  investmentExperienceOther: string ;

  expectedInvestmentLengthInYears: number;

  expectedInvestmentLengthOther: string ;

  riskProfile: RiskProfile ;

  checkedAuthorizedByEntity?: boolean;

  incomeSource: IncomeSource ;

  incomeSourceOther?: string ;

  incomeSize: USDValueBracket ;

  financialCommitments: USDValueBracket;

  financialAssets: USDValueBracket ;

  financialLiabilities: USDValueBracket ;

  assetTypes: AssetType[];

  assetTypeOther?: string ;

  hasReadDisclaimer: boolean;

  checkedAuthentic: boolean;

  checkedNotUnlawful: boolean;

  clickedToSign: boolean;

  documentLink?: string;
}

export const DefaultApplication: IApplication = {
  id: 0,
  uuid: '',
  deleted: false,
  fmId: 0,
  authEmail: '',
  managerEmail: '',
  managerName: '',
  appPIN: '',
  dateCreated: 0,
  Started: 0,
  dateEnded: 0,
  status: ApplicationStatus.Created,
  entityType: ApplicantEntityType.Individual,
  applicantContact: DefaultContactInfo,
  representativeContact: DefaultContactInfo,
  taxCountry: '',
  investmentExperience: [],
  investmentExperienceOther: '',
  expectedInvestmentLengthInYears: 0,
  expectedInvestmentLengthOther: '',
  riskProfile: RiskProfile.Average,
  incomeSource: IncomeSource.Active,
  incomeSize: USDValueBracket.Empty,
  financialCommitments: USDValueBracket.Empty,
  financialAssets: USDValueBracket.Empty,
  financialLiabilities: USDValueBracket.Empty,
  assetTypes: [],
  hasReadDisclaimer: false,
  checkedAuthentic: false,
  checkedNotUnlawful: false,
  clickedToSign: false,
};
