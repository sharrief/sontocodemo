import React from 'react';
import {
  Form, Col, ToggleButtonGroup, ToggleButton, InputGroup, ColProps,
} from 'react-bootstrap/esm';
import type { FormControlProps } from 'react-bootstrap';
import { BankInfo as labels } from '@labels';
import { ValidationError } from 'class-validator';
import '@css/BankInfo.css';

export function Field(props: {
  label: string;
  col?: number;
  colSize?: ColProps;
  update: (value: string) => void;
  children?: JSX.Element[];
  validation?: ValidationError;
  rows?: number;
} & FormControlProps) {
  const {
    label, col, colSize, update, children, validation, rows, ...controlProps
  } = props;
  return <Form.Group as={Col} xs={col < 4 ? 6 : 12} md={col} {...colSize}>
    <Form.Label className='mb-2'>{label}</Form.Label>
    <InputGroup hasValidation>
      <Form.Control rows={rows} {...controlProps} onChange={({ target: { value } }) => update(value) } isInvalid={!!validation} />
      {children}
      {validation && <Form.Control.Feedback type='invalid'>{Object.keys(validation.constraints)
        .map((key) => validation.constraints[key]).join(' ')}</Form.Control.Feedback>}
    </InputGroup>
  </Form.Group>;
}

export function Choice(props: {
  id: string;
  name: string;
  label: string;
  colSize?: ColProps;
  value: string;
  disabled: boolean;
  choices: { label: string; value: string }[];
  update: (value: string) => void;
}) {
  const {
    name, label, value, choices, update, disabled, id, colSize,
  } = props;
  return <Form.Group as={Col} {...colSize} className='align-items-start'>
      <Form.Label className='mb-2'>{label}</Form.Label>
      <ToggleButtonGroup className='d-flex'
        id={id}
        type='radio' value={value} name={name}
        onChange={!disabled && update}
      >
      {choices.map(({ label: l, value: v }) => <ToggleButton
      id={`${id}-${l}`}
      key={v}
      value={v}
      variant={disabled ? 'outline-secondary' : 'primary'}
      >{l}</ToggleButton>)}
    </ToggleButtonGroup>
  </Form.Group>;
}

export function Select(props: {
  label: string;
  value: string;
  readonly?: boolean;
  disabled: boolean;
  update: (value: string) => void;
  col?: number;
  colSize?: ColProps;
  validation?: ValidationError;
  options: {[key: string]: string};
}) {
  const {
    label, value, update, disabled, readonly, col, colSize, validation, options,
  } = props;
  // !HACK
  if (colSize) {
    if (col) {
      colSize.xs = 12;
      colSize.md = col;
    }
  }
  return <Form.Group as={Col} {...colSize}>
  <Form.Label className='mb-2'>{label}</Form.Label>
  <InputGroup hasValidation>
  <Form.Control as='select' value={value} disabled={disabled} readOnly={readonly} onChange={({ target: { value: v } }) => !readonly && update(v) } isInvalid={!!validation}>
    <option value=''>{labels.selectFromTheList}</option>
    {Object.keys(options)
      .map((key: keyof typeof options) => <option key={key} value={key}>{`${options[key]} [${key}]`}</option>)}
  </Form.Control>
  {validation && <Form.Control.Feedback type='invalid'>{Object.keys(validation.constraints)
    .map((key) => validation.constraints[key]).join(' ')}</Form.Control.Feedback>}
  </InputGroup>
</Form.Group>;
}
