/* eslint-disable @typescript-eslint/no-inferrable-types */
import {
  IApplicantAddress, IApplicantBirthDate,
} from '@interfaces';
import { DefaultApplicantAddress } from './IApplicantAddress';
import { DefaultApplicantBirthDate } from './IApplicantBirthDate';

export const maxNameLength = 100;

export interface IContactInfo {

  name: string;

  lastName: string;

  identificationNumber: string;

  legalAddress?: IApplicantAddress;

  dateOfBirth?: IApplicantBirthDate;

  mailingAddress?: IApplicantAddress;

  phone: string;

  email: string;

  educationLevel?: string;

  profession?: string;
}

export const DefaultContactInfo: IContactInfo = {
  name: '',
  lastName: '',
  identificationNumber: '',
  legalAddress: DefaultApplicantAddress,
  dateOfBirth: DefaultApplicantBirthDate,
  mailingAddress: DefaultApplicantAddress,
  phone: '+',
  email: '',
};
