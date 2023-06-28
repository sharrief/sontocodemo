/* eslint-disable @typescript-eslint/no-inferrable-types */
export interface IApplicantAddress {

  line1: string;

  line2: string;

  city: string;

  province: string;

  country: string;

  postal: string;
}

export const DefaultApplicantAddress = {
  line1: '',
  line2: '',
  city: '',
  province: '',
  country: '',
  postal: '',
};
