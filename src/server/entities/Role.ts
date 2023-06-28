import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RoleId } from '@interfaces';
import env from '@server/lib/env';

@Entity('roles', { schema: env.var.DB_NAME })
export class Role {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('varchar', { name: 'role', nullable: true, length: 100 })
    role: RoleId | null;

  @Column('varchar', { name: 'module_ids', nullable: true, length: 100 })
    moduleIds: string | null;
}
