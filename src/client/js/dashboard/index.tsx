import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from '@admin/admin.store';
import App from './App';

const render = () => { // this function will be reused
  ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      document.getElementById('root'),
  );
};

render();
