import {
  Column, Entity, Index, PrimaryGeneratedColumn, ValueTransformer,
} from 'typeorm';
import {
  ITradeEntry, TradeSide,
} from '@interfaces';
import { dateTransformer, numberToBooleanTransformer } from '@transformers';
import env from '@server/lib/env';

const numberToArrayTransformer: ValueTransformer = {
  from: (dbValue: string) => dbValue.split(',').map((num) => +num),
  to: (entityValue: number[]) => entityValue.join(','),
};

const decimalToNumberTransformer: ValueTransformer = {
  from: (dbValue: string) => +dbValue,
  to: (entityValue: number) => entityValue,
};

@Entity('trade_entry', { schema: env.var.DB_NAME })
@Index('id', ['tradeNumber', 'bookNumber'])
export class TradeEntry implements ITradeEntry {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('tinyint', { name: 'deleted', transformer: numberToBooleanTransformer, default: () => '\'0\'' })
    deleted: boolean;

  @Column('int', { name: 'userId', nullable: true })
    createdBy: number;

  @Column('varchar', { name: 'bookName', nullable: true })
    bookName: string;

  @Index('tradeNumber')
  @Column('int', { name: 'tradeNumber', nullable: true })
    tradeNumber: number;

  @Index('bookNumber')
  @Column('int', { name: 'bookNumber', nullable: true })
    bookNumber: number;

  @Column('datetime', { name: 'date', transformer: dateTransformer, nullable: true })
    date: number;

  @Column('varchar', { name: 'symbol', nullable: true })
    symbol: string;

  @Column('varchar', { name: 'side', length: 50, nullable: true })
    side: TradeSide;

  @Column('varchar', { name: 'model', length: 50, nullable: true })
    model: string;

  @Column({
    type: 'decimal', precision: 30, scale: 15, name: 'entry', transformer: decimalToNumberTransformer,
  })
    entry: number;

  @Column('varchar', { name: 'exits', transformer: numberToArrayTransformer })
    exits: number[];

  @Column('varchar', { name: 'pips', transformer: numberToArrayTransformer })
    pips: number[];

  @Column('text', { name: 'notes' })
    notes: string;

  @Column('varchar', { name: 'image1' })
    image1: string;

  @Column('varchar', { name: 'image2' })
    image2: string;
}
