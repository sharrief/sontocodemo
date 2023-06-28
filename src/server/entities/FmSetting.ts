import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import env from '@server/lib/env';

@Entity('fm_settings', { schema: env.var.DB_NAME })
export class FmSetting {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('int', { name: 'fm_id' })
    fmId: number;

  @Column('tinytext', { name: 'link' })
    link: string;

  @Column('tinytext', { name: 'type', nullable: true })
    type: string | null;
}
