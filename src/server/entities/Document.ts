import {
  Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { User, Request } from '@entities';
import {
  IDocument, IRequest, IUser, DocumentStage,
} from '@interfaces';
import { currencyTransformer, dateTransformer } from '@transformers';
import env from '@server/lib/env';

@Entity('operation_documents', { schema: env.var.DB_NAME })
@Index('description', ['stage', 'status'], { fulltext: true })
export class Document implements IDocument {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

  @Column('int', { name: 'user_id', nullable: false })
  @Index('user')
    userId: number;

  @Column('int', { name: 'operation_id', nullable: false })
    operationId?: number;

  @Column('timestamp', {
    name: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    transformer: dateTransformer,
  })
    timestamp: number;

  @Column('tinyint', { name: 'deleted', width: 1, default: () => "'0'" })
  @Index('deleted')
    deleted: boolean;

  @Column('int', { nullable: false, name: 'public_id' })
    publicId: number;

  @Column('tinytext', { name: 'email', nullable: false })
    email: string;

  @Column('double', {
    name: 'amount',
    nullable: true,
    transformer: currencyTransformer,
  })
    amount: number | null;

  @Column('int', { name: 'month' })
    month: number;

  @Column('int', { name: 'year' })
    year: number;

  @Column('text', { name: 'document_link', nullable: true })
    documentLink?: string | null;

  @Column('tinytext', { name: 'status', nullable: false })
    status?: string;

  @Column('varchar', { name: 'stage', nullable: true, length: 100 })
  @Index('stage')
    stage?: DocumentStage | null;

  @Column('timestamp', {
    name: 'lastUpdated',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    transformer: dateTransformer,
  })
    lastUpdated: number;

  @ManyToOne(() => Request, (request) => request.documents, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'operation_id' })
    request: IRequest;

  @ManyToOne(() => User, (user) => user.documents, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
    user: IUser;
}
