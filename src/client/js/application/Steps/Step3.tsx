import React from 'react';
import Card from 'react-bootstrap/Card';
import { BackAndNext, InvestmentExperience } from '@application/Fields';
import Labels from '@application/Labels';

export const step3 = ({
  title: Labels.InvestmentExperience,
  Component: function Step3() {
    return (
      <>
        <Card>
          <Card.Header><h5>
            {Labels.InvestmentExperience}
          </h5></Card.Header>
          <Card.Body>
            <InvestmentExperience.component />
          </Card.Body>
          <Card.Footer><BackAndNext /></Card.Footer>
        </Card>
      </>
    );
  },
});
