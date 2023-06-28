import React, { useEffect, useState } from 'react';
import {
  Link as RouterLink,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Spinner from 'react-bootstrap/Spinner';
import { useDispatch, useSelector } from 'react-redux';
import Menu from '@mui/icons-material/Menu';
import { endpoints } from '@api';
import { RoleName as roles } from '@interfaces';
import { CombinedState, ThemeName } from '@store/state';
import { global } from '@admin/admin.reducers';
import { menuLabels as labels, Navigation as Labels } from '@client/js/labels';
import { createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import logoWhite from '@brand/images/logo-light-mono.png';
import logo from '@brand/images/logo-cropped.png';
import { Dropdown } from 'react-bootstrap';
import { getUserInfo } from '../admin/admin.store';
import PasswordReset from '../containers/Dashboard.Information.PasswordReset';
import { SecurityOptions } from './SecurityOptions';

export const eventKey = {
  personalInfo: 'personal-info',
  preferences: 'preferences',
  passwordReset: 'resetPassword',
  securityOptions: 'securityOptions',
  toggleTheme: 'toggleTheme',
  logout: 'logout',
};
const selector = createSelector([
  (state: CombinedState) => state.global.theme,
], (theme) => ({
  theme,
}));

export const NavigationBarComponent = ({ hideLogoWhenLarge }: { hideLogoWhenLarge: boolean }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useSelector(selector);
  const { pathname } = useLocation();
  const { userinfo, userinfoLoading: loading } = getUserInfo();

  let navtitle = null;
  let navlinks = null;
  const navLinkPaths = {
    dashboard: `${endpoints.dashboard}`,
    administration: `${endpoints.administration}`,
  };
  const activePath = pathname.split('/')?.[1];

  if (loading) {
    navtitle = (
      <span>
        <Spinner size='sm' animation='grow'/>
        <Spinner size='sm' animation='grow'/>
        <Spinner size='sm' animation='grow'/>
      </span>
    );
  } else if (userinfo && userinfo.email && userinfo.role) {
    navtitle = userinfo.email;
    navlinks = [
      [roles.admin, roles.manager, roles.director].includes(userinfo?.role) ? (
          <Nav.Item key={''}>
            <Nav.Link active={`/${activePath}` === endpoints.dashboard} as={RouterLink} eventKey='' to={navLinkPaths.dashboard}>
              {Labels.accounts}
            </Nav.Link>
          </Nav.Item>
      ) : null,
      [roles.admin, roles.manager, roles.director].includes(userinfo?.role) ? (
          <Nav.Item as={'div'} key={'administration'}>
            <Nav.Link active={`/${activePath}` === endpoints.administration} as={RouterLink} eventKey={'administration'} to={navLinkPaths.administration}>
              {Labels.administration}
            </Nav.Link>
          </Nav.Item>
      ) : null,
    ];
  } else { navtitle = labels.NoNav; }

  const changeTheme = (themeName: ThemeName) => dispatch(global.actions.setTheme(themeName));
  let oldTheme = document.getElementById('sketchy') && 'sketchy';
  if (!oldTheme) oldTheme = document.getElementById('vapor') && 'vapor';
  if (!oldTheme) oldTheme = document.getElementById('darkly') && 'darkly';
  if (oldTheme && oldTheme !== theme) {
    const newTheme = document.createElement('link'); // Create a new link Tag
    newTheme.setAttribute('rel', 'stylesheet');
    newTheme.setAttribute('type', 'text/css');
    newTheme.setAttribute('href', `/static/${theme}.css`); // Your .css File
    newTheme.setAttribute('id', `${theme}`);
    document.getElementsByTagName('head')[0].appendChild(newTheme);
    setTimeout(() => {
      const oldNode = document.getElementById(oldTheme);
      oldNode.parentNode.removeChild(oldNode);
    }, 500);
  } else if (!oldTheme) {
    const newTheme = document.createElement('link'); // Create a new link Tag
    newTheme.setAttribute('rel', 'stylesheet');
    newTheme.setAttribute('type', 'text/css');
    newTheme.setAttribute('href', `/static/${theme}.css`); // Your .css File
    newTheme.setAttribute('id', `${theme}`);
    document.getElementsByTagName('head')[0].appendChild(newTheme);
  }
  const bg = (theme === 'vapor') ? 'dark' : '';
  const variant = (theme === 'vapor' || theme === 'darkly') ? 'dark' : 'light';
  const themes = <>
    <Dropdown.Divider />
    <Dropdown.Header>Themes</Dropdown.Header>
    <NavDropdown.Item
      active={theme === 'sketchy'}
      eventKey={eventKey.toggleTheme}
      onClick={() => changeTheme('sketchy')}>
      bright
    </NavDropdown.Item>
    <NavDropdown.Item
      active={theme === 'darkly'}
      eventKey={eventKey.toggleTheme}
      onClick={() => changeTheme('darkly')}>
      dark
    </NavDropdown.Item>
    <NavDropdown.Item
      active={theme === 'vapor'}
      eventKey={eventKey.toggleTheme}
      onClick={() => changeTheme('vapor')}>
      cyber
    </NavDropdown.Item>
    </>;
  const [showResetDialog, setShowResetDialog] = useState(false);
  const onClickResetPassword = () => {
    setShowResetDialog(true);
  };
  const [showSecurityOptions, setShowSecurityOptions] = useState(false);
  const onClickShowSecurityOptions = () => {
    setShowSecurityOptions(true);
  };
  const onCloseSecurityOptions = () => {
    setShowSecurityOptions(false);
  };
  const setShow = (show: boolean) => {
    setShowResetDialog(show);
  };
  return (
    <>
    <PasswordReset show={showResetDialog} setShow={setShow}/>
    <SecurityOptions show={showSecurityOptions} onClose={onCloseSecurityOptions} />
    <div className='d-md-none' style={{ width: '100%' }}>
      <Navbar expand='sm' collapseOnSelect bg="dark" variant='dark' fixed='top' className='top-nav px-3 pb-2 px-md-0'>
        <Navbar.Brand className={hideLogoWhenLarge ? 'd-md-none' : ''}><img height={36} alt="logo" src={logoWhite} /></Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" className='border-0'><Menu/></Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className='justify-content-end' activeKey={activePath}>
            <NavDropdown title={navtitle} id="settings-dropdown" menuVariant={theme === 'vapor' ? 'dark' : ''}>
              <NavDropdown.Item eventKey={eventKey.passwordReset} onClick={onClickResetPassword}>
                {labels.ResetPassword}
              </NavDropdown.Item>
              <NavDropdown.Item eventKey={eventKey.securityOptions} onClick={onClickShowSecurityOptions}>
                {labels.SecurityOptions}
              </NavDropdown.Item>
              {themes}
              <NavDropdown.Divider />
              <NavDropdown.Item eventKey={eventKey.logout} href={endpoints.logout}>
                {labels.Logout}
              </NavDropdown.Item>
            </NavDropdown>
            {navlinks}
          </Nav>
          </Navbar.Collapse>
      </Navbar>
    </div>
    <div className='d-none d-md-inline' style={{ width: '100%' }}>
      <Navbar expand='sm' collapseOnSelect bg={bg} variant={variant} className='top-nav px-3 px-md-0'>
        <Navbar.Brand className={hideLogoWhenLarge ? 'd-md-none' : ''}><img height={36} alt="logo" src={bg === 'dark' ? logoWhite : logo} /></Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" className='border-0'><Menu/></Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className='justify-content-end' activeKey={activePath}>
            <NavDropdown title={navtitle} id="settings-dropdown">
              <NavDropdown.Item eventKey={eventKey.passwordReset} onClick={onClickResetPassword}>
                {labels.ResetPassword}
              </NavDropdown.Item>
              <NavDropdown.Item eventKey={eventKey.securityOptions} onClick={onClickShowSecurityOptions}>
                {labels.SecurityOptions}
              </NavDropdown.Item>
              {themes}
              <NavDropdown.Divider />
              <NavDropdown.Item eventKey={eventKey.logout} href={endpoints.logout}>
                {labels.Logout}
              </NavDropdown.Item>
            </NavDropdown>
            {navlinks}
          </Nav>
          </Navbar.Collapse>
      </Navbar>
    </div>
    </>
  );
};

export default React.memo(NavigationBarComponent);
