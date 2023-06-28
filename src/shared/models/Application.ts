/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable max-classes-per-file */
import {
  IApplication, IContactInfo, IApplicantAddress, IApplicantBirthDate, ApplicationStatus, ApplicantEntityType, IncomeSource, InvestmentInstrument, RiskProfile, IUser, USDValueBracket, AssetType, FieldNames,
} from '@interfaces';
import {
  ApplicationValidationLabels as Validation, isValidationMessageAndValue, NestedValidations, ValidationMessageAndValue,
} from '@validation';
import {
  Equals,
  IsBoolean, IsISO31661Alpha2, Length, NotEquals, ValidateIf, ValidateNested,
  validate,
} from 'class-validator';
import { plainToClass, Type } from 'class-transformer';
import { ApplicantContactInfo, RepresentativeContactInfo } from '@models';

export type ContactType = 'applicantContact' | 'representativeContact';
export enum ValidationGroup {
  Individual = 'individual',
  Corporation = 'corp',
  Applicant = 'applicant',
  Representative = 'representative'
}

export const allEntityTypes = {
  groups: [ValidationGroup.Individual, ValidationGroup.Corporation],
};

export const individualGroup = {
  groups: [ValidationGroup.Individual],
};

export const corporationGroup = {
  groups: [ValidationGroup.Corporation],
};

export const allApplicantTypes = {
  groups: [ValidationGroup.Applicant, ValidationGroup.Representative],
};

export const applicantGroup = {
  groups: [ValidationGroup.Applicant],
};

export const representativeGroup = {
  groups: [ValidationGroup.Applicant],
};

export class Application implements IApplication {
  static modelName = 'Application' as const;

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

  status: ApplicationStatus = ApplicationStatus.Created;

  note?: string = '';

  entityType: ApplicantEntityType = ApplicantEntityType.Individual;

  @ValidateNested({ groups: [ValidationGroup.Individual, ValidationGroup.Corporation, ValidationGroup.Applicant] })
  @Type(() => ApplicantContactInfo)
  applicantContact: ApplicantContactInfo = new ApplicantContactInfo();

  @ValidateNested({ ...allEntityTypes })
  @Type(() => RepresentativeContactInfo)
  representativeContact?: RepresentativeContactInfo = new RepresentativeContactInfo();

  @IsISO31661Alpha2({ message: Validation.TaxCountry, ...allEntityTypes })
  taxCountry: string = '';

  investmentExperience: InvestmentInstrument[];

  @Length(1, 254, { message: Validation.InvestmentExperienceOther, ...allEntityTypes })
  @ValidateIf((app: Application) => app.investmentExperience?.includes(InvestmentInstrument.Other), { ...allEntityTypes })
  investmentExperienceOther: string = '';

  expectedInvestmentLengthInYears: number = 3;

  @Length(1, 254, { message: Validation.ExpectedInvestmentLengthOther, ...allEntityTypes })
  @ValidateIf((app: Application) => app.expectedInvestmentLengthInYears === 0, { ...allEntityTypes })
  expectedInvestmentLengthOther: string = '';

  riskProfile: RiskProfile = RiskProfile.Average;

  @IsBoolean()
  @Equals(true, { message: Validation.AuthorizedByEntity, ...corporationGroup })
  @ValidateIf((app: Application) => app.entityType !== ApplicantEntityType.Individual)
  checkedAuthorizedByEntity?: boolean = false;

  incomeSource: IncomeSource = IncomeSource.Active ;

  @ValidateIf((app: Application) => app.incomeSource === IncomeSource.Other, { ...allEntityTypes })
  @Length(1, 254, { message: Validation.IncomeSourceOther, ...allEntityTypes })
  incomeSourceOther?: string = '';

  @NotEquals(USDValueBracket.Empty, { message: Validation.USDValueBracketEmpty, ...allEntityTypes })
  incomeSize: USDValueBracket = USDValueBracket.Empty;

  @NotEquals(USDValueBracket.Empty, { message: Validation.USDValueBracketEmpty, ...allEntityTypes })
  financialCommitments: USDValueBracket = USDValueBracket.Empty;

