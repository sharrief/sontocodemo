/* eslint-disable @typescript-eslint/no-inferrable-types */
import {
  Length, IsEmail, IsPhoneNumber, ValidateNested, IsAlpha,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicantAddress } from '@models';
import {
  IContactInfo, maxNameLength,
} from '@interfaces';
import { ContactInfoLabels as Labels } from '@validation';
import { allEntityTypes } from './Application';

export class RepresentativeContactInfo implements IContactInfo {
  @Length(1, maxNameLength, { message: Labels.NameLengthInvalid(maxNameLength), ...allEntityTypes })
  @IsAlpha('en-US', { message: Labels.NameCharacterInvalid })
  name: string = '';

  @Length(1, maxNameLength, { message: Labels.NameLengthInvalid(maxNameLength), ...allEntityTypes })
  @IsAlpha('en-US', { message: Labels.NameCharacterInvalid })
  lastName: string = '';

  @Length(7, 50, { message: Labels.IdentificationNumberLengthInvalid, ...allEntityTypes })
  identificationNumber: string = '';

  @ValidateNested({ ...allEntityTypes })
  @Type(() => ApplicantAddress)
  mailingAddress = new ApplicantAddress();

  @IsPhoneNumber(null, { message: Labels.PhoneInvalid, ...allEntityTypes })
  phone: string = '';

  @IsEmail({}, { message: Labels.EmailInvalid, ...allEntityTypes })
  email: string = '';

  @Length(2, 50, { message: Labels.EducationEmpty, ...allEntityTypes })
  educationLevel: string = '';

  @Length(2, 50, { message: Labels.ProfessionEmpty, ...allEntityTypes })
  profession: string = '';
}
