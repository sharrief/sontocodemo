import {
  Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { User, Request } from '@entities';
import {
  IUser, IRequest, OperationType, IOperation,
} from '@interfaces';
import { currencyTransformer, dateTransformer } from '@transformers';
import env from '@server/lib/env';

@Entity('operations', { schema: env.var.DB_NAME })
@Index('date', ['year', 'month', 'day'])
@Index('description', ['amount', 'wireConfirmation'], { fulltext: true })
export class Operation implements IOperation {
  @Expose()
  get type() {
    if (this.amount < 0) return OperationType.Debit;
    return OperationType.Credit;
  }

  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('int', { name: 'user_id', nullable: true })
    userId?: number | null;

  @Column('varchar', {
    name: 'amount',
    length: 100,
    nullable: true,
    transformer: currencyTransformer,
  })
    amount: number | null;

  @Column('datetime', { name: 'created', nullable: true, transformer: dateTransformer })
    created: number | null;

  @Column('int', { name: 'created_id', nullable: true })
    createdId: number | null;

  createdBy?: IUser;

  @Column('int', { width: 2, name: 'day', nullable: true })
    day: number | null;

  @Column('int', { width: 2, name: 'month', nullable: true })
    month: number | null;

  @Column('int', { width: 4, name: 'year', nullable: true })
    year: number | null;

  @Column('tinyint', {
    name: 'deleted',
    nullable: true,
    width: 1,
    default: () => "'0'",
  })
  @Index('deleted')
    deleted: boolean | null;

  @Column('int', { name: 'request_id', nullable: true })
  @Index('request')
    requestId: number;

  @Column('text', { name: 'wire_confirmation', nullable: true })
    wireConfirmation: string | null;

  @ManyToOne(() => User, (user) => user.operations, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
    user: IUser;

  @ManyToOne(() => Request, (request) => request.operations, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'request_id' })
    request?: IRequest;
}
