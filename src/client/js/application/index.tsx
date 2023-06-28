import 'reflect-metadata';
import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import '@client/scss/Application.scss';
import { endpoints } from '@api';
import { store } from '@application/application.store';
import Labels from '@application/Labels';
import { ApplicationPage } from './ApplicationForm';

const Index = (() => (
  <Provider store={store}>
    <HelmetProvider>
      <Helmet>
        <link rel='icon' />
        <title>{Labels.PageTitle}</title>
      </Helmet>
      <BrowserRouter>
        <Routes>
          <Route path={`${endpoints.application}/*`} element={
            <ApplicationPage />
          }/>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </Provider>
));

render((<Index />),
  document.getElementById('root'));

export default Index;
