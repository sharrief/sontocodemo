import React from 'react';
import Form from 'react-bootstrap/Form';
import { NestedValidations } from '@validation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const propValidation = <A extends {[x: string]: any }, V extends NestedValidations<A>, K extends keyof A>(savedData: A, validations: V, name: K, wasValidatedByServer: boolean, placeholder: string | number | boolean = '') => {
  const isInvalid = (!validations[name]?.isValid && validations[name]?.message && (wasValidatedByServer || (savedData[name] !== placeholder))) || false;
  const isValid = (!isInvalid && !validations[name]?.message && validations[name]?.isValid && (savedData[name] && savedData[name] !== placeholder)) || false;
  return ({ isInvalid, isValid });
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ValidationFeedback = <A extends {[x: string]: any}, V extends NestedValidations<A>, K extends keyof A>({ name, validations }: {name: K; validations: V}) => (
  <Form.Control.Feedback type="invalid">
    {validations[name]?.message}
  </Form.Control.Feedback>
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function GetDefaultValidation<A extends {[x: string]: any}>(obj: A): NestedValidations<A> {
  return Object.keys(obj).reduce((nestedValidations, key) => {
    if (typeof obj[key] === 'object') {
      return { ...nestedValidations, [key]: GetDefaultValidation(obj[key]) };
    }
    return { ...nestedValidations, [key]: null };
  }, {} as NestedValidations<A>);
}
