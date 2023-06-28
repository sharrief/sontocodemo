/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Column } from 'typeorm';
import { IsInt, Min, Max } from 'class-validator';
import { DateTime } from 'luxon';
import { ApplicantBirthDateLabels as Labels } from '@entities';
import { IApplicantBirthDate } from '@interfaces';

export class ApplicantBirthDate implements IApplicantBirthDate {
  @Column()
  @IsInt()
  @Min(1800, { message: Labels.YearInvalid })
  @Max(parseInt(DateTime.local().toFormat('yyyy'), 10), { message: Labels.YearInvalid })
  year: number = 0;

  @Column()
  @IsInt()
  @Max(12, { message: Labels.MonthInvalid })
  @Min(1, { message: Labels.MonthInvalid })
  month: number = 0;

  @Column()
  @IsInt()
  @Max(31, { message: Labels.DayInvalid })
  @Min(1, { message: Labels.DayInvalid })
  day: number = 0;
}
