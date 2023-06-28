/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Column } from 'typeorm';
import {
  Length, IsAlpha, IsAlphanumeric, ValidateIf,
} from 'class-validator';
import { ApplicantAddressValidationLabels as Validation } from '@entities';
import { IApplicantAddress } from '@interfaces';

export const maxAddressPartLength = 50;

export class ApplicantAddress implements IApplicantAddress {
  @Column()
  @Length(10, maxAddressPartLength, { message: Validation.Length })
  @IsAlphanumeric('en-US', { message: Validation.Alphanumeric })
  line1: string = '';

  @Column()
  @ValidateIf((_address, line2) => !!line2)
  @IsAlphanumeric('en-US', { message: Validation.Alphanumeric })
  line2: string = '';

  @Column()
  @Length(1, maxAddressPartLength, { message: Validation.Length })
  @IsAlphanumeric('en-US', { message: Validation.Alphanumeric })
  city: string = '';

  @Column()
  @Length(5, maxAddressPartLength, { message: Validation.Length })
  @ValidateIf((_address, province) => !!province)
  @IsAlphanumeric('en-US', { message: Validation.Alphanumeric })
  province: string = '';

  @Column()
  @Length(5, maxAddressPartLength, { message: Validation.Length })
  @IsAlpha('en-US', { message: Validation.Alpha })
  country: string = '';

  @Column()
  @Length(1, maxAddressPartLength, { message: Validation.Length })
  @ValidateIf((_address, postal) => !!postal)
  @IsAlphanumeric('en-US', { message: Validation.Alphanumeric })
  postal: string = '';
}
