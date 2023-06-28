export enum Modality {
  Compounding = 'Compounding',
  NoCompounding = 'No-Compounding'
}

export enum UserAccountStatus {
  pending = 'pending',
  active = 'active'
}

export enum RoleId {
  admin = 1,
  director,
  manager,
  client,
  seniorTrader,
}

export enum RoleName {
  admin = 'admin',
  director = 'director',
  manager = 'manager',
  client = 'client',
  seniorTrader = 'seniorTrader',
}

export enum OperationType {
  Credit='credit',
  Debit='distribution'
}

export enum RequestStatus {
  Pending='pending',
  Approved='approved',
  Recurring='recurring',
  Deleted='deleted',
  Declined='declined',
  Voided='voided'
}

export enum DocumentStage {
  Requested = 'requested',
  Client = 'client',
  Manager = 'manager',
  Review = 'review',
  Waiting = 'waiting',
  Cancelled = 'cancelled',
  Ready = 'ready',
  Recurring = 'recurring',
  Sent = 'sent',
  Received = 'received'
}

export enum ApplicantEntityType {
  Individual,
  Corporation,
  Foundation
}

export enum ApplicationStatus {
  Created,
  InProgress,
  ReadyForReview,
  Exception,
  Cancelled,
  Complete
}

export enum InvestmentInstrument {
  None,
  Independent,
  StructuredProducts,
  WealthManagement,
  Stocks,
  HedgeFunds,
  Investments,
  Bonds,
  Derivatives,
  FundInvestments,
  ShortTerm,
  Warrants,
  Other
}

export enum USDValueBracket {
  Empty,
  OneK,
  FiveK,
  TenK,
  FiftyK,
  HundredK,
  Million,
  MillPlus
}

export function USDValueBracketToLabel(key: USDValueBracket) {
  const map: {[key in USDValueBracket]: string} = {
    [USDValueBracket.Empty]: 'Select an option...',
    [USDValueBracket.OneK]: '0 - 1,000',
    [USDValueBracket.FiveK]: '1,000 - 5,000',
    [USDValueBracket.TenK]: '5,000 - 10,000',
    [USDValueBracket.FiftyK]: '10,000 - 50,000',
    [USDValueBracket.HundredK]: '50,000 - 100,000',
    [USDValueBracket.Million]: '100,000 - 1,000,000',
    [USDValueBracket.MillPlus]: '1,000,000+',
  };
  return map[key];
}

export enum AssetType {
  BankInvestments,
  RealEstate,
  Stocks,
  Alternative,
  Funds,
  Other
}
export enum RiskProfile {
  High, Average, Low
}

export enum IncomeSource {
  Active, Passive, Other
}
