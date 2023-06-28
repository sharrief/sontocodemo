import {
  IBaseEntityRecord, IUser, IRequest, DocumentStage, OperationType,
} from '@interfaces';

export function GetDocumentStatusByStage(stage: DocumentStage, type?: OperationType, accountEnding?: string, wireConfirmation?: string) {
  let docStatus = 'Please wait as we update the request status.';
  switch (stage) {
    case DocumentStage.Client:
      docStatus = 'Waiting on client to complete and sign a document.';
      break;
    case DocumentStage.Manager:
      docStatus = 'Waiting on account manager to sign a document.';
      break;
    case DocumentStage.Ready:
      docStatus = `This ${type ? `${type} ` : ''} request is ready to be processed. ${accountEnding ? `The transfer will be sent to the bank account ending in ${accountEnding}` : 'No further action is required'}.`;
      break;
    case DocumentStage.Received:
      docStatus = `We have received the transfer.${wireConfirmation ? ` Confirmation: ${wireConfirmation}. ` : ''}The updated balance will be reflected in the statement.`;
      break;
    case DocumentStage.Recurring:
      docStatus = `This recurring request will automatically be processed at the end of the current statement period.${accountEnding ? ` The transfer wil be sent to the bank account ending in ${accountEnding}.` : ''}`;
      break;
    case DocumentStage.Sent:
      docStatus = `We have sent the transfer${accountEnding ? ` to the bank account ending in ${accountEnding}` : ''}.${wireConfirmation ? ` Confirmation: ${wireConfirmation}. ` : ''}The updated balance will be reflected in the statement.`;
      break;
    case DocumentStage.Waiting:
      docStatus = 'We are waiting to confirm receipt of the transfer. Transfer instructions have been emailed.';
      break;
    case DocumentStage.Cancelled:
      docStatus = `This ${type ? `${type} ` : ''} request has been cancelled.`;
      break;
    case DocumentStage.Review:
      docStatus = 'We are reviewing the request information and updating our records.';
      break;
    default:
  }
  return docStatus;
}

export interface IDocument extends IBaseEntityRecord {
  id: number;

  userId: number;

  operationId?: number;

  timestamp: number;

  deleted: boolean;

  publicId: number;

  email: string;

  amount: number | null;

  month: number;

  year: number;

  documentLink?: string | null;

  status?: string;

  stage?: DocumentStage | null;

  lastUpdated: number;

  request: IRequest;

  user: IUser;
}

export const DefaultDocument: IDocument = {
  id: 0,
  userId: 0,
  timestamp: 0,
  deleted: true,
  publicId: 0,
  email: '',
  amount: null,
  month: 0,
  year: 0,
  lastUpdated: 0,
  request: null,
  user: null,
};
