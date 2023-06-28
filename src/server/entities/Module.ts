import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import env from '@server/lib/env';

@Entity('modules', { schema: env.var.DB_NAME })
export class Module {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('varchar', { name: 'module', nullable: true, length: 100 })
    module: string | null;

  @Column('varchar', { name: 'slug', nullable: true, length: 100 })
    slug: string | null;

  @Column('varchar', { name: 'icon', nullable: true, length: 100 })
    icon: string | null;

  @Column('varchar', { name: 'color', nullable: true, length: 100 })
    color: string | null;
}
