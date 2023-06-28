import { dateTransformer, stringToNumberTransformer } from '@transformers';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ITrade } from '@interfaces';
import env from '@server/lib/env';

@Entity('reports', { schema: env.var.DB_NAME })
export class Trade implements ITrade {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('varchar', { name: 'trade', nullable: true, length: 100 })
    currency: string | null;

  @Column('int', { width: 2, name: 'day', nullable: true })
    day: number | null;

  @Column('varchar', {
    name: 'interest', nullable: true, length: 100, transformer: stringToNumberTransformer,
  })
    interest: number | null;

  @Column('int', { width: 2, name: 'month', nullable: true })
    month: number | null;

  @Column('int', { width: 4, name: 'year', nullable: true })
    year: number | null;

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

  @Column('tinyint', {
    name: 'published',
    nullable: true,
    width: 1,
    default: () => "'0'",
  })
    published: boolean | null;
}
