import React from 'react';
import Card from 'react-bootstrap/Card';
import Labels from '@application/Labels';
import { BackAndNext } from '../Fields';

export const step7 = ({
  title: Labels.FundSummaryTitle,
  Component: function Step7() {
    return (
      <>
        <Card>
          <Card.Header><h5>{Labels.FundSummaryTitle}</h5></Card.Header>
          <Card.Body>
            <h2>{Labels.FundSummarySubtitle}</h2>
            {Labels.FundSummaryParagraphs.map((paragraph, idx) => <p key={idx}><em>{paragraph}</em></p>)}
          </Card.Body>
          <Card.Footer><BackAndNext /></Card.Footer>
        </Card>
      </>
    );
  },
});
