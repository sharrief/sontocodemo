import Brand from '@brand/brandLabels';

export function getRequestEmailSubject(req: {id: number; type: string; status: string}) { return `${Brand.MidName} ${req?.type} request #${req?.id}`; }
export function getApplicationEmailSubject() { return `Please complete the ${Brand.MidName} application`; }
export function getApplicationCompleteEmailSubject() { return `Please sign the ${Brand.MidName} application`; }
export function getAccountOpenedEmailSubject() { return `Your ${Brand.MidName} account is ready!`; }
export function getTradeReportPublishedSubject(date: string) { return `The Trade Report for ${date} has been published`; }
export function getResetPasswordEmailSubject() { return `Reset your ${Brand.MidName} password`; }
export function getResetPasswordCompleteEmailSubject() { return `Your ${Brand.MidName} password has been reset`; }
export function getAccountInfoChangedEmailSubject() { return `${Brand.ShortName} account information has been changed`; }
export function getRequestNeedsBankingInfoEmailSubject(request: {id: number}) { return `Request ID #${request.id} needs banking information`; }
export function getFailedToProcessJobEmailSubject(request: { id: number }) { return `Failed to process job email for request ${request.id}`; }
export function getStatementPopulatedEmailSubject(date: string) { return `Your ${date} ${Brand.MidName} account statement is available`; }
export function getOldStatementPoupulatedEmailSubject(date: string) { return `${Brand.ShortName} - ${date} report just populated`; }
