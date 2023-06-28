import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import env from '@server/lib/env';

@Entity('currencies', { schema: env.var.DB_NAME })
export class Currency {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('varchar', { name: 'currency', nullable: true, length: 100 })
    currency?: string | null;

  @Column('tinyint', {
    name: 'deleted',
    nullable: true,
    width: 1,
    default: () => "'0'",
  })
    deleted?: boolean | null;

  @Column('datetime', { name: 'created', nullable: true })
    created?: Date | null;

  @Column('int', { name: 'created_id', nullable: true })
    createdId?: number | null;

  @Column('datetime', { name: 'modificated', nullable: true })
    modificated?: Date | null;

  @Column('int', { name: 'modificated_id', nullable: true })
    modificatedId?: number | null;
}
