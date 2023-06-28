import React from 'react';
import {
  BrowserRouter, HashRouter,
} from 'react-router-dom';
import { SWRConfig } from 'swr';
import Navigation from '@components/Navigation';

const App = () => (
  <HashRouter>
    <SWRConfig
      value={{
        revalidateOnFocus: false,
      }}
    >
      <Navigation />
    </SWRConfig>
  </HashRouter>
);

export default App;
