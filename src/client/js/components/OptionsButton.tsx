import React from 'react';
import Button from 'react-bootstrap/esm/Button';
import { Activity } from '@labels';
import FilterList from '@mui/icons-material/FilterList';

export function OptionsButton(props: { expanded: boolean; onClick: () => void }) {
  const { expanded, onClick } = props;
  return <Button className='d-xl-none' onClick={onClick}>
  <span><FilterList/></span>
  <span className='d-none d-lg-inline'>{Activity.Filters}</span>
  <span className={expanded ? 'caret-up' : 'caret-down'}></span>
  <style>{`
  .caret-down {
    display: inline-block;
    width: 0;
    height: 0;
    margin-left: 5px;
    vertical-align: middle;
    border-top: 4px dashed;
    border-top: 4px solid;
    border-right: 4px solid transparent;
    border-left: 4px solid transparent;
  }
  .caret-up {
    display: inline-block;
    width: 0;
    height: 0;
    margin-left: 5px;
    vertical-align: middle;
    border-bottom: 4px dashed;
    border-bottom: 4px solid;
    border-right: 4px solid transparent;
    border-left: 4px solid transparent;
  }
  `}</style>
</Button>;
}
