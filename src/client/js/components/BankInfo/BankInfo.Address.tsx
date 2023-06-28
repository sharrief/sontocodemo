import React from 'react';
import {
  IBankDatumTrimmed,
} from '@interfaces';
import { BankInfo as labels } from '@labels';
import { ValidationError } from 'class-validator';
import '@css/BankInfo.css';
import USStates from '@USStates';
import { Field, Select } from './BankInfo.Field';
import { countryObject } from './BankInfo.Countries';

export function Address(props: {
  update: (value: IBankDatumTrimmed['address']) => void;
  address: IBankDatumTrimmed['address'];
  disabled: boolean;
  validations?: ValidationError[];
}) {
  const {
    update, address, disabled, validations,
  } = props;
  const {
    line1, city, country, state, postal,
  } = address || {};
  const isInternational = country !== 'US';

  const getValidationsForProp = (propName: keyof IBankDatumTrimmed['address']) => validations?.find(({ property }) => property === propName);
  return <>
      <Field
        label={labels.addressStreet}
        value={line1}
        disabled={disabled}
        update={(value) => update({ ...address, line1: value })}
        col={12}
        validation={getValidationsForProp('line1')}
      />
      <Field
        label={labels.addressCity}
        value={city}
        disabled={disabled}
        update={(value) => update({ ...address, city: value })}
        colSize={{ xs: 6, lg: 4 }}
        validation={getValidationsForProp('city')}
      />
      {!isInternational && <Select
        label={labels.addressState}
        value={state}
        disabled={disabled}
        update={(value) => update({ ...address, state: value })}
        colSize={{ xs: 6, lg: 4 }}
        validation={getValidationsForProp('state')}
        options={USStates}
      />}
      {isInternational && <Field
        label={labels.addressState}
        value={state}
        disabled={disabled}
        update={(value) => update({ ...address, state: value })}
        colSize={{ xs: 6, lg: 4 }}
        validation={getValidationsForProp('state')}
      />}

      <Field
        label={labels.addressPostal(!isInternational)}
        value={postal}
        disabled={disabled}
        update={(value) => update({ ...address, postal: value })}
        colSize={{ xs: 6, lg: 4 }}
        validation={getValidationsForProp('postal')}
      />
  </>;
}
