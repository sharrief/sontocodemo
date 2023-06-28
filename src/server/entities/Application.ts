/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable max-classes-per-file */
import {
  Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import {
  IApplication, IContactInfo, ApplicationStatus, ApplicantEntityType, IncomeSource, InvestmentInstrument, RiskProfile, IUser, AssetType, USDValueBracket,
} from '@interfaces';
import {
  User, ContactInfo,
} from '@entities';
import { dateTransformer, enumArrayTransformer, numberToBooleanTransformer } from '@transformers';
import { Type } from 'class-transformer';
import env from '@server/lib/env';

export type ContactType = 'applicantContact' | 'representativeContact';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Trim(target: any, name: string) {
  // eslint-disable-next-line no-param-reassign
  Object.defineProperty(target, name, {
    get() { return target[name].trim(); },
    set(value: string) { this[name] = value; },
    enumerable: true,
    configurable: true,
  });
}

@Entity('application', { schema: env.var.DB_NAME })
export class Application implements IApplication {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('varchar', { nullable: false })
    uuid: string;

  @Column('tinyint', {
    width: 1, name: 'deleted', nullable: false, transformer: numberToBooleanTransformer, default: () => "'0'",
  })
    deleted: boolean;

  @Column('int', { name: 'fm_id', nullable: true })
    fmId: number;

  @ManyToOne(() => User, (manager) => manager.applications, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'fm_id' })
    manager?: IUser;

  @Column('int', { name: 'user_id', nullable: true })
    userId?: number;

  @OneToOne(() => User, (user) => user.application, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
    user?: IUser;

  @Column('varchar')
    authEmail: string;

  @Column('varchar')
    managerEmail: string;

  @Column('varchar')
    managerName: string;

  static appPINLength: number = 6;

  // eslint-disable-next-line no-use-before-define
  @Column('varchar', { length: Application.appPINLength, name: 'app_pin' })
    appPIN: string;

  @Column('datetime', { nullable: true, transformer: dateTransformer })
    dateCreated: number;

  @Column('datetime', { nullable: true, transformer: dateTransformer })
    Started: number;
  // TODO be sure to set this value when manager creates application

  @Column('datetime', { nullable: true, transformer: dateTransformer })
    dateEnded: number;

  @Column({ default: () => `'${ApplicationStatus.Created}'` })
    status: ApplicationStatus = ApplicationStatus.Created;

  @Column({ default: () => "''" })
    note?: string = '';

  @Column({ nullable: true })
    entityType: ApplicantEntityType = ApplicantEntityType.Individual;

  @Column(() => ContactInfo)
  @Type(() => ContactInfo)
    applicantContact: IContactInfo = new ContactInfo();

  @Column(() => ContactInfo)
  @Type(() => ContactInfo)
    representativeContact?: IContactInfo = new ContactInfo();

  @Column({ nullable: true })
    taxCountry: string = '';

  @Column('varchar', { transformer: enumArrayTransformer, nullable: true })
    investmentExperience: InvestmentInstrument[];

  @Column({ nullable: true })
    investmentExperienceOther: string = '';

  @Column({ nullable: true })
    expectedInvestmentLengthInYears: number = 3;

  @Column({ nullable: true })
    expectedInvestmentLengthOther: string = '';

  @Column({ nullable: true })
    riskProfile: RiskProfile = RiskProfile.Average;

  @Column({ nullable: true })
    checkedAuthorizedByEntity?: boolean = false;

  @Column({ nullable: true })
    incomeSource: IncomeSource = IncomeSource.Active;

  @Column({ nullable: true })
    incomeSourceOther?: string = '';

  @Column({ nullable: true, default: () => `'${USDValueBracket.Empty}'` })
    incomeSize: USDValueBracket;

  @Column({ nullable: true, default: () => `'${USDValueBracket.Empty}'` })
    financialCommitments: USDValueBracket;

  @Column({ nullable: true, default: () => `'${USDValueBracket.Empty}'` })
    financialAssets: USDValueBracket;

  @Column({ nullable: true, default: () => `'${USDValueBracket.Empty}'` })
    financialLiabilities: USDValueBracket;

  @Column('varchar', { transformer: enumArrayTransformer, nullable: true })
    assetTypes: AssetType[];

  @Column({ nullable: true })
    assetTypeOther?: string = '';

  @Column({ default: () => '0' })
    hasReadDisclaimer: boolean = false;

  @Column({ default: () => '0' })
    checkedAuthentic: boolean = false;

  @Column({ default: () => '0' })
    checkedNotUnlawful: boolean = false;

  @Column({ default: () => '0' })
    clickedToSign: boolean = false;

  @Column({ nullable: true })
    documentLink?: string = '';
}
