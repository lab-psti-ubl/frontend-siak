import { User, Alumni } from '../types';

export const isUserAlumni = (userId: string, alumni: Alumni[]): boolean => {
  return alumni.some(a => a.muridId === userId);
};

export const isUserInactive = (user: User | undefined): boolean => {
  if (!user) return false;
  return user.role === 'murid' && user.isActive === false;
};

export const isMuridAlumni = (user: User | undefined, alumni: Alumni[]): boolean => {
  if (!user) return false;
  return isUserAlumni(user.id, alumni) || isUserInactive(user);
};
