export type ValidationMessageAndValue = {
  message: string;
  value: string;
  isValid: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isValidationMessageAndValue(obj: any): obj is ValidationMessageAndValue {
  if (obj && Object.keys(obj).includes('isValid') && Object.keys(obj).includes('message')) {
    return true;
  }
  return false;
}

export type NestedValidations<RootType> = {
  [k in keyof Partial<RootType>]: RootType[k] extends object ? NestedValidations<RootType[k]> : ValidationMessageAndValue;
}

export const ContactInfoLabels = {
  IdentificationNumberLengthInvalid: 'Identification number must be between 7 and 25 characters long.',
  NameLengthInvalid: (maxLength: number) => `Please enter the name using less than ${maxLength} letters.`,
  NameCharacterInvalid: 'Please enter the name using only letters.',
  PhoneInvalid: 'Please enter a valid phone number with the country code.',
  EmailInvalid: 'Please enter a valid email address.',
  EducationEmpty: 'Please specify an education level.',
  ProfessionEmpty: 'Please specify a profession.',
};

export const ApplicantBirthDateLabels = {
  MonthInvalid: 'Please specify a month number between 1 and 12.',
  DayInvalid: 'Please specify a day between 1 and 31.',
  YearInvalid: 'Please specify a year after 1800.',
};

export const ApplicationValidationLabels = {
  TaxCountry: 'Please choose a country from the country list.',
  InvestmentExperienceOther: 'Please specify investment experience.',
  ExpectedInvestmentLengthOther: 'Please specify an expected investment length.',
  AuthorizedByEntity: 'You must check this box to confirm you are authorized to act on behalf of the entity.',
  IncomeSourceOther: 'Please specify an income source.',
  AssetTypeOther: 'Please specify the asset type(s).',
  USDValueBracketEmpty: 'Please choose an option from the list.',
};

export const ApplicantAddressValidationLabels = {
  Length: 'Please enter between $constraint1 and $constraint2 letters or numbers.',
  Alpha: 'Please enter only letters.',
  Country: 'Please choose a country from the country list.',
  Alphanumeric: 'Please enter only letters and numbers.',
};

export function validatePassword(password: string) {
  const requirements: string[] = [];

  const hasCapLetter = password.match(/(?=.*[A-Z].*[A-Z])/);
  if (!hasCapLetter) { requirements.push('contain at least 2 capital letters'); }

  const hasLowerLetter = password.match(/(?=.*[a-z].*[a-z])/);
  if (!hasLowerLetter) requirements.push('contain at least 2 lower case letters');

  const hasNumber = password.match(/(?=.*\d.*\d)/);
  if (!hasNumber) requirements.push('contain at least 2 numbers');

  const hasSpecialCharacter = password.match(/(?=.*[!@#$%^&*()+\-?\/|_.,?<>{}\[\];:'"`\\=~ ].*[!@#$%^&*()+\-?\/|_.,?<>{}\[\];:'"`\\=~ ])/);
  if (!hasSpecialCharacter) requirements.push('contain at least 2 of the following special characters: !@#$%^&*+-=?.,<>()[]{}\\/|-_;:\'"`~');

  const isAtLeast12CharactersLong = password.match(/^.{12,100}$/);
  if (!isAtLeast12CharactersLong) requirements.push(`be between 12 and 100 characters long ${password.length < 12 ? `(${Math.abs(password.length - 12)} more needed)` : ''}${password.length > 100 ? `(${Math.abs(password.length - 100)} too many)` : ''}`);

  const containsOnlyAllowedCharacters = password.match(/^[a-zA-Z0-9!@#$%^&*()+\-?\/|_.,?<>{}\[\];:'"`\\=~ ]*$/);
  if (!containsOnlyAllowedCharacters) requirements.push('contain only letters numbers and the specified special characters');

  const startsOrEndsWithSpace = password.match(/(^\s|\s$)/);
  if (startsOrEndsWithSpace) requirements.push('not start or end with spaces');

  if (requirements.length) {
    return {
      requirements,
      valid: false,
    };
  }
  return { requirements: [], valid: true };
}
