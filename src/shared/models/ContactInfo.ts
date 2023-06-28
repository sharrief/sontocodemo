/* eslint-disable @typescript-eslint/no-inferrable-types */
import {
  Length, IsEmail, IsPhoneNumber, ValidateNested, IsAlpha,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicantAddress, ApplicantBirthDate } from '@models';
import {
  IContactInfo, maxNameLength,
} from '@interfaces';
import { ContactInfoLabels as Labels } from '@validation';

export class ContactInfo implements IContactInfo {
  @Length(1, maxNameLength, { message: Labels.NameLengthInvalid(maxNameLength) })
  @IsAlpha('en-US', { message: Labels.NameCharacterInvalid })
  name: string = '';

  @Length(1, maxNameLength, { message: Labels.NameLengthInvalid(maxNameLength) })
  @IsAlpha('en-US', { message: Labels.NameCharacterInvalid })
  lastName: string = '';

  @Length(7, 50, { message: Labels.IdentificationNumberLengthInvalid })
  identificationNumber: string = '';

  @ValidateNested()
  @Type(() => ApplicantAddress)
  legalAddress = new ApplicantAddress();

  @ValidateNested()
  @Type(() => ApplicantBirthDate)
  dateOfBirth = new ApplicantBirthDate();

  @ValidateNested({ groups: ['representativeContact'] })
  @Type(() => ApplicantAddress)
  mailingAddress = new ApplicantAddress();

  @IsPhoneNumber(null, { message: Labels.PhoneInvalid })
  phone: string = '';

  @IsEmail({}, { message: Labels.EmailInvalid })
  email: string = '';

  @Length(5, 50, { groups: ['representativeContact'] })
  educationLevel?: string = '';

  @Length(5, 50, { groups: ['representativeContact'] })
  profession?: string = '';
}
