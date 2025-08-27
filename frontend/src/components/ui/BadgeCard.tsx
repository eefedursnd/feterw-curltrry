'use client';

import Image from "next/image";
import { UserBadge, UserProfile, Badge, User } from "haze.bio/types";
import { BugHunterBadge, BoosterBadge, EarlyUserBadge, EventWinnerBadge, PremiumBadge, StaffBadge, FeaturedBadge, PartnerBadge, getBadgeIcon, BadgeColors } from "haze.bio/badges/Badges";
import Tooltip from '../ui/Tooltip';
import { badgeAPI } from "haze.bio/api";

interface BadgeCardProps {
  user: User;
  size?: 'default' | 'small';
}

export default function BadgeCard({ user, size = 'default' }: BadgeCardProps) {
  if (!user.badges.length) return null;
  const profileBadgeColor = user.profile?.badge_color;

  // Determine size classes based on the size prop
  const sizeClasses = size === 'small' 
    ? "w-4 h-4 sm:w-5 sm:h-5" 
    : "w-5 h-5 sm:w-6 sm:h-6";
  
  const gapSize = size === 'small' ? "gap-1" : "gap-1.5";

  return (
    <div className={`flex items-center ${gapSize} overflow-visible`}>
      {user.badges.map(({ hidden, id, badge_id, badge }) => {
        if (hidden) return null;

        if (!badge.name) return null;

        const badgeKey = badge.name.toUpperCase().replace(/ /g, "_") as keyof typeof BadgeColors;
        const badgeColor = BadgeColors[badgeKey] || undefined;

        return (
          <Tooltip key={id} text={badge.name} position="bottom">
            <div
              className={`${sizeClasses} transition-transform duration-200
                        group-hover:scale-110 group-hover:-translate-y-0.5 flex items-center justify-center`}
            >
              {badge.is_custom ? (
                <Image
                  src={badge.media_url}
                  alt={badge.name}
                  width={size === 'small' ? 20 : 24}
                  height={size === 'small' ? 20 : 24}
                  className="w-full h-full object-contain"
                  unoptimized
                  draggable="false"
                  style={{
                    maxWidth: "100%",
                    height: "auto"
                  }}
                />
              ) : (
                getBadgeIcon(
                  badge.name,
                  size === 'small' ? 20 : undefined,
                  undefined,
                  {
                    filter: user.profile?.glow_badges
                      ? `drop-shadow(${user.profile?.monochrome_badges ? profileBadgeColor : badgeColor} 0 0 3px)`
                      : undefined,
                  },
                  user.profile?.monochrome_badges,
                  user.profile?.badge_color || undefined
                )
              )}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}