import React from 'react';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { getUserInfo, useAccount, useManager } from '@admin/admin.store';
import { IUserTrimmed, RoleName } from '@interfaces';

export const Information = ({ accountNumber }: { accountNumber: IUserTrimmed['accountNumber']}) => {
  const { account } = useAccount(accountNumber);
  const {
    name,
    lastname,
    displayName,
    email,
    id,
  } = account;
  const { manager } = useManager(accountNumber);
  const { userinfo } = getUserInfo();
  const isAdmin = userinfo?.role === RoleName.admin;
  return (
  <Form>
    <h3>Account information</h3>
    <hr />
    <Row>
      <Form.Group as={Col} xs={6} md={4}>
        <Form.Label>Account name</Form.Label>
        <Form.Control readOnly value={displayName}/>
      </Form.Group>
      <Form.Group as={Col} xs={6} md={4}>
        <Form.Label>Account number</Form.Label>
        <Form.Control readOnly value={accountNumber}/>
      </Form.Group>
      <Form.Group as={Col} xs={6} md={4}>
        <Form.Label>Contact first name</Form.Label>
        <Form.Control readOnly value={name}/>
      </Form.Group>
      <Form.Group as={Col} xs={6} md={4}>
        <Form.Label>Contact last name</Form.Label>
        <Form.Control readOnly value={lastname}/>
      </Form.Group>
      <Form.Group as={Col} xs={6} md={4}>
        <Form.Label>Contact email</Form.Label>
        <Form.Control readOnly value={email}/>
      </Form.Group>
      <Form.Group as={Col} xs={6} md={4}>
        <Form.Label>Account manager</Form.Label>
        <Form.Control readOnly value={manager?.displayName}/>
      </Form.Group>
    </Row>
    <hr />
    {isAdmin && <Row>
      <h5>For administrative use only</h5>
      <Form.Group as={Col} xs={6} md={4}>
        <Form.Label>User id</Form.Label>
        <Form.Control readOnly value={id}/>
      </Form.Group>
    </Row>}
  </Form>
  );
};
