import 'reflect-metadata';
import {
  IsAlphanumeric,
  Length, Matches, IsISO31661Alpha2, ValidateIf,
} from 'class-validator';

const maxAddressPartLength = 50;
const lengthValidation = 'Please enter between $constraint1 and $constraint2 characters.';

export class AddressModel {
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9.\s-,]*[a-zA-Z0-9.]$/, { message: 'The characters may only be letters, numbers, periods, commas or dashes.' })
  @Length(10, maxAddressPartLength, { message: lengthValidation })
  line1: string;

  @Length(2, maxAddressPartLength, { message: lengthValidation })
  @ValidateIf((_address, line2) => line2 !== '')
  line2: string;

  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9.\s-]*[a-zA-Z0-9.]$/, { message: 'The characters may only be letters, numbers, periods or dashes.' })
  @Length(2, maxAddressPartLength, { message: lengthValidation })
  city: string;

  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9.\s-]*[a-zA-Z0-9.]$/, { message: 'The characters may only be letters, numbers, periods or dashes.' })
  @Length(2, maxAddressPartLength, { message: lengthValidation })
  @ValidateIf(({ isDomestic }) => isDomestic)
  state: string;

  @IsISO31661Alpha2({ message: 'Please select a valid country from the list.' })
  @ValidateIf(({ isDomestic }) => !isDomestic)
  country: string;

  @ValidateIf(({ postal }) => postal !== '')
  @Length(3, maxAddressPartLength, { message: lengthValidation })
  @IsAlphanumeric('en-US', { message: 'The characters may only be letters, numbers.' })
  postal: string;

  isDomestic: boolean;
}
