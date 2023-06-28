import React from 'react';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import {
  Name, PhoneAndEmail, IdentificationNumber, Address, Education, BackAndNext,
} from '@application/Fields';
import Labels from '@application/Labels';
import { FieldNames } from '@interfaces';

export const Step6FieldNames = [FieldNames.Application.representativeContact];

export const step6 = ({
  title: Labels.ContactInformation,
  Component: React.memo(function Step6() {
    return (
      <>
        <Card>
          <Card.Header><h5>{Labels.ContactInformation}</h5></Card.Header>
          <Card.Body>
            <div className='mb-3'>
              <Form.Text>{Labels.ContactInformationInstruction}</Form.Text>
              <Form.Text>{Labels.ContactInformationSubtitle}</Form.Text>
            </div>
            <Row>
              <Name.component contactType='representativeContact'/>
              <IdentificationNumber.component contactType='representativeContact' />
            </Row>
            <Address.component contactType='representativeContact'/>
            <PhoneAndEmail.component contactType='representativeContact'/>
            <Row>
              <Education.component />
            </Row>
          </Card.Body>
          <Card.Footer><BackAndNext /></Card.Footer>
        </Card>
      </>
    );
  }),
});
