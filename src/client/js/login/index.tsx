import React from 'react';
import { render } from 'react-dom';
import {
  Route, BrowserRouter as Router, Routes,
} from 'react-router-dom';
import LoginPage from './Login';

render(
  <Router>
    <Routes>
      <Route path={'*'} element={<LoginPage />} />
    </Routes>
  </Router>,
  document.getElementById('root'),
);
