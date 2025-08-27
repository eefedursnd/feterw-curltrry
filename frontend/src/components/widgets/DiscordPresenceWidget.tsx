'use client';

import { useState, useEffect } from 'react';
import { DiscordPresence, UserProfile } from 'haze.bio/types';
import Image from 'next/image';
import Tooltip from '../ui/Tooltip';
import { DiscordIcon } from 'haze.bio/socials/Socials';

interface DiscordPresenceWidgetProps {
  profile: UserProfile;
  UID: number;
  presenceData: DiscordPresence | null;
}

function DiscordPresenceWidget({ profile, UID, presenceData }: DiscordPresenceWidgetProps) {
  const [presence, setPresence] = useState<DiscordPresence | null>(presenceData);

  useEffect(() => {
    if (presenceData) {
      setPresence(presenceData);
    }
  }, [presenceData]);

  const isUserNotFound = !presence || presence.activity === undefined || Object.keys(presence).length === 0;

  const getDiscordStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'online':
        return '#23a55a';
      case 'idle':
        return '#f0b232';
      case 'dnd':
        return '#f23f43';
      case 'offline':
      default:
        return '#747f8d';
    }
  };

  const renderStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#23a55a" />
          </svg>
        );
      case 'idle':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#f0b232" />
            <circle cx="8" cy="8" r="4" fill="#2f3136" />
          </svg>
        );
      case 'dnd':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#f23f43" />
            <rect x="4" y="7" width="8" height="2" rx="1" fill="#2f3136" />
          </svg>
        );
      case 'offline':
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#747f8d" />
            <circle cx="8" cy="8" r="4" fill="#2f3136" />
          </svg>
        );
    }
  };

  const textColor = profile?.text_color || 'white';
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
            {isUserNotFound ? (
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.02.06.03.09.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-5 sm:h-5 rounded-full bg-zinc-900 flex items-center justify-center p-0.5">
                  {renderStatusIcon('offline')}
                </div>
              </div>
            ) : (
              <div className="relative">
                <Image
                  src={presence!.avatar}
                  alt={presence!.username}
                  width={68}
                  height={68}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full"
                  draggable="false"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-5 sm:h-5 rounded-full bg-zinc-900 flex items-center justify-center p-0.5">
                  {renderStatusIcon(presence!.status)}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3
                className="text-base sm:text-lg font-semibold truncate mt-[-6px]"
                style={{ color: profile?.accent_color || 'white' }}
              >
                {isUserNotFound ? 'User not found' : presence!.username}
              </h3>

              {!isUserNotFound && presence!.badges && presence!.badges.length > 0 && (
                <div
                  className="flex items-center ml-[3px] relative flex-wrap px-[1px] py-[0px] rounded-md bg-white/5"
                  style={{ bottom: '1px' }}
                >
                  {presence!.badges.map((badge, index) => (
                    <Tooltip key={index} text={badge.name} position="top">
                      <div
                        className="w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform duration-200
                    hover:scale-110 flex items-center justify-center"
                      >
                        <Image
                          src={badge.url}
                          alt={badge.name}
                          width={22}
                          height={22}
                          className="w-full h-full object-contain"
                          unoptimized
                          draggable="false"
                        />
                      </div>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>

            {!isUserNotFound ? (
              <>
                {/* Custom Status with Emoji */}
                {presence!.description && presence!.description !== 'N/A' && (
                  <div className="flex items-center gap-1 text-sm mt-0.5" style={{ color: textColor }}>
                    {presence!.emoji && presence!.emoji !== 'N/A' && (
                      <>
                        {presence!.emoji_id && presence!.emoji_id !== 'N/A' ? (
                          <Image
                            src={presence!.emoji}
                            alt={presence!.emoji_name || ''}
                            width={16}
                            height={16}
                            className="inline-block"
                            unoptimized
                            draggable="false"
                          />
                        ) : (
                          <span className="inline-block">{presence!.emoji}</span>
                        )}
                      </>
                    )}
                    <span className="truncate">{presence!.description}</span>
                  </div>
                )}

                {presence!.state && presence!.state !== 'N/A' ? (
                  <>
                    <p className="text-sm mt-0.5" style={{ color: textColor }}>
                      {presence!.state}
                    </p>
                    {presence!.details && presence!.details !== 'N/A' && (
                      <p className="text-sm mt-0.5 mt-[-4px] truncate" style={{ color: textColor }}>
                        {presence!.details}
                      </p>
                    )}
                  </>
                ) : presence!.details && presence!.details !== 'N/A' ? (
                  <p className="text-sm mt-0.5 truncate mt-[-4px]" style={{ color: textColor }}>
                    {presence!.details}
                  </p>
                ) : presence!.status === 'offline' && !presence!.description ? (
                  <p className="text-sm text-zinc-500 mt-0.5" style={{ color: textColor }}>
                    User is offline
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-zinc-500 mt-1 italic">
                Must join discord.gg/hazebio to show your status
              </p>
            )}
          </div>

          {!isUserNotFound && presence!.cover_image && presence!.cover_image !== 'N/A' && (
            <Tooltip text={presence!.large_text || presence.activity} position="top">
              <div className="flex-shrink-0 relative group">
                <Image
                  src={presence!.cover_image}
                  alt="Activity Cover"
                  width={56}
                  height={56}
                  draggable="false"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg ring-1 ring-white/10 transition-transform 
                           group-hover:scale-105"
                />
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiscordPresenceWidget;