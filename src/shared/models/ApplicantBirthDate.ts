/* eslint-disable @typescript-eslint/no-inferrable-types */
import { IsInt, Min, Max } from 'class-validator';
import { DateTime } from 'luxon';
import { ApplicantBirthDateLabels as Labels } from '@validation';
import { IApplicantBirthDate } from '@interfaces';
import { allEntityTypes } from './Application';

export class ApplicantBirthDate implements IApplicantBirthDate {
  @IsInt({ ...allEntityTypes })
  @Min(1800, { message: Labels.YearInvalid, ...allEntityTypes })
  @Max(parseInt(DateTime.local().toFormat('yyyy'), 10), { message: Labels.YearInvalid, ...allEntityTypes })
  year: number = 0;

  @IsInt()
  @Max(12, { message: Labels.MonthInvalid, ...allEntityTypes })
  @Min(1, { message: Labels.MonthInvalid, ...allEntityTypes })
  month: number = 0;

  @IsInt()
  @Max(31, { message: Labels.DayInvalid, ...allEntityTypes })
  @Min(1, { message: Labels.DayInvalid, ...allEntityTypes })
  day: number = 0;
}
