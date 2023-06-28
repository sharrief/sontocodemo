import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Popover from 'react-bootstrap/Popover';
import { IRequest, IDocument, DocumentStage } from '@interfaces';
import { Variant } from '@store/state';
import { TransactionProgressBar as labels } from '@labels';

interface TransactionProgressBarProps {
  transaction: {
    stage: IDocument['stage'];
    status?: IRequest['status'];
    docStatus?: IDocument['status'];
  };
}

export type ProgressBarVariant = Variant.Info | Variant.Success | Variant.Danger | Variant.Warning;

const TransactionProgressBar = ({ transaction: { stage } }: TransactionProgressBarProps) => {
  const state: {
    variant: ProgressBarVariant;
    animated: boolean;
    now: number;
  } = {
    variant: null,
    animated: false,
    now: 0,
  };
  if (stage === DocumentStage.Requested) {
    state.now = 0;
  } else if (stage === DocumentStage.Client) {
    state.variant = Variant.Info;
    state.now = 25;
  } else if (stage === DocumentStage.Manager) {
    state.variant = Variant.Warning;
    state.now = 50;
  } else if (stage === DocumentStage.Review) {
    state.now = 50;
  } else if (stage === DocumentStage.Waiting) {
    state.variant = Variant.Info;
    state.now = 75;
  } else if (stage === DocumentStage.Cancelled) {
    state.variant = Variant.Danger;
    state.now = 0;
  } else if (stage === DocumentStage.Ready || stage === DocumentStage.Recurring) {
    state.now = 75;
  } else if (stage === DocumentStage.Sent || stage === DocumentStage.Received) {
    state.variant = Variant.Success;
    state.now = 100;
  }
  return (<ProgressBar style={{ minWidth: 50, width: '100%' }} now={state.now} animated={state.animated} variant={state.variant}/>);
};
export const StageInfoPopover = <Popover id='stage-info-popover'>
<Popover.Header as='h4'>{labels.colorKey}</Popover.Header>
<Popover.Body>
  <Row>
  {[
    { text: labels.clientAction, variant: Variant.Info as ProgressBarVariant },
    { text: labels.managerAction, variant: Variant.Warning as ProgressBarVariant },
    { text: labels.officeAction, variant: null as ProgressBarVariant },
    { text: labels.noAction, variant: Variant.Success as ProgressBarVariant },
  ].map(({ text, variant }) => (
    <Col key={text} md={12}>
      <Row className="justify-content-center">
        <Col className='text-center'>
          {text}
        </Col>
      </Row>
      <Row>
        <Col>
          <ProgressBar now={100} animated={true} variant={variant} />
        </Col>
      </Row>
    </Col>
  ))}
  </Row>
</Popover.Body></Popover>;
export default TransactionProgressBar;