  @NotEquals(USDValueBracket.Empty, { message: Validation.USDValueBracketEmpty, ...allEntityTypes })
  financialAssets: USDValueBracket = USDValueBracket.Empty;

  @NotEquals(USDValueBracket.Empty, { message: Validation.USDValueBracketEmpty, ...allEntityTypes })
  financialLiabilities: USDValueBracket = USDValueBracket.Empty;

  assetTypes: AssetType[];

  @ValidateIf((app: Application) => app.assetTypes?.includes(AssetType.Other), { ...allEntityTypes })
  @Length(1, 254, { message: Validation.AssetTypeOther, ...allEntityTypes })
  assetTypeOther?: string = '';

  hasReadDisclaimer: boolean = false;

  checkedAuthentic: boolean = false;

  checkedNotUnlawful: boolean = false;

  clickedToSign: boolean = false;

  documentLink?: string = '';

  static async getValidationMessages(app: IApplication, ignoreEmptyValues = false) {
    let application = app;
    if (!(application instanceof Application)) {
      application = plainToClass(Application, app);
    }
    const groups: ValidationGroup[] = [];
    if (application.entityType === ApplicantEntityType.Individual) {
      groups.push(ValidationGroup.Individual);
    }
    if ([ApplicantEntityType.Corporation, ApplicantEntityType.Foundation].includes(application.entityType)) {
      groups.push(ValidationGroup.Corporation);
    }
    const messageArray = await validate(application, { groups, validationError: { target: false }, forbidUnknownValues: true });
    //* Transform ValidationError[] into shape of the Application
    const wherePropIs = (prop: string) => (({ property }: {property: string}) => property === prop);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereValueIsPrimitive = ({ value }: any) => typeof value !== 'object';

    const getContactTypeValidationMessages = (contactType: ContactType) => messageArray
      .find(wherePropIs(FieldNames.Application[contactType]));

    const spreadRootContactTypeValidationErrors = (contactType: ContactType) => getContactTypeValidationMessages(contactType)
      ?.children.filter(whereValueIsPrimitive).reduce((validations,
        { property, constraints, value }) => ({
        ...validations,
        [FieldNames.ContactInfo[property as keyof IContactInfo]]: {
          message: Object.keys(constraints).map((k) => constraints[k]).join(' '),
          value,
          isValid: (ignoreEmptyValues && !value) ? true : !Object.keys(constraints).length,
        },
      }), {} as {[k in keyof IContactInfo]: ValidationMessageAndValue});

    const getContactTypeDateOfBirthValidationErrors = (contactType: ContactType) => getContactTypeValidationMessages(contactType)
      ?.children.find(wherePropIs(FieldNames.ContactInfo.dateOfBirth))?.children.filter(whereValueIsPrimitive)
      .reduce((applicantDoBValidations,
        { property, constraints, value }) => ({
        ...applicantDoBValidations,
        [FieldNames.ApplicantBirthDate[property as keyof IApplicantBirthDate]]: {
          message: Object.keys(constraints).map((k) => constraints[k]).join(' '),
          value,
          isValid: (ignoreEmptyValues && !value) ? true : !Object.keys(constraints).length,
        },
      }), {} as {[k in keyof IApplicantBirthDate]: ValidationMessageAndValue});

    const getAddressValidationErrors = (contactType: ContactType, fieldName: keyof Pick<IContactInfo, 'legalAddress'|'mailingAddress'>) => getContactTypeValidationMessages(contactType)
      ?.children.find(wherePropIs(FieldNames.ContactInfo[fieldName]))?.children.filter(whereValueIsPrimitive)
      .reduce((addressValidations, { property, constraints, value }) => ({
        ...addressValidations,
        [FieldNames.ApplicantAddress[property as keyof IApplicantAddress]]: {
          message: Object.keys(constraints).map((k) => constraints[k]).join(' '),
          value,
          isValid: (ignoreEmptyValues && !value) ? true : !Object.keys(constraints).length,
        },
      }), {} as NestedValidations<IApplicantAddress>);

    const getOtherValidationErrors = (fieldName: keyof Pick<Application,
      'taxCountry' | 'expectedInvestmentLengthOther' | 'incomeSourceOther' | 'investmentExperienceOther'
      | 'assetTypeOther' | 'checkedAuthorizedByEntity' | 'incomeSize' | 'financialAssets'
      | 'financialCommitments' | 'financialLiabilities'
      >) => {
      const prop = messageArray.find(wherePropIs(fieldName));
      if (prop) {
        const { value, constraints } = prop;
        return {
          value,
          message: Object.keys(constraints).map((k) => constraints[k]).join(' '),
          isValid: (ignoreEmptyValues && !value) ? true : !Object.keys(constraints).length,

        };
      }
      return {
        message: null, value: null, isValid: true,
      };
    };

    const applicationValidations: NestedValidations<IApplication> = {
      [FieldNames.Application.taxCountry]: getOtherValidationErrors('taxCountry'),
      [FieldNames.Application.expectedInvestmentLengthOther]: getOtherValidationErrors('expectedInvestmentLengthOther'),
      [FieldNames.Application.investmentExperienceOther]: getOtherValidationErrors('investmentExperienceOther'),
      [FieldNames.Application.incomeSourceOther]: getOtherValidationErrors('incomeSourceOther'),
      [FieldNames.Application.assetTypeOther]: getOtherValidationErrors('assetTypeOther'),
      [FieldNames.Application.checkedAuthorizedByEntity]: getOtherValidationErrors('checkedAuthorizedByEntity'),
      [FieldNames.Application.incomeSize]: getOtherValidationErrors('incomeSize'),
      [FieldNames.Application.financialAssets]: getOtherValidationErrors('financialAssets'),
      [FieldNames.Application.financialCommitments]: getOtherValidationErrors('financialCommitments'),
      [FieldNames.Application.financialLiabilities]: getOtherValidationErrors('financialLiabilities'),
    };
    function createShapeFromObject<T>(object: T): {[key in keyof T]: ValidationMessageAndValue} {
      return Object.keys(object).reduce((shape, key) => ({
        ...shape,
        [key]: { message: null, value: null, isValid: true },
      }), {} as {[key in keyof T]: ValidationMessageAndValue});
    }
    const rootApplicantValidationErrors = {
      ...createShapeFromObject(app.applicantContact),
      ...spreadRootContactTypeValidationErrors('applicantContact'),
    };
    const applicantDateOfBirthErrors = {
      ...createShapeFromObject(app.applicantContact.dateOfBirth),
      ...getContactTypeDateOfBirthValidationErrors('applicantContact'),
    };
    const applicantLegalAddressErrors = {
      ...createShapeFromObject(app.applicantContact.legalAddress),
      ...getAddressValidationErrors('applicantContact', 'legalAddress'),
    };
    applicationValidations.applicantContact = {
      ...rootApplicantValidationErrors,
      dateOfBirth: applicantDateOfBirthErrors,
      legalAddress: applicantLegalAddressErrors,
      mailingAddress: null,
    };
    const rootRepresentativeValidationErrors = {
      ...createShapeFromObject(app.representativeContact),
      ...spreadRootContactTypeValidationErrors('representativeContact'),
    };
    const representativeDateOfBirthErrors = {
      ...createShapeFromObject(app.representativeContact.dateOfBirth),
      ...getContactTypeDateOfBirthValidationErrors('representativeContact'),
    };
    const representativeAddressErrors = {
      ...createShapeFromObject(app.representativeContact.mailingAddress),
      ...getAddressValidationErrors('representativeContact', 'mailingAddress'),
    };
    applicationValidations.representativeContact = {
      ...rootRepresentativeValidationErrors,
      dateOfBirth: representativeDateOfBirthErrors,
      mailingAddress: representativeAddressErrors,
      legalAddress: null,
    };
    return applicationValidations;
  }

  static ValidationIsInValid(validation: ValidationMessageAndValue) {
    return validation?.message;
  }

  static NestedValidationIsInvalid<T>(obj: NestedValidations<T>): boolean|string {
    if (!obj) return false;
    return Object.keys(obj).reduce((isInvalid, key) => {
      if (isInvalid) return isInvalid;
      const val = obj[key as keyof T];
      if (isValidationMessageAndValue(val)) {
        return Application.ValidationIsInValid(val);
      }
      return Application.NestedValidationIsInvalid(val as NestedValidations<T[keyof T]>);
    }, false);
  }
}
