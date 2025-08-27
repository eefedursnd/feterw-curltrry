'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MarqueeUser } from 'haze.bio/types';
import { ExternalLink, ArrowUpRight, User as UserIcon } from 'lucide-react';

interface Props {
  users: MarqueeUser[];
}

export default function UserMarquee({ users }: Props) {
  const [isPaused, setIsPaused] = useState(false);
  const [activeUser, setActiveUser] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on a mobile device (touch screen)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const minUsers = 12;
  const marqueeUsers = Array.isArray(users) && users.length > 0
    ? [...users]
    : Array(minUsers).fill({
      username: 'demo',
      display_name: 'Demo User',
      avatar_url: '',
      bio: 'Creator and digital influencer',
      followers: '10K+',
      type: 'Creator'
    });

  // Ensure we have enough items
  while (marqueeUsers.length < minUsers) {
    marqueeUsers.push(...marqueeUsers);
  }

  const handleMouseEnter = (index: number) => {
    setIsPaused(true);
    setActiveUser(index);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    setActiveUser(null);
  };

  const getPlaceholderInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const UserList = () => (
    <>
      {marqueeUsers.map((user, index) => {
        const isActive = activeUser === index;
        const placeholderInitials = getPlaceholderInitials(user.display_name || user.username);

        return (
          <div
            key={`${user.username}-${index}`}
            className="flex-shrink-0 group"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href={`/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-4 py-2.5 
                ${isActive ? 'bg-black/70' : 'bg-black/30'} 
                backdrop-blur-sm rounded-lg border 
                ${isActive ? 'border-purple-500/30' : 'border-white/5'} 
                hover:border-purple-500/30 hover:bg-black/70 transition-all duration-300
                ${isActive ? 'shadow-lg shadow-purple-500/5' : ''}`}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-700/10">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    fill
                    draggable="false"
                    className={`object-cover transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                    sizes="40px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-purple-700/20 text-white font-medium">
                    {placeholderInitials}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-white whitespace-nowrap group-hover:text-purple-100 transition-colors">
                  {user.display_name || user.username}
                </span>
              </div>

              {isActive && !isMobile && (
                <ArrowUpRight className="w-3 h-3 text-purple-400 ml-1 animate-fade-in" />
              )}
            </Link>
          </div>
        );
      })}
    </>
  );

  return (
    <div
      className="relative w-full overflow-hidden py-8"
      ref={containerRef}
    >
      {/* Background gradients for fade effect */}
      <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      {/* Double marquee technique that never jumps */}
      <div className="marquee-wrapper">
        <div
          className={`marquee-track flex gap-4 ${isMobile ? 'animate-marquee-faster' : 'animate-marquee'}`}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          <div className="marquee-content flex gap-4">
            <UserList />
          </div>
        </div>
      </div>
    </div>
  );
}