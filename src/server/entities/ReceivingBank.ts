import {
  Column, Entity, PrimaryGeneratedColumn, OneToMany,
} from 'typeorm';
import {
  IReceivingBank,
} from '@interfaces';
import { BankDatum } from '@entities';
import env from '@server/lib/env';

@Entity('receiving_bank', { schema: env.var.DB_NAME })
export class ReceivingBank implements IReceivingBank {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

    @Column('tinyint', {
      name: 'deleted', nullable: true, width: 1, default: () => "'0'",
    })
      deleted?: boolean | null;

    @Column('varchar', { name: 'account_name', nullable: false })
      accountName: string;

    @Column('varchar', { name: 'account_address', nullable: false })
      accountAddress: string;

    @Column('varchar', { name: 'account_number', nullable: false })
      accountNumber: string;

      @Column('varchar', { name: 'bank_name', nullable: false })
        bankName: string;

    @Column('varchar', { name: 'bank_address', nullable: false })
      bankAddress: string;

      @Column('varchar', { name: 'bank_routing_ach', nullable: false })
        bankRoutingACH: string;

    @Column('varchar', { name: 'bank_routing_wires', nullable: false })
      bankRoutingWires: string;

    @Column('varchar', { name: 'bank_swift', nullable: false })
      bankSWIFT: string;

    @Column('varchar', { name: 'bank_extra', nullable: false })
      bankExtra: string;

    @OneToMany(() => BankDatum, (bankAccount) => bankAccount.receivingBankId, { createForeignKeyConstraints: false })
      bankAccounts?: BankDatum[];
}
