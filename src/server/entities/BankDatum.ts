import {
  Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import {
  BankLocation, BankAccountType, BankDatumModel, BankAccountStatus,
} from '@interfaces';
import { User, Address, ReceivingBank } from '@entities';
import { numberToBooleanTransformer } from '@transformers';
import { Type } from 'class-transformer';
import env from '@server/lib/env';

import { Request } from './Request';

@Entity('user_document_data', { schema: env.var.DB_NAME })
export class BankDatum extends BankDatumModel {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('int', { name: 'user_id' })
    userId: number;

  @Column('varchar', { name: 'account_ending', nullable: true, length: 4 })
    accountEnding?: string | null;

  @Column('tinyint', { name: 'recurring', nullable: true, width: 1 })
    recurring?: boolean | null;

  @Column('tinytext', { name: 'link_account', nullable: true })
    linkAccount?: string | null;

  @Column('tinytext', { name: 'link_recurring', nullable: true })
    linkRecurring?: string | null;

  @Column('tinytext', { name: 'Account_name', nullable: true })
    accountName?: string | null;

  @Column('tinyint', {
    name: 'preferred', nullable: true, width: 1, transformer: numberToBooleanTransformer,
  })
    preferred?: boolean | null;

  @Column('text', { name: 'DCAF', nullable: true })
    DCAF?: string | null;

  @Column('tinyint', { width: 1, nullable: true })
    InBofA?: number;

  @Column('tinyint', {
    name: 'deleted', nullable: true, width: 1, default: () => "'0'",
  })
    deleted?: boolean | null;

  @Column('varchar', { name: 'uuid', nullable: false, default: () => "''" })
    uuid?: string;

  @Column('varchar', { name: 'accountType', nullable: false, default: () => `'${BankAccountType.Personal}'` })
    accountType: BankAccountType;

  @Column('varchar', { name: 'bankLocation', nullable: false, default: () => `'${BankLocation.Domestic}'` })
    bankLocation: BankLocation;

  @Column('varchar', { name: 'bankCountry', nullable: false, default: () => "''" })
    bankCountry: string;

  @Column('varchar', { name: 'bankName', nullable: false, default: () => "''" })
    bankName: string;

  @Column('tinytext', { name: 'name', nullable: true })
    name: string;

  @Column('tinytext', { name: 'lastName', nullable: true })
    lastName?: string | null;

  @Column(() => Address)
  @Type(() => Address)
    address: Address;

  @Column('varchar', {
    select: false, name: 'account_number', nullable: true,
  })
    accountNumber?: string;

  @Column('varchar', { name: 'routing_number', nullable: true })
    routingNumber?: string | null;

  @Column('varchar', { name: 'swift', nullable: true })
    swift?: string | null;

  @Column('tinyint', {
    name: 'useIBAN', nullable: true, transformer: numberToBooleanTransformer,
  })
    useIBAN?: boolean;

  @Column('varchar', { select: false, name: 'iban', nullable: true })
    iban?: string | null;

  @Column('varchar', { name: 'extra', nullable: true })
    extra?: string | null;

  @Column('varchar', { name: 'status', nullable: false, default: () => `'${BankAccountStatus.Review}'` })
    status: BankAccountStatus;

  @ManyToOne(() => User, (user) => user.bankAccounts, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
    user?: User;

  @Column('int', { name: 'receivingBank_id', default: () => "'0'" })
    receivingBankId: ReceivingBank['id'];

  @OneToMany(() => Request, (request) => request.bankAccount, { createForeignKeyConstraints: false })
    requests?: Request[];
}
