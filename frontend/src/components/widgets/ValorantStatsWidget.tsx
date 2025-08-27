'use client';

import { useState, useEffect } from 'react';
import { ValorantUser, UserProfile } from 'haze.bio/types';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ValorantStatsWidgetProps {
  username: string;
  tag: string;
  profile: UserProfile;
  valorantData: ValorantUser | null;
}

function ValorantStatsWidget({ username, tag, profile, valorantData }: ValorantStatsWidgetProps) {
  const [isLoading, setIsLoading] = useState(!valorantData);

  useEffect(() => {
    if (valorantData) {
      setIsLoading(false);
    }
  }, [valorantData]);

  if (isLoading) {
    return (
      <div
        className="backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 hover:border-white/20"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: `${profile?.card_border_radius || 8}px`
        }}
      >
        <div className="p-4 sm:p-5 flex justify-center items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (!valorantData || Object.keys(valorantData).length === 0) {
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
          <span className="text-sm text-zinc-400">Valorant account not found</span>
        </div>
      </div>
    );
  }

  const getRankImagePath = (rank: string) => {
    const cleanRank = rank.toLowerCase().replace(/\s+/g, '');
    return `/ranks/${cleanRank}.png`;
  };

  const getRankColor = (rank: string) => {
    const lowerRank = rank.toLowerCase();

    if (lowerRank.includes('iron')) return '#7B7A7C';
    if (lowerRank.includes('bronze')) return '#A97551';
    if (lowerRank.includes('silver')) return '#A7A7AD';
    if (lowerRank.includes('gold')) return '#E8C64D';
    if (lowerRank.includes('platinum')) return '#59A9B6';
    if (lowerRank.includes('diamond')) return '#B489C4';
    if (lowerRank.includes('ascendant')) return '#5DC563';
    if (lowerRank.includes('immortal')) return '#CF2F2F';
    if (lowerRank.includes('radiant')) return '#FFFAC6';

    return '#FFFFFF';
  };

  const rankRating = valorantData.rr || 0;
  const rrPercentage = Math.min(rankRating, 100);

  const formattedRR = rankRating.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const textColor = profile.text_color || 'white';
  const accentColor = profile.accent_color || '#FF4655';

  let background = `rgba(${parseInt((profile?.background_color || '#000000').slice(1, 3), 16)}, ${parseInt((profile?.background_color || '#000000').slice(3, 5), 16)}, ${parseInt((profile?.background_color || '#000000').slice(5, 7), 16)}, ${profile?.card_opacity * 0.9})`;
  return (
    <div
      className="backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 hover:border-white/20 relative"
      style={{
        backgroundColor: background,
        borderRadius: `${profile?.card_border_radius || 8}px`
      }}
    >
      <div className="p-4 sm:p-5 mt-2">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <Image
              src={getRankImagePath(valorantData.rank)}
              alt={valorantData.rank}
              width={56}
              height={56}
              className="w-12 h-12 sm:w-14 sm:h-14"
              draggable="false"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col">
              <div className="flex items-center">
                <h3 className="text-base sm:text-lg font-semibold text-white truncate" style={{ color: accentColor }}>
                  {valorantData.name}
                </h3>
                <span className="text-xs font-medium text-zinc-500 ml-1">#{valorantData.tag}</span>
              </div>

              <div className="flex items-center mt-0.5">
                <span className="text-sm" style={{ color: getRankColor(valorantData.rank) }}>
                  {valorantData.rank}
                </span>
                <span className="text-xs text-zinc-500 ml-2">{formattedRR} RR</span>
              </div>
            </div>

            <div className="mt-2">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${rrPercentage}%`,
                    backgroundColor: getRankColor(valorantData.rank),
                  }}
                />
              </div>
            </div>

            {/* <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-zinc-400" style={{ color: textColor }}>
                  K/D: <span className="text-white">{(valorantData.kd || 0).toFixed(2)}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-zinc-400" style={{ color: textColor }}>
                  HS: <span className="text-white">{valorantData.hs || 0}%</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-zinc-400" style={{ color: textColor }}>
                  WR: <span className="text-white">{valorantData.winrate || 0}%</span>
                </span>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ValorantStatsWidget;