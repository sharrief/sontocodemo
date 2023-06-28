/* eslint-disable class-methods-use-this */
import { AbstractRepository, EntityRepository } from 'typeorm';
import {
  ReceivingBank,
} from '@entities';

@EntityRepository(ReceivingBank)
export class ReceivingBanks extends AbstractRepository<ReceivingBank> {
  find(id? : number) {
    let query = this.createQueryBuilder('receivingBank');
    query = query.where('receivingBank.deleted=0');
    if (id) {
      query = query.where('receivingBank.id=:id', { id });
    }
    return query.getMany();
  }
}
