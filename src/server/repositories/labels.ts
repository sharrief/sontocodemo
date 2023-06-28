import { Document, Operation, Request } from '@entities';
import { RequestStatus } from '@interfaces';

const unableToActionPrefix = (action: 'post'|'update', request: Request) => `The system was unable to ${action} request #${request.id} `;
export const Labels = {
  NotAuthorized: 'UNAUTHORIZED',
  NoRequestForId: (id: number) => `Could not find request #${id}.`,
  NoOperationForId: (id: number) => `Could not find operation #${id}.`,
  CannotChangeApprovedAmount: (request: Request) => `You cannot change the amount of ${request.type} request #${request.id} because the status is ${request.status}.`,
  NoAccount: (accountNumber: string) => `The system was unable to locate an account with account number ${accountNumber}.`,
  CannotUpdateBecauseNotFound: 'The system could not find the request.',
  CannotPostBecauseStatus: (request: Request) => `${unableToActionPrefix('post', request)} because its status is ${request.status}.`,
  CannotPostBecauseMissing: (id: number) => `Unable to post request #${id} because some required information was missing.`,
  AlreadyPostedRequest: (request: Request, operation: Operation) => `${unableToActionPrefix('post', request)} because it has already been posted as operation #${operation.id}${request.status === RequestStatus.Recurring ? ' for the specified month' : ''}`,
  CreatedRequest: (request: Request) => `Successfully created ${request.type} request #${request.id}.`,
  UpdatedRequest: (request: Request) => `Successfully updated ${request.type} request #${request.id}.`,
  UpdatedDocument: (d: Document, requestId: number) => `Successfully updated document #${d.id} for request #${requestId}.`,
  VoidedRequest: (request: Request) => `Successfully voided ${request.type} request #${request.id}.`,
  DeletedOperation: (operation: Operation) => `Successfully deleted operation #${operation.id}.`,
  CouldNotDeleteOperation: (operation: Operation) => `Unable to delete #${operation.id}.`,
  MadeRequestRecurring: (request: Request, emailed?: {client: string; manager: string }) => `Successfully made ${request.type} request #${request.id} a recurring request.${emailed ? `Emailed ${emailed.client} and ${emailed.manager}` : ''}.`,
  CancelledRequest: (request: Request, emailed?: {client: string; manager: string }) => `Successfully cancelled ${request.type} request #${request.id}. ${emailed ? `Emailed ${emailed.client} and ${emailed.manager}.` : ''}`,
  CouldNotCancelledRequest: (request: Request, emailed?: {client: string; manager: string }) => `Unable to Cancel ${request.type} request #${request.id}. ${emailed ? `Emailed ${emailed.client} and ${emailed.manager}.` : ''}`,
};
