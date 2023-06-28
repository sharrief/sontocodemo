import React from 'react';
import '@client/css/Admin.css';
import {
  Route, Routes,
} from 'react-router-dom';
import { TransferList } from '@admin/Transfers/TransferList';
import { TransferDialog } from '@admin/Transfers/TransferList/TransferDialog';
import { AdminTab } from '@store/state';
import { RequestQueryProvider } from './TransferList/RequestParameters.Provider';

const component = () => (
  <RequestQueryProvider>
    <Routes>
      <Route path={`${AdminTab.Transfers}/:reqId`}
        element={<TransferDialog path={AdminTab.Transfers}/>}
      />
      <Route path={`${AdminTab.Transfers}`}
        element={<TransferList path={AdminTab.Transfers}/>}
      />
    </Routes>
  </RequestQueryProvider>
);

export const AdminTransfersRouter = React.memo(component);
