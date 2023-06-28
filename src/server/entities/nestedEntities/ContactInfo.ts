/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Column } from 'typeorm';
import {
  Length, IsEmail, IsPhoneNumber, ValidateNested, IsAlpha, IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContactInfoLabels as Labels, ApplicantAddress, ApplicantBirthDate } from '@entities';
import {
  IContactInfo,
} from '@interfaces';

export const maxNameLength = 100;

export class ContactInfo implements IContactInfo {
  @Column()
  @Length(1, maxNameLength, { message: Labels.NameLengthInvalid(maxNameLength) })
  @IsAlpha('en-US', { message: Labels.NameCharacterInvalid })
  name: string = '';

  @Column()
  @Length(1, maxNameLength, { message: Labels.NameLengthInvalid(maxNameLength) })
  @IsAlpha('en-US', { message: Labels.NameCharacterInvalid })
  lastName: string = '';

  @Column()
  @Length(1, 50, { message: Labels.IdentificationNumberLengthInvalid })
  identificationNumber: string = '';

  @Column(() => ApplicantAddress)
  @ValidateNested()
  @Type(() => ApplicantAddress)
  legalAddress = new ApplicantAddress();

  @Column(() => ApplicantBirthDate)
  @ValidateNested()
  @Type(() => ApplicantBirthDate)
  dateOfBirth = new ApplicantBirthDate();

  @Column(() => ApplicantAddress)
  @ValidateNested()
  @Type(() => ApplicantAddress)
  @IsOptional()
  mailingAddress = new ApplicantAddress();

  @Column()
  @IsPhoneNumber(null, { message: Labels.PhoneInvalid })
  phone: string = '';

  @Column()
  @IsEmail({}, { message: Labels.EmailInvalid })
  email: string = '';

  @Column({ nullable: true })
  @Length(5, 50)
  @IsOptional()
  educationLevel?: string = '';

  @Column({ nullable: true })
  @Length(5, 50)
  @IsOptional()
  profession?: string = '';
}
