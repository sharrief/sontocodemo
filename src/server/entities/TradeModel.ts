import {
  Column, Entity, Index, PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ITradeModel,
} from '@interfaces';
import env from '@server/lib/env';

@Entity('trade_model', { schema: env.var.DB_NAME })
@Index('id', ['name'])
export class TradeModel implements ITradeModel {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('varchar', { name: 'name' })
    name: string;
}
