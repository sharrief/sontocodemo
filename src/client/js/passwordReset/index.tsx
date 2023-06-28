import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import PasswordResetPage from './PasswordResetPage';

render(
  <Router><PasswordResetPage /></Router>,
  document.getElementById('root'),
);
