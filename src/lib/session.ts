import { User } from '@prisma/client';
import { pick } from 'lodash';

export type TPublicUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'roles'
  | 'active'
  | 'picture'
  | 'lastname'
  | 'firstname'
  | 'createdAt'
  | 'eos_pu_id'
  | 'updatedAt'
  | 'wallet_address'
> | null;

export function getPublicSession(user: User): TPublicUser | null {
  const publicProfile = pick<TPublicUser>(user, [
    'id',
    'email',
    'roles',
    'active',
    'picture',
    'lastname',
    'firstname',
    'createdAt',
    'eos_pu_id',
    'updatedAt',
    'wallet_address',
  ]) as TPublicUser;
  return user.active
    ? ({
        ...publicProfile,
        picture: publicProfile?.picture || 'https://cdn.kiraverse.game/static/paramlabs-logo.png',
        name: publicProfile?.firstname + ' ' + publicProfile?.lastname,
      } as TPublicUser)
    : null;
}
