import {
  Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '@entities';
import {
  IStatement, IUser, ITrade, Modality, IOperation,
} from '@interfaces';
import { dateTransformer } from '@transformers';
import env from '@server/lib/env';

@Entity('client_report', { schema: env.var.DB_NAME })
export class Statement implements IStatement {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id = 0;

  @Column('int', { name: 'user_id', nullable: true })
  @Index('user')
    userId: number;

  @Column('int', {
    width: 11, name: 'year', nullable: true,
  })
    year: number;

  @Column('int', {
    width: 2, name: 'month', nullable: true,
  })
    month: number;

  @Column('double', {
    name: 'gain_loss',
    nullable: true,
  })
    gainLoss: number;

  @Column('float', {
    name: 'perf_fee', precision: 20, scale: 5, nullable: true,
  })
    perfFee: number;

  @Column('float', {
    name: 'fm_fee', precision: 20, scale: 5, nullable: true,
  })
    fmFee: number;

  @Column('float', {
    name: 'monthly_dividend',
    precision: 20,
    scale: 5,
    nullable: true,
  })
    monthlyDividend: number;

  previousStatement: IStatement;

  @Column('double', {
    name: 'end_balance',
    nullable: true,
  })
    endBalance: number;

  @Column('enum', {
    name: 'modality',
    nullable: true,
    enum: ['No-Compounding', 'Compounding'],
  })
    modality: Modality | null;

  @Column('datetime', { name: 'created', nullable: true, transformer: dateTransformer })
    created: number | null;

  @Column('int', { name: 'created_id', nullable: true })
    createdId: number | null;

  @Column('tinyint', {
    name: 'deleted',
    nullable: true,
    width: 1,
    default: () => "'0'",
  })
    deleted: boolean | null;

  @Column('int', { width: 3, nullable: false, name: 'percentage' })
    percentage: number;

  @ManyToOne(() => User, (user) => user.statements, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'user_id' })
    user: IUser;
}
