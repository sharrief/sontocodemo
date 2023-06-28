import React from 'react';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import {
  Name, PhoneAndEmail, DoB, Personhood, IdentificationNumber, TaxCountry, Address, BackAndNext,
} from '@application/Fields';
import Labels from '@application/Labels';
import { ApplicantEntityType, FieldNames } from '@interfaces';
import { createSelector } from 'reselect';
import { RootState } from '@application/application.store';
import { useSelector } from 'react-redux';

export const Step2FieldNames = [
  FieldNames.Application.applicantContact,
];

const selectEntityType = createSelector([
  (state: RootState) => state.dataState.app.entityType,
], (entityType) => ({ entityType }));

export const step2 = ({
  title: Labels.ClientInformation,
  Component: function Step2() {
    const { entityType } = useSelector(selectEntityType);
    const isCorp = entityType !== ApplicantEntityType.Individual;
    return (
      <Card>
        <Card.Header><h5>{Labels.ClientInformation}</h5></Card.Header>
        <Card.Body>
          <Personhood.component />
          <Row>
            <Name.component contactType='applicantContact' />
            {!isCorp
            && <Col sm={12} md={6}>
              <Row>
                <DoB.component />
              </Row>
            </Col>
          }
          </Row>
          <Row>
            <IdentificationNumber.component contactType='applicantContact' />
            <TaxCountry.component />
          </Row>
          <Address.component contactType='applicantContact'/>
          <PhoneAndEmail.component contactType='applicantContact'/>
        </Card.Body>
        <Card.Footer><BackAndNext /></Card.Footer>
      </Card>
    );
  },
});
