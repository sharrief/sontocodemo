import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IDelegation } from '@interfaces';
import env from '@server/lib/env';
import { numberToBooleanTransformer } from './Transformers';

@Entity('delegations', { schema: env.var.DB_NAME })
export class Delegation implements IDelegation {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id = 0;

  @Column('int', { name: 'owner_id' })
    ownerId = 0;

  @Column('int', { name: 'delegate_id' })
    delegateId = 0;

  //deleted Column
  @Column('int', { name: 'deleted', transformer: numberToBooleanTransformer, nullable: true })
    deleted = false;

  //created by column
  @Column('int', { name: 'created_id', nullable: true })
    createdId = 0;
}
