import React from 'react';
import Card from 'react-bootstrap/Card';
import { BackAndNext, InvestmentTargets } from '@application/Fields';
import Labels from '@application/Labels';

export const step4 = ({
  title: Labels.InvestmentTargets,
  Component: function Step4() {
    return (
      <>
        <Card>
          <Card.Header><h5>
            {Labels.InvestmentTargets}
          </h5></Card.Header>
          <Card.Body>
            <InvestmentTargets.component />
          </Card.Body>
          <Card.Footer><BackAndNext /></Card.Footer>
        </Card>
      </>
    );
  },
});
