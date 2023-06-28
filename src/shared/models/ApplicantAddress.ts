/* eslint-disable @typescript-eslint/no-inferrable-types */
import {
  IsISO31661Alpha2,
  IsOptional,
  Length, ValidateIf,
} from 'class-validator';
import { ApplicantAddressValidationLabels as Validation } from '@validation';
import { IApplicantAddress } from '@interfaces';
import { allEntityTypes, representativeGroup } from './Application';

export const maxAddressPartLength = 50;

export class ApplicantAddress implements IApplicantAddress {
  @Length(10, maxAddressPartLength, { message: Validation.Length, ...allEntityTypes })
  @IsOptional({ ...representativeGroup })
  line1: string = '';

  @Length(2, maxAddressPartLength, { message: Validation.Length, ...allEntityTypes })
  @ValidateIf((_address, line2) => line2 !== '', { ...allEntityTypes })
  @IsOptional({ ...representativeGroup })
  line2: string = '';

  @Length(2, maxAddressPartLength, { message: Validation.Length, ...allEntityTypes })
  @IsOptional({ ...representativeGroup })
  city: string = '';

  @Length(2, maxAddressPartLength, { message: Validation.Length, ...allEntityTypes })
  @ValidateIf((_address, province) => province !== '', { ...allEntityTypes })
  @IsOptional({ ...representativeGroup })
  province: string = '';

  @IsISO31661Alpha2({ message: Validation.Country, ...allEntityTypes })
  @IsOptional({ ...representativeGroup })
  country: string = '';

  @ValidateIf(({ postal }) => postal !== '', { ...allEntityTypes })
  @Length(3, maxAddressPartLength, { message: Validation.Length, ...allEntityTypes })
  @IsOptional({ ...representativeGroup })
  postal: string = '';
}
