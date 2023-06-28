import React from 'react';
import '@client/css/Admin.css';
import {
  Route, Routes,
} from 'react-router-dom';
import AccountDetails from '@admin/Accounts/AccountDetails';
import { AdminTab } from '@store/state';
import AccountsList from './Accounts.Active.Table';

export default function AccountsRouter() {
  return <Routes>
    <Route path={`${AdminTab.Accounts}/:accountNumber`}
      element={<AccountDetails />}
    />
    <Route path={`${AdminTab.Accounts}`}
      element={<AccountsList />}
    />
  </Routes>;
}
