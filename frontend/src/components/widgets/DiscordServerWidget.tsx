'use client';

import Image from 'next/image';
import { DiscordServer, UserProfile } from 'haze.bio/types';
import { X, Users, UserCheck } from 'lucide-react';
import { DiscordIcon } from 'haze.bio/socials/Socials';

interface DiscordServerWidgetProps {
  inviteLink: string;
  profile: UserProfile;
  serverData: DiscordServer | null;
}

function DiscordServerWidget({ inviteLink, profile, serverData }: DiscordServerWidgetProps) {
  const formattedInviteLink = inviteLink.startsWith('https://discord.gg/') || inviteLink.startsWith('https://discord.com/invite/')
    ? inviteLink
    : `https://discord.gg/${inviteLink}`;

  if (!serverData || Object.keys(serverData).length === 0) {
    return (
      <div
        className="backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 hover:border-white/20"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: `${profile?.card_border_radius || 8}px`
        }}
      >
        <div className="p-4 sm:p-5 flex items-center justify-center gap-2">
          <X className="w-5 h-5 text-red-500" />
          <span className="text-sm text-zinc-400">Server doesn't exist</span>
        </div>
      </div>
    );
  }

  const textColor = profile.text_color || 'white';
  let background = `rgba(${parseInt((profile?.background_color || '#000000').slice(1, 3), 16)}, ${parseInt((profile?.background_color || '#000000').slice(3, 5), 16)}, ${parseInt((profile?.background_color || '#000000').slice(5, 7), 16)}, ${profile?.card_opacity * 0.9})`;
  return (
    <div
      className="backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 hover:border-white/20 relative"
      style={{
        backgroundColor: background,
        borderRadius: `${profile?.card_border_radius || 8}px`
      }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <Image
              src={serverData.avatar}
              alt={serverData.name}
              width={56}
              height={56}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl"
              draggable="false"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-white truncate" style={{ color: profile?.accent_color || 'white' }}>
                {serverData.name}
              </h3>
              <a
                href={`${formattedInviteLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-2 py-0.8 bg-[#4752C4] hover:bg-[#5B69E2] transition-colors rounded-md
                     text-sm text-white font-medium flex items-center gap-1.5"
              >
                Join
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#3ba55c]" />
                <span className="text-sm text-zinc-400" style={{ color: textColor }}>
                  {serverData.online_count?.toLocaleString()} Online
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-500" />
                <span className="text-sm text-zinc-400" style={{ color: textColor }}>
                  {serverData.total_count?.toLocaleString()} Members
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscordServerWidget;