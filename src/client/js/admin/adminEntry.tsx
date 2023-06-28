import React from 'react';
import ReactDOM from 'react-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { Admin as Labels } from '@client/js/labels';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import favicon from '@brand/images/favicon.png';
import store from './admin.store';
import Admin from './Admin';

const App = (() => (
  <Provider store={store}>
    <HashRouter>
      <HelmetProvider>
        <Helmet>
          <link rel='icon' href={favicon}/>
          <link rel="apple-touch-icon" href={favicon}/>
          <title>{Labels.AdminWebpageTitle}</title>
        </Helmet>
        <Admin />
      </HelmetProvider>
    </HashRouter>
  </Provider>
));

const render = () => {
  ReactDOM.render(
    (<App />),
    document.getElementById('root'),
  );
};

render();

export default App;
