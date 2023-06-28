import {
  EntityRepository, AbstractRepository,
} from 'typeorm';
import { Session } from '@entities';

@EntityRepository(Session)
export class Sessions extends AbstractRepository<Session> {
  async unsafeDeleteSessionsForUser({ email, userId }: {userId: number; email: string}) {
    const sessions = await this.createQueryBuilder('session').getMany();
    const userSessionIds = sessions
      .filter(({ data }) => (data?.passport?.user?.id === userId || data?.passport?.user?.authEmail === email))
      .map((session) => session.sessionId);
    if (userSessionIds?.length) {
      await this.createQueryBuilder('session')
        .delete()
        .where('session_id in (:userSessionIds)', { userSessionIds })
        .execute();
    }
  }
}
