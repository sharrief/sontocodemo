import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import env from '@server/lib/env';

@Entity('settings', { schema: env.var.DB_NAME })
export class Settings {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('varchar', { name: 'performance_fee', nullable: true, length: 255 })
    performanceFee: string | null;

  @Column('varchar', { name: 'fm_fee', nullable: true, length: 255 })
    fmFee: string | null;

  @Column('varchar', { name: 'backup', nullable: true, length: 255 })
    backup: string | null;

  @Column('varchar', { name: 'percentages', length: 5000 })
    percentages: string;

  @Column('int', { name: 'notif_populiz' })
    notifPopuliz: number;
}
