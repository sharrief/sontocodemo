import React from 'react';
import { IUser } from '@interfaces';
import Brand from '@brand/brandLabels';

export function getAccountInfoChangedTemplate(requestor: string, oldManager: string, newManager: string, oldAccount: IUser, newAccount: IUser) {
  const {
    name, lastname, email, businessEntity, obYear, obMonth, fmId, hasAccountsAccess,
  } = oldAccount;
  const {
    name: newName,
    lastname: newLastname,
    email: newEmail,
    businessEntity: newBusinessEntity,
    obYear: newObYear,
    obMonth: newObMonth,
    fmId: newFmId,
    hasAccountsAccess: newAccountsAccess,
  } = newAccount;

  const emailTemplate = <html>
    <p>Notice,</p>
    <p>{requestor} has changed the following information for account {oldAccount.displayName} | {oldAccount.accountNumber}:</p>
    <ul>
      {name !== newName && <li>Contact first name: {name}
        {'->'} {newName}</li>}
      {lastname !== newLastname && <li>Contact last name: {lastname}
        {'->'} {newLastname}</li>}
      {email !== newEmail && <li>Contact email: {email}
        {'->'} {newEmail}</li>}
      {businessEntity !== newBusinessEntity && <li>Legal entity: {businessEntity}
        {'->'} {newBusinessEntity}</li>}
      {((obYear !== newObYear) || (obMonth !== newObMonth)) && <li>Account opening month: {obMonth}/{obYear}
        {'->'} {newObMonth}/{newObYear}</li>}
      {fmId !== newFmId && <li>Account manager: {oldManager}
        {'->'} {newManager}</li>}
      {hasAccountsAccess !== newAccountsAccess && <li>Access to new site: {hasAccountsAccess}
      {'->'} {newAccountsAccess}</li>}
    </ul>
    <p>----</p>
    <p>This was an automated email from</p>
    <p>The Administration System</p>
  </html>;

  return emailTemplate;
}
