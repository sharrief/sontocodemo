import { Column, Entity, PrimaryColumn } from 'typeorm';
import env from '@server/lib/env';

type data = {
  passport?: {
    user?: {
      id?: number;
      authEmail?: string;
    };
  };
}

@Entity('sessions', { schema: env.var.DB_NAME })
export class Session {
  @PrimaryColumn('varchar', { name: 'session_id', nullable: false, length: 256 })
    sessionId: string;

  @Column('int', { name: 'expires', width: 100 })
    expires: number;

  @Column('text', {
    name: 'data',
    transformer: {
      from: (d: string) => JSON.parse(d) as data,
      to: (d: data) => JSON.stringify(d),
    },
  })
    data: data;
}
