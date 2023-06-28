import React from 'react';
import NumberFormat, { NumberFormatProps } from 'react-number-format';
import { FormControlProps } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';

export const Currency: React.FunctionComponent<FormControlProps & {onValueChange: NumberFormatProps['onValueChange']}> = (props) => <Form.Control {...props}
    {...{
      as: NumberFormat,
      displayType: 'input',
      decimalScale: 2,
      fixedDecimalScale: true,
      thousandSeparator: true,
      allowNegative: true,
      allowLeadingZeros: false,
    }}
  />;
