/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Column } from 'typeorm';
import { AddressModel } from '@models';

export class Address implements AddressModel {
  @Column({ nullable: true })
  line1: string = '';

  @Column({ nullable: true })
  line2: string = '';

  @Column({ nullable: true })
  city: string = '';

  @Column({ nullable: true })
  state: string = '';

  @Column({ nullable: true })
  country: string = '';

  @Column({ nullable: true })
  postal: string = '';

  @Column('tinyint', { default: () => "'1'" })
  isDomestic: boolean = true;
}
