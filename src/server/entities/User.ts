import {
  Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, OneToOne, Index,
} from 'typeorm';
import { Expose } from 'class-transformer';
import {
  IUser, Modality, UserAccountStatus, RoleName, RoleId, IStatement, IRequest, IOperation, IDocument, IBankDatum, IApplication,
} from '@interfaces';
import {
  Operation, Application, Statement, Request, BankDatum, Document,
} from '@entities';
import {
  dateTransformer, numberToBooleanTransformer, currencyTransformer,
} from '@transformers';
import env from '@server/lib/env';

@Entity('users', { schema: env.var.DB_NAME })
@Index('accountNumber', ['accountNumber'], { fulltext: true })
@Index('description', ['email', 'name', 'lastname', 'accountNumber', 'username', 'details', 'businessEntity'], { fulltext: true })
@Index('manager', ['username', 'email'], { fulltext: true })
@Index('names', ['name', 'lastname', 'businessEntity', 'email'], { fulltext: true })
export class User implements IUser {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id = 0;

  userId = 0;

  @Expose()
  get displayName() {
    if (this.roleId === RoleId.client) {
      if (this.businessEntity) return `${this.businessEntity}`;
      return `${this.name} ${this.lastname}`;
    }
    return this.username || 'No display name';
  }

  @Expose()
  get role(): RoleName {
    switch (this.roleId) {
      case RoleId.admin:
        return RoleName.admin;
      case RoleId.director:
        return RoleName.director;
      case RoleId.manager:
        return RoleName.manager;
      case RoleId.seniorTrader:
        return RoleName.seniorTrader;
      default:
        return RoleName.client;
    }
  }

  @Column('varchar', { name: 'username', nullable: true, length: 100 })
    username: string | null = '';

  @Column('varchar', {
    select: false, name: 'password', nullable: true, length: 100,
  })
    hashedPassword: string | null = '';

  @Column('varchar', {
    select: false, name: 'passResetHash', nullable: true, length: 256,
  })
    passwordResetHash: string | null = '';

  @Column('datetime', {
    name: 'passResetExpire', select: false, nullable: true, transformer: dateTransformer,
  })
    passwordResetExpiration: number | null = 0;

  @Column('int', { name: 'otpRequired', transformer: numberToBooleanTransformer, nullable: true })
    otpRequired = false;

  @Column('varchar', { name: 'otpSecret1', select: false, nullable: true })
    otpSecret1: string | null = '';

  @Column('varchar', { name: 'otpSecretTemp', select: false, nullable: true })
    otpSecretTemp: string | null = '';

  @Column('int', { name: 'role_id', nullable: true })
    roleId: number | null = 0;

  @Column('int', { name: 'fm_id', nullable: true, default: () => "'0'" })
    fmId: number | null = null;

  @Column('varchar', { name: 'email', nullable: true, length: 100 })
    email: string | null = '';

  @Column('varchar', { name: 'account_number', length: 50 })
    accountNumber = '';

  @Column('varchar', { name: 'business_entity', nullable: false, length: 50 })
    businessEntity = '';

  @Column('varchar', { name: 'name', nullable: true, length: 100 })
    name: string | null = '';

  @Column('varchar', { name: 'lastname', nullable: true, length: 100 })
    lastname: string | null = '';

  @Column('varchar', {
    select: false, name: 'details', nullable: true, length: 500,
  })
    details: string | null = '';

  @Column('int', {
    select: false, name: 'access_count', nullable: true, default: () => "'0'",
  })
    accessCount: number | null = 0;

  @Column('datetime', {
    name: 'last_access', nullable: true, transformer: dateTransformer,
  })
    lastAccess: number | null = 0;

  @Column('enum', {
    select: false,
    name: 'modality',
    nullable: true,
    enum: ['No-Compounding', 'Compounding'],
  })
    modality: Modality | null = null;

  @Column('datetime', {
    select: false,
    name: 'created',
    nullable: true,
    transformer: dateTransformer,
  })
    created: number | null = 0;

  @Column('datetime', {
    select: false, name: 'modificated', nullable: true, transformer: dateTransformer,
  })
    modificated: number | null = 0;

  @Column('int', { name: 'created_id', nullable: true })
    createdId: number | null = 0;

  @Column('int', { select: false, name: 'modificated_id', nullable: true })
    modificatedId: number | null = 0;

  @Column('varchar', {
    name: 'status', nullable: true, length: 100,
  })
    status: UserAccountStatus;

  @Column('int', {
    width: 1,
    nullable: true,
    default: () => "'0'",
    transformer: numberToBooleanTransformer,
  })
    deleted: boolean | null = false;

  @Column('varchar', {
    name: 'opening_balance', nullable: true, length: 50, transformer: currencyTransformer,
  })
    openingBalance: number | null = 0;

  @Column('int', { width: 2, name: 'ob_month', nullable: true })
    obMonth: number | null = 0;

  @Column('int', { width: 4, name: 'ob_year', nullable: true })
    obYear: number | null = 0;

  @Column('int', {
    nullable: false, width: 3, select: false, name: 'percentage',
  })
    percentage = 0;

  @Column('varchar', {
    select: false,
    name: 'oauth_provider',
    nullable: false,
    length: 255,
    default: () => "''",
  })
    oauthProvider = '';

  @Column('varchar', {
    select: false,
    name: 'oauth_uid',
    nullable: false,
    length: 255,
    default: () => "''",
  })
    oauthUid = '';

  @Column('varchar', {
    select: false,
    name: 'remember_device',
    nullable: false,
    length: 255,
    default: () => "''",
  })
    rememberDevice = '';

  @Column('datetime', {
    name: 'previous_login',
    transformer: dateTransformer,
    nullable: true,
  })
    previousLogin: number;

  @Column('int', {
    width: 11,
    name: 'closed',
    transformer: numberToBooleanTransformer,
    nullable: true,
  })
    closed: boolean;

  @Column('int', {
    name: 'hasAccountsAccess',
    transformer: numberToBooleanTransformer,
    nullable: true,
  })
    hasAccountsAccess: boolean;

  @OneToMany(() => User, (user) => user.manager)
    clients?: IUser[];

  @ManyToOne(() => User, (manager) => manager.clients, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'fm_id' })
    manager?: IUser;

  @OneToMany(() => Statement, (statement) => statement.user)
    statements: IStatement[];

  @OneToMany(() => Operation, (operation) => operation.user)
    operations: IOperation[];

  @OneToMany(() => Request, (request) => request.user)
    requests: IRequest[];

  @OneToMany(() => Document, (document) => document.user)
    documents: IDocument[];

  @OneToMany(() => BankDatum, (bankData) => bankData.user)
    bankAccounts: IBankDatum[];

  @OneToMany(() => Application, (app) => app.manager)
    applications?: IApplication[];

  @OneToOne(() => Application, (app) => app.user)
    application?: IApplication;
}
