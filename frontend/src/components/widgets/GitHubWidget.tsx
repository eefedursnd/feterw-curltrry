'use client';

import { useState, useEffect } from 'react';
import { GitHubUser, UserProfile } from 'haze.bio/types';
import Image from 'next/image';
import { X, Users, GitBranch, Star, CircleUser } from 'lucide-react';

interface GitHubWidgetProps {
  username: string;
  profile: UserProfile;
  githubData: GitHubUser | null;
}

function GitHubWidget({ username, profile, githubData }: GitHubWidgetProps) {
  const [isLoading, setIsLoading] = useState(!githubData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (githubData) {
      setIsLoading(false);
    }
  }, [githubData]);

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

  if (!githubData || Object.keys(githubData).length === 0) {
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
          <span className="text-sm text-zinc-400">GitHub user not found</span>
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
      <div className="p-4 sm:p-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <a href={`https://github.com/${githubData.login}`} target="_blank" rel="noopener noreferrer">
              <Image
                src={githubData.avatar_url}
                alt={githubData.login || githubData.login}
                width={68}
                height={68}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full"
                draggable="false"
              />
            </a>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col">
              <a
                href={`https://github.com/${githubData.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <h3 className="text-base sm:text-lg font-semibold text-white truncate" style={{ color: profile?.accent_color || 'white' }}>
                  {githubData.login}
                </h3>
              </a>
              <span className="text-sm text-zinc-400" style={{ color: textColor }}>
                @{githubData.login}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-0.5">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <CircleUser className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-zinc-400" style={{ color: textColor }}>
                    {githubData.followers} followers
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-zinc-400" style={{ color: textColor }}>
                  {githubData.public_repos} repos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GitHubWidget;