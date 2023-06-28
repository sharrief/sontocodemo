import { Expose } from 'class-transformer';
import {
  Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import { User, Operation, Document } from '@entities';
import {
  IRequest, OperationType, IOperation, IUser, IDocument, RequestStatus, IBankDatum,
} from '@interfaces';
import { currencyTransformer, numberToBooleanTransformer, dateTransformer } from '@transformers';
import env from '@server/lib/env';
import { BankDatum } from './BankDatum';

@Entity('operation_requests', { schema: env.var.DB_NAME })
@Index('description', ['status', 'amount', 'wireConfirmation'], { fulltext: true })
export class Request implements IRequest {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Expose()
  get type() {
    return this.amount >= 0 ? OperationType.Credit : OperationType.Debit;
  }

  @Column('int', { name: 'id_client', nullable: true })
  @Index('user')
    userId: number | null;

  @Column('varchar', {
    name: 'amount', nullable: true, length: 11, transformer: currencyTransformer,
  })
    amount: number | null;

  @Column('datetime', { name: 'datetime', nullable: true, transformer: dateTransformer })
    datetime: number | null;

  @Column('varchar', {
    name: 'status',
    length: 50,
    nullable: true,
    default: () => `'${RequestStatus.Pending}'`,
  })
  @Index('status')
    status: RequestStatus;

  @Column('int', { name: 'viewed', nullable: true, default: () => "'0'" })
    viewed: boolean | null;

  @Column('int', {
    width: 1, name: 'admin', default: () => "'0'", transformer: numberToBooleanTransformer,
  })
    admin: boolean;

  @Column('int', {
    width: 1, name: 'show', default: () => "'1'", transformer: numberToBooleanTransformer,
  })
    show: boolean;

  @Column('text', { name: 'wire_confirmation', nullable: true })
    wireConfirmation: string | null;

  @Column('datetime', { name: 'created', nullable: true, transformer: dateTransformer })
    created: number | null;

  @Column('int', { name: 'created_id', nullable: true })
    createdId: number | null;

  @Column('string', { name: 'bankAccountUUID', nullable: true })
    bankAccountUUID: string | null;

  @ManyToOne(() => BankDatum, (bank) => bank.requests, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'bankAccountUUID', referencedColumnName: 'uuid' })
    bankAccount?: IBankDatum;

  @ManyToOne(() => User, (user) => user.requests, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'id_client' })
    user?: IUser;

  @OneToMany(() => Operation, (operation) => operation.request, { eager: true })
    operations?: IOperation[];

  @OneToMany(() => Document, (document) => document.request)
    documents?: IDocument[];
}
