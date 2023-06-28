import { RoleId } from '@interfaces';
import { EntityManager } from 'typeorm';
import { Users } from './users.repository';

export const AUTH_ALLOW_MANAGER = async (authUserId: number, manager: EntityManager) => {
  const customUsersRepo = manager.getCustomRepository(Users);

  const authUser = await customUsersRepo.getUserById({ authUserId, id: authUserId });
  if (!authUser || ![RoleId.admin, RoleId.director, RoleId.manager].includes(authUser.roleId)) {
    throw new Error('UNAUTHORIZED');
  }
};

export const AUTH_ALLOW_USER_TO_EDIT_USER = async (authUserId: number, manager: EntityManager, seekingAccessToUserId: number) => {
  const customUsersRepo = manager.getCustomRepository(Users);

  const soughtUser = await customUsersRepo.getUserById({ authUserId, id: seekingAccessToUserId });
  if (!soughtUser) {
    throw new Error('UNAUTHORIZED');
  }
};

export const AUTH_ALLOW_MANAGER_TO_EDIT_USER = async (authUserId: number, manager: EntityManager, seekingAccessToUserId: number) => {
  const customUsersRepo = manager.getCustomRepository(Users);
  const managerUser = await customUsersRepo.getUserById({ authUserId, id: authUserId });
  if (![RoleId.admin, RoleId.director].includes(managerUser.roleId)) {
    throw new Error('UNAUTHORIZED');
  }
  const soughtUser = await customUsersRepo.getUserById({ authUserId, id: seekingAccessToUserId });
  if (!soughtUser) {
    throw new Error('UNAUTHORIZED');
  }
};
