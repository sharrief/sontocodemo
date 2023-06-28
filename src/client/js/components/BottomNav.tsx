import React from 'react';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import {
  Link as RouterLink,
} from 'react-router-dom';
import { Navbar } from 'react-bootstrap';
import '@client/css/Admin.css';
import { createMenuItem } from '../core/helpers';

const bottomNav = (props: {
  items: {
    icon: JSX.Element;
    label: JSX.Element;
    to: string;
    key: string;
    classname: string;
  }[];
    activeKey: string;
    onSelect?: (key: string) => void;
}) => {
  const { items, onSelect, activeKey } = props;

  return <Navbar fixed="bottom" className='d-md-none pt-0 px-0 bottom-nav' bg="dark" variant='dark' style={{ overflowX: 'scroll' }}>
      <style>{`
        .tabFontSize a {
          font-size: .7em;
          text-decoration: none !important;
        }
      `}</style>
      <Nav activeKey={activeKey} className='col-12 pl-0 pr-0 tabFontSize' onSelect={onSelect ?? (() => null)}>
        <Container className='d-flex' fluid>
        {items.map(({
          icon, label, to, key, classname,
        }) => <Col xs={true} key={key}>
            <Nav.Item>
              <Nav.Link as={RouterLink} to={to} className='text-center' eventKey={key}>
                {createMenuItem(icon, label, classname)}
              </Nav.Link>
            </Nav.Item>
          </Col>)}
        </Container>
      </Nav>
    </Navbar>;
};

export default React.memo(bottomNav);
