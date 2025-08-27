'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Music, ExternalLink } from 'lucide-react';
import { UserProfile } from 'haze.bio/types';
import Tooltip from '../ui/Tooltip';
import { SpotifyIcon } from 'haze.bio/socials/Socials';

interface SpotifyWidgetProps {
    spotifyUrl: string;
    layout?: 'detailed' | 'compact';
    useProfileColors?: boolean;
    profile: UserProfile;
}

const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({
    spotifyUrl,
    layout = 'detailed',
    useProfileColors = true,
    profile
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { contentType, spotifyId } = useMemo(() => {
        try {
            if (!spotifyUrl) return { contentType: null, spotifyId: null };

            // Handle case where user pastes a URL without the protocol
            const urlToProcess = spotifyUrl.trim().startsWith('http')
                ? spotifyUrl.trim()
                : `https://${spotifyUrl.trim()}`;

            const url = new URL(urlToProcess);

            // Ensure it's from Spotify
            if (!url.hostname.includes('spotify.com')) {
                return { contentType: null, spotifyId: null };
            }

            const pathSegments = url.pathname.split('/').filter(Boolean);

            if (pathSegments.length < 2) return { contentType: null, spotifyId: null };

            const type = pathSegments[0];
            // Make sure we get the ID without any query parameters
            const id = pathSegments[1].split('?')[0];

            if (type === 'track' || type === 'album' || type === 'playlist') {
                return {
                    contentType: type as 'track' | 'album' | 'playlist',
                    spotifyId: id
                };
            }

            return { contentType: null, spotifyId: null };
        } catch (e) {
            console.error("Error parsing Spotify URL:", e);
            return { contentType: null, spotifyId: null };
        }
    }, [spotifyUrl]);

    const isValid = useMemo(() => {
        // Removed the regex validation as Spotify IDs can vary in format
        return !!spotifyId && !!contentType;
    }, [spotifyId, contentType]);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 500);

        if (!spotifyUrl) {
            setError("Please provide a Spotify URL");
        } else if (!isValid) {
            setError("Invalid Spotify URL. Please provide a track, album, or playlist link from Spotify.");
        } else {
            setError(null);
        }

        return () => clearTimeout(timer);
    }, [spotifyUrl, isValid]);

    if (error) {
        return (
            <div
                className="backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: `${profile?.card_border_radius || 8}px`
                }}
            >
                <div className="flex items-center justify-center gap-2 text-red-400">
                    <Music className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div
                className="backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: `${profile?.card_border_radius || 8}px`
                }}
            >
                <div className="flex items-center justify-center gap-2 text-zinc-400">
                    <Music className="w-5 h-5" />
                    <span>Please provide a valid Spotify URL</span>
                </div>
            </div>
        );
    }

    const textColor = useProfileColors ? profile?.text_color || 'white' : 'white';
    const accentColor = useProfileColors ? profile?.accent_color || '#1DB954' : '#1DB954';
    const borderRadius = profile?.card_border_radius || 8;

    const getSpotifyEmbedUrl = () => {
        const baseUrl = 'https://open.spotify.com/embed';
        return `${baseUrl}/${contentType}/${spotifyId}`;
    };

    const embedUrl = getSpotifyEmbedUrl();

    const getSpotifyShareUrl = () => {
        const baseUrl = 'https://open.spotify.com';
        return `${baseUrl}/${contentType}/${spotifyId}`;
    };

    const getFrameHeight = () => {
        if (layout === 'compact') {
            return 80;
        }

        switch (contentType) {
            case 'track':
                return 152;
            case 'album':
            case 'playlist':
                return 352;
            default:
                return 152;
        }
    };

    return (
        <div
            className="backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 hover:border-white/20 relative"
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: `${borderRadius}px`
            }}
        >
            {isLoading ? (
                <div
                    className="w-full flex items-center justify-center"
                >
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="pointer-events-none">
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height={getFrameHeight()}
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className={`rounded-lg pointer-events-auto`}
                        style={{
                            borderRadius: `${borderRadius}px`,
                            colorScheme: 'dark'
                        }}
                    ></iframe>
                </div>
            )}

            <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{ borderRadius: `${borderRadius}px` }}
            />
        </div>
    );
};

export default SpotifyWidget;