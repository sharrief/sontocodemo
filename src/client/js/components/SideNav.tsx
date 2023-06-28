import React, {
  useState,
} from 'react';
import Nav from 'react-bootstrap/Nav';
import Col from 'react-bootstrap/Col';
import {
  Link as RouterLink,
} from 'react-router-dom';
import { Navbar } from 'react-bootstrap';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { DateTime } from 'luxon';
import '@client/css/Admin.css';
import logo from '@brand/images/logo-cropped.png';
import Brand from '@brand/brandLabels';
import { ThemeName } from '../store/state';

const sideNav = (props: {
  activeKey: string;
  items: {
    icon: JSX.Element;
    label: JSX.Element;
    to: string;
    key: string;
    classname: string;
  }[];
  onSelect: (key: string) => void;
  theme: ThemeName;
}) => {
  const {
    activeKey, items, onSelect, theme,
  } = props;
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const bg = (theme === 'vapor' || theme === 'darkly') ? 'dark' : '';
  const variant = (theme === 'vapor' || theme === 'darkly') ? 'dark' : 'light';

  return <Col md='auto' className={`d-none d-md-flex p-0 bg-light side-nav ${sideNavOpen && 'open'}`}>
    <style>{`
      .side-nav {
        min-height: 100vh;
        box-shadow: 1px 5px 10px #888;
        width: 45px;
        transition: 0.5s;
        overflow-x: hidden;
      }
      .side-nav.open {
        width: 140px;
      }
      .logo-container-open {
        padding: 1rem;
        transition: 0.5s;
      }
      .logo-container-closed {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        transition: 0.5s;
      }
      .logo {
        width: 45px;
        transition: 0.5s;
      }
      .logo.open {
        width: 100%;
      }
      .toggleSideNav {
        width: 45px;
        transition: 0.5s;
      }
      .toggleSideNav.open {
        width: 140px;
        transition: 0.5s;
      }
      .chevron {
        transition: 0.5s;
      }
      .chevron.pointLeft {
        transform: scaleX(-1);
      }
      .copyright {
        text-align: center !important;
        font-size: .8em;
        opacity: 0;
        transition: 0.5s;
      }
      .copyright.open {
        opacity: 1;
        transition: 0.5s;
      }
    `}</style>
    <Navbar className='flex-column p-0'
      bg={bg}
      variant={variant}
    >
      <Nav
        className='flex-column d-flex'
        style={{
          width: '140px', height: '100vh', position: 'relative',
        }}
        activeKey={activeKey}
        defaultActiveKey={activeKey}
        onSelect={onSelect}
      >
        <div className={`border-bottom ${sideNavOpen ? 'logo-container-open' : 'logo-container-closed'}`}>
          <img className={`logo ${sideNavOpen && 'open'}`} alt="logo" src={logo} style={{ objectFit: 'cover' }} />
        </div>
        {items.map(({
          icon, label, to, key,
        }) => <Nav.Item key={key}>
          <Nav.Link as={RouterLink} to={to} eventKey={key}>
            {icon} {label}
          </Nav.Link>
        </Nav.Item>)}
        <Nav.Item className='mt-auto'>
          <Nav.Link as={'div'} className={`px-2 d-flex flex-row-reverse toggleSideNav ${sideNavOpen && 'open'}`}>
            <ChevronRight className={`chevron ${sideNavOpen && 'pointLeft'}`} style={{ width: '29px' }} onClick={() => setSideNavOpen(!sideNavOpen)}/>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <div className={`copyright ${sideNavOpen && 'open'}`}>
          <div>Powered by</div>
          <div>&copy; {DateTime.now().year} {Brand.PoweredBy}</div>
          </div>
        </Nav.Item>
      </Nav>
    </Navbar>
  </Col>;
};

export default React.memo(sideNav);
