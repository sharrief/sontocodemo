import {
  Column, Entity, Index, PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ITradeSymbol,
} from '@interfaces';
import env from '@server/lib/env';

@Entity('trade_symbol', { schema: env.var.DB_NAME })
@Index('id', ['name'])
export class TradeSymbol implements ITradeSymbol {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('varchar', { name: 'name' })
    name: string;
}
