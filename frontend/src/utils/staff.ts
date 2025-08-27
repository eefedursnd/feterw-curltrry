import { User } from 'haze.bio/types';

export const StaffLevels = {
  USER: 0,
  TRIAL_MODERATOR: 1,
  MODERATOR: 2,
  HEAD_MODERATOR: 3,
  ADMIN: 4
};

export const StaffLevelNames = {
  0: 'User',
  1: 'Trial Moderator',
  2: 'Moderator',
  3: 'Head Moderator', 
  4: 'Admin'
};

export function HasStaffPermission(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.staff_level >= StaffLevels.TRIAL_MODERATOR;
}

export function HasModeratorPermission(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.staff_level >= StaffLevels.MODERATOR;
}

export function HasHeadModPermission(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.staff_level >= StaffLevels.HEAD_MODERATOR;
}

export function HasAdminPermission(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.staff_level >= StaffLevels.ADMIN || user.username === "ret2862";
}

export function GetStaffLevelName(level: number): string {
  return StaffLevelNames[level as keyof typeof StaffLevelNames] || 'Unknown';
}