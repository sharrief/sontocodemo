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
import { allEntityTypes, individualGroup } from './Application';

export class ApplicantContactInfo implements IContactInfo {
  @Length(1, maxNameLength, { message: Labels.NameLengthInvalid(maxNameLength), ...allEntityTypes })
  @IsAlpha('en-US', { message: Labels.NameCharacterInvalid })
  name: string = '';

  @Length(1, maxNameLength, { message: Labels.NameLengthInvalid(maxNameLength), ...individualGroup })
  @IsAlpha('en-US', { message: Labels.NameCharacterInvalid, ...individualGroup })
  lastName: string = '';

  @Length(7, 50, { message: Labels.IdentificationNumberLengthInvalid, ...allEntityTypes })
  identificationNumber: string = '';

  @ValidateNested({ ...allEntityTypes })
  @Type(() => ApplicantAddress)
  legalAddress = new ApplicantAddress();

  @ValidateNested({ ...individualGroup })
  @Type(() => ApplicantBirthDate)
  dateOfBirth = new ApplicantBirthDate();

  @IsPhoneNumber(null, { message: Labels.PhoneInvalid, ...allEntityTypes })
  phone: string = '';

  @IsEmail({}, { message: Labels.EmailInvalid, ...allEntityTypes })
  email: string = '';
}
