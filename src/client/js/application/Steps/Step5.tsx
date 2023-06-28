import React from 'react';
import Card from 'react-bootstrap/Card';
import { BackAndNext, FinancialStatus } from '@application/Fields';
import Labels from '@application/Labels';

export const step5 = ({
  title: Labels.FinancialStatus,
  Component: function Step5() {
    return (
      <>
        <Card>
          <Card.Header><h5>
            {Labels.FinancialStatus}
          </h5></Card.Header>
          <Card.Body>
            <FinancialStatus.component />
          </Card.Body>
          <Card.Footer><BackAndNext /></Card.Footer>
        </Card>
      </>
    );
  },
});
