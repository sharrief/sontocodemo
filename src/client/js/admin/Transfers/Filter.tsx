import React from 'react';
import { useDispatch } from 'react-redux';
import Form from 'react-bootstrap/Form';
import { Activity as ActivityLabels } from '@client/js/labels';
import { $enum } from 'ts-enum-util';
import ToggleButtonGroup from 'react-bootstrap/esm/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/esm/ToggleButton';
import InputGroup from 'react-bootstrap/esm/InputGroup';
import Col from 'react-bootstrap/esm/Col';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { RequestParams } from 'shared/api/admin.api';

function filterEnum<E extends string | number>({
  Enum, paramName, paramValue, setParamValue, enumIcons, type, label, disabled, loading,
}: {
  Enum: {[key: string]: E};
  label?: string;
  paramName: keyof RequestParams;
  paramValue: string|string[]|number|boolean;
  setParamValue: (key: keyof RequestParams, value: string|string[]) => void;
  enumIcons?: {[key: string]: JSX.Element};
  type?: 'radio' | 'checkbox';
  disabled?: boolean;
  loading?: boolean
}) {
  if (!Enum || typeof Enum !== 'object') return null;
  const setFilter = (value: string | string[]) => setParamValue(paramName, value);
  const options = Object.keys(Enum).map((status: keyof typeof Enum) => (
    <option key={status} value={Enum[status]}>{status}</option>
  ));

  if (type) {
    const typeProps = {
      radio: {
        type: 'radio',
        defaultValue: (paramValue ?? ''),
        value: paramValue as string,
      },
      checkbox: {
        type: 'checkbox',
        defaultValue: (paramValue ?? ''),
        value: paramValue as string[],
      },
    } as { [key: string]: { type: 'radio'; defaultValue: string } | { type: 'checkbox'; defaultValue: string[]}};

    if (enumIcons) {
      return (
        <ToggleButtonGroup as={Col} name={paramName} {...typeProps[type] }
        onChange={(newValue: (string)|(string)[]) => {
          if (type !== 'checkbox' && paramValue === newValue) return;
          if (type === 'checkbox') { setFilter(newValue as []); }
          if (type === 'radio') { setFilter(newValue as string); }
        }}>
          <ToggleButton id='filter-toggle-all' variant='outline-secondary' value='' disabled={loading || disabled}>
            <OverlayTrigger placement='top' overlay={<Tooltip id={`tooltip-${ActivityLabels.All}`}>{ActivityLabels.All}</Tooltip>}>
              <AllInclusiveIcon />
            </OverlayTrigger>
          </ToggleButton>
          {$enum(Enum).map((enumValue, key) => (enumIcons[enumValue]
            && <ToggleButton id={`filter-toggle-${key}`} key={key} variant='outline-secondary' value={enumValue} disabled={loading || disabled}>
              <OverlayTrigger placement='top' overlay={<Tooltip id={`tooltip-${enumValue}`}>{enumValue}</Tooltip>}>
              {enumIcons[enumValue]}
              </OverlayTrigger>
            </ToggleButton>))}
        </ToggleButtonGroup>
      );
    }

    return (
      <ToggleButtonGroup as={Col} name={paramName} {...typeProps[type]}
      onChange={(newValue: (string)|(string)[]) => {
        if (type !== 'checkbox' && paramValue === newValue) return;
        if (type === 'checkbox') { setFilter(newValue as []); }
        if (type === 'radio') { setFilter(newValue as string); }
      }}>
        <ToggleButton id={`${paramName}-all`} variant='outline-secondary' value='' disabled={loading || disabled}>{`${ActivityLabels.All}`}</ToggleButton>
        {$enum(Enum).map((enumValue, key) => <ToggleButton id={`${paramName}-${key}`} disabled={loading || disabled} variant='outline-secondary' key={key} value={enumValue}>
          {key}
        </ToggleButton>)}
      </ToggleButtonGroup>
    );
  }

  return (
  // <InputGroup className='w-100'>
  //     <InputGroup.Text>{label || `${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}`}</InputGroup.Text>
      <Form.Select
      value={`${paramValue}`}
      disabled={loading || disabled}
      onChange={({ target: { value: newValue } }: React.ChangeEvent<HTMLSelectElement>) => {
        if (paramValue === newValue) return;
        setFilter(newValue);
      } }
    >
      <option value=''>{ActivityLabels.All} {label}</option>
      {options}
    </Form.Select>
  // </InputGroup>
  );
}
export default React.memo(filterEnum) as typeof filterEnum;
