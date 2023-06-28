import React, { useState, ForwardRefRenderFunction } from 'react';
import * as CSS from 'csstype';
import Dropdown from 'react-bootstrap/Dropdown';
import FormControl from 'react-bootstrap/FormControl';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import {
  useSelector,
} from 'react-redux';
import {
  NavLink as RouterLink,
} from 'react-router-dom';
import { CombinedState, Variant } from '@store/state';
import { dropDownLabels as labels } from '@client/js/labels';
import { createSelector } from 'reselect';
import { Button } from 'react-bootstrap';
import { DropdownToggleProps } from 'react-bootstrap/esm/DropdownToggle';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { endpoints } from '@api';
import { IUserTrimmed } from '@interfaces';
import { useAccounts, useActivityCount } from '../admin/admin.store';

type DropDownProps = { tab: string, currentAccount: IUserTrimmed };

const selector = createSelector([
  (state: CombinedState) => state.data.currentAccount,
], (currentAccount) => ({ currentAccount }));

const CustomDropdownMenuFunction: ForwardRefRenderFunction<HTMLDivElement, {
  children?: React.ReactNode;
  style?: CSS.Properties;
  className?: string;
  tab?: string;
  }> = (
    { style, className, tab }, ref,
  ) => {
    const [searchString, setSearchString] = useState('');
    const { accounts } = useAccounts();
    const { operationRequestPendingCounts, countsLoading } = useActivityCount();
    const { currentAccount } = useSelector(selector);
    const accountCounts = accounts
      .filter(({ displayName, accountNumber }) => !searchString || (`${displayName} ${accountNumber}`)
        .toLowerCase().search(searchString.toLowerCase().trim()) > -1)
      .map(({ id: userId, displayName, accountNumber }) => {
        const count = operationRequestPendingCounts?.[userId];
        return {
          count,
          userId,
          accountNumber,
          displayName,
        };
      });
    return (
      <div
        ref={ref}
        style={style}
        className={`${className} mh-100vh`}
        >
        <FormControl
          autoFocus
          className="mx-3 w-auto"
          placeholder={labels.filterPlaceholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchString(
            e.currentTarget.value,
          )}
          value={searchString}
        />
        <ul className="list-unstyled" style={{ maxHeight: '300px', maxWidth: '350px', overflow: 'scroll' }}>
          {accountCounts
            .map(({
              userId, displayName, accountNumber, count,
            }) => (
                <Dropdown.Item
                  as={RouterLink}
                  key={`${accountNumber}-${userId}`}
                  active={accountNumber === currentAccount.accountNumber} eventKey={`${accountNumber}`}
                  to={`${endpoints.dashboard}/${accountNumber}/${tab}`}
                  style={{ fontSize: '.75em' }}
                >
                    {`${displayName} | ${accountNumber}`}
                  &nbsp;
                  {countsLoading
                    ? <Spinner size='sm' animation='grow'/>
                    : <Badge style={{ display: count ? '' : 'none' }} bg={Variant.Info}>
                        {count}
                      </Badge>
                  }
                </Dropdown.Item>
            ))}
        </ul>
      </div>
    );
  };
const CustomDropdownMenu = React.forwardRef(CustomDropdownMenuFunction);

const CustomToggle = React.forwardRef<HTMLButtonElement, DropdownToggleProps>(function CustomToggle({ children, onClick }, ref) {
  return (
  <Button
    ref={ref}
    onClick={(e) => {
      onClick(e);
    }}
  >
    {children}
  </Button>
  );
});

export function DropDownComponent({
  tab, currentAccount,
}: DropDownProps) {
  const { accounts } = useAccounts();
  return (
      <Dropdown>
        <Dropdown.Toggle as={CustomToggle} style={{ maxWidth: '100%' }} id="account-selector-dropdown">
          {`${currentAccount.displayName} | ${currentAccount.accountNumber}`} {accounts.length > 1 ? <ArrowDropDownIcon style={{ marginRight: '-10px' }}/> : null}
        </Dropdown.Toggle>
        {
          accounts.length > 1
            ? <Dropdown.Menu as={CustomDropdownMenu} tab={tab}/>
            : null
        }
      </Dropdown>
  );
}

DropDownComponent.displayName = 'DropDown';
export default DropDownComponent;
