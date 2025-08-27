'use client';

import { useEffect, useState, useRef } from 'react';
import { User, UserProfile, Template } from 'haze.bio/types';
import * as SocialIcons from '../../../socials/Socials';
import DefaultTemplatePreview from './DefaultTemplatePreview';
import ModernTemplatePreview from './ModernTemplatePreview';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import Tooltip from 'haze.bio/components/ui/Tooltip';
import MinimalisticPreview from './MinimalisticPreview';

interface ProfilePreviewProps {
    profile: UserProfile;
    user: User | null | undefined;
}

export default function ProfilePreview({ profile, user }: ProfilePreviewProps) {
    const [previewUser, setPreviewUser] = useState<User | null>(null);
    const [layoutMaxWidth, setLayoutMaxWidth] = useState(profile.layout_max_width || 776);
    const [scale, setScale] = useState(0.85);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const previewContentRef = useRef<HTMLDivElement>(null);

    // Create a sample user for preview and update when profile changes
    useEffect(() => {
        if (user) {
            const updatedUser: User = {
                ...user,
                profile: profile,
                created_at: user.created_at || new Date().toISOString(),
            };
            setPreviewUser(updatedUser);
        }

        // Update the layout max width when profile changes
        setLayoutMaxWidth(profile.layout_max_width || 776);
    }, [user, profile]);

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.1, 1.5));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.1, 0.5));
    };

    const handleResetZoom = () => {
        setScale(0.85);
    };

    const toggleFullscreen = () => {
        if (!previewContainerRef.current) return;

        if (!document.fullscreenElement) {
            previewContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);

            // Reset scale when exiting fullscreen
            if (!document.fullscreenElement) {
                setScale(0.85);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Adjust preview content to always be visible in viewport
    useEffect(() => {
        if (isFullscreen && previewContentRef.current) {
            const adjustScale = () => {
                const container = previewContainerRef.current;
                const content = previewContentRef.current;

                if (container && content) {
                    const containerWidth = container.clientWidth - 64; // Account for padding
                    const containerHeight = container.clientHeight - 64;
                    const contentWidth = layoutMaxWidth;

                    // Calculate scale based on container width
                    const widthScale = containerWidth / contentWidth;
                    // Use 0.95 as a safety factor to ensure content fits
                    const safeScale = widthScale * 0.95;

                    // Limit scale within reasonable bounds
                    const newScale = Math.min(Math.max(safeScale, 0.5), 1.5);
                    setScale(newScale);
                }
            };

            adjustScale();
            window.addEventListener('resize', adjustScale);

            return () => {
                window.removeEventListener('resize', adjustScale);
            };
        }
    }, [isFullscreen, layoutMaxWidth]);

    const socialIcons: { [key: string]: React.FC<{ size?: number; color?: string; className?: string }> } = {
        snapchat: SocialIcons.SnapchatIcon,
        youtube: SocialIcons.YoutubeIcon,
        discord: SocialIcons.DiscordIcon,
        spotify: SocialIcons.SpotifyIcon,
        instagram: SocialIcons.InstagramIcon,
        x: SocialIcons.XIcon,
        tiktok: SocialIcons.TiktokIcon,
        telegram: SocialIcons.TelegramIcon,
        github: SocialIcons.GithubIcon,
        roblox: SocialIcons.RobloxIcon,
        gitlab: SocialIcons.GitlabIcon,
        twitch: SocialIcons.TwitchIcon,
        namemc: SocialIcons.NamemcIcon,
        steam: SocialIcons.SteamIcon,
        kick: SocialIcons.KickIcon,
        behance: SocialIcons.BehanceIcon,
        litecoin: SocialIcons.LitecoinIcon,
        bitcoin: SocialIcons.BitcoinIcon,
        ethereum: SocialIcons.EthereumIcon,
        monero: SocialIcons.MoneroIcon,
        solana: SocialIcons.SolanaIcon,
        paypal: SocialIcons.PaypalIcon,
        reddit: SocialIcons.RedditIcon,
        facebook: SocialIcons.FacebookIcon,
        'ko-fi': SocialIcons.KofiIcon,
        email: SocialIcons.EmailIcon,
        pinterest: SocialIcons.PinterestIcon,
        custom: SocialIcons.CustomIcon,
    };

    const getColorFromIcon = (icon: string) => {
        switch (icon) {
            case "snapchat":
                return "#fffc00";
            case "youtube":
                return "red";
            case "discord":
                return "#5865f2";
            case "spotify":
                return "#1ed760";
            case "instagram":
                return "#d62976";
            case "x":
                return "#292929";
            case "tiktok":
                return "#f7f7f7";
            case "telegram":
                return "#2aabee";
            case "github":
                return "white";
            case "roblox":
                return "#97a6b4";
            case "gitlab":
                return "#FC6D26";
            case "twitch":
                return "#9146FF";
            case "namemc":
                return "#080808";
            case "steam":
                return "#ebebeb";
            case "kick":
                return "#52fa17";
            case "behance":
                return "#1769ff";
            case "litecoin":
                return "#1769ff";
            case "bitcoin":
                return "#f7931a";
            case "ethereum":
                return "#3c3c3d";
            case "monero":
                return "#F60";
            case "solana":
                return "white";
            case "paypal":
                return "#00457C";
            case "reddit":
                return "#FF4500";
            case "facebook":
                return "#1877F2";
            case "ko-fi":
                return "#FF5E5B";
            case "email":
                return "#FFFFFF";
            case "pinterest":
                return "#E60023";
            case "custom":
                return "#929292";
            default:
                return "black";
        }
    }

    const formatJoinedAt = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);

        if (years > 0) {
            return `joined ${years} year${years > 1 ? "s" : ""} ago`;
        } else if (months > 0) {
            return `joined ${months} month${months > 1 ? "s" : ""} ago`;
        } else if (days > 0) {
            return `joined ${days} day${days > 1 ? "s" : ""} ago`;
        } else if (hours > 0) {
            return `joined ${hours} hour${hours > 1 ? "s" : ""} ago`;
        } else if (minutes > 0) {
            return `joined ${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        } else {
            return `joined ${seconds} second${seconds > 1 ? "s" : ""} ago`;
        }
    }

    const getEffectClass = (effect: string | undefined | null): { className: string; style?: React.CSSProperties } => {
        if (!user?.has_premium && (effect === 'hacker')) {
            return { className: 'text-zinc-500 italic' };
        }

        const textColor = user?.profile?.text_color || '#ffffff';
        const accentColor = user?.profile?.accent_color || '#00ff41';

        switch (effect) {
            case 'gradient':
                return {
                    className: 'bg-clip-text text-transparent',
                    style: {
                        backgroundImage: `linear-gradient(to right, ${user?.profile.gradient_from_color}, ${user?.profile.gradient_to_color})`
                    }
                };
            case 'rainbow':
                return {
                    className: 'bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] bg-clip-text text-transparent animate-rainbow'
                };
            case 'glitch':
                return {
                    className: 'animate-glitch text-white'
                };
            case 'cyber':
                return {
                    className: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]'
                };
            case 'retro':
                return {
                    className: 'animate-retro'
                };
            case '3d':
                return {
                    className: 'animate-3d text-white',
                    style: { display: 'inline-block' }
                };
            case 'hacker':
                return {
                    className: 'animate-hacker',
                    style: {
                        display: 'inline-block',
                        '--text-color': textColor,
                        '--accent-color': accentColor
                    } as React.CSSProperties
                };
            default:
                return {
                    className: 'text-white'
                };
        }
    };

    const sortedWidgets = user?.widgets || [];

    if (!previewUser) {
        return (
            <div className="text-center py-12 bg-black/30 rounded-lg border border-zinc-800/50">
                <div className="animate-pulse w-8 h-8 rounded-full bg-purple-800/30 mx-auto mb-4"></div>
                <p className="text-white/60">Loading preview...</p>
            </div>
        );
    }

    return (
        <div className="relative" ref={previewContainerRef}>
            {/* Controls Row */}
            <div
                className={`flex items-center justify-end gap-2 mb-4 ${isFullscreen
                    ? 'absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm p-2 rounded-lg border border-zinc-800/50'
                    : ''
                    }`}
            >
                <div className="flex items-center bg-black/40 rounded-lg border border-zinc-800/50 p-1">
                    <Tooltip text="Zoom out" position="top">
                        <button
                            onClick={handleZoomOut}
                            className={`p-1.5 transition-colors rounded ${scale <= 0.5
                                ? 'text-zinc-600 cursor-not-allowed'
                                : 'text-white/60 hover:text-purple-300 hover:bg-purple-900/20'
                                }`}
                            disabled={scale <= 0.5}
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <span className="text-xs font-medium text-white/80 px-2">
                        {Math.round(scale * 100)}%
                    </span>

                    <Tooltip text="Zoom in" position="top">
                        <button
                            onClick={handleZoomIn}
                            className={`p-1.5 transition-colors rounded ${scale >= 1.5
                                ? 'text-zinc-600 cursor-not-allowed'
                                : 'text-white/60 hover:text-purple-300 hover:bg-purple-900/20'
                                }`}
                            disabled={scale >= 1.5}
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <Tooltip text="Reset zoom" position="top">
                        <button
                            onClick={handleResetZoom}
                            className="p-1.5 text-white/60 hover:text-purple-300 hover:bg-purple-900/20 transition-colors rounded ml-0.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </Tooltip>
                </div>

                <Tooltip text={isFullscreen ? "Exit fullscreen" : "Fullscreen preview"} position="top">
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-black/40 rounded-lg border border-zinc-800/50 text-white/60 hover:text-purple-300 
                                hover:bg-purple-900/20 hover:border-purple-800/30 transition-colors"
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-4 h-4" />
                        ) : (
                            <Maximize2 className="w-4 h-4" />
                        )}
                    </button>
                </Tooltip>
            </div>

            {/* Preview Container */}
            <div
                className={`bg-black/30 rounded-lg border border-zinc-800/50 ${isFullscreen
                    ? 'fixed inset-0 z-40 p-8'
                    : 'p-4 overflow-hidden'
                    }`}
            >
                <div
                    ref={previewContentRef}
                    className={`transition-transform duration-300 ${isFullscreen
                        ? 'flex items-center justify-center h-full'
                        : ''
                        }`}
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: isFullscreen ? 'center' : 'top center',
                        margin: '0 auto',
                        width: `${layoutMaxWidth}px`,
                        maxWidth: '100%'
                    }}
                >
                    {profile.template === 'modern' ? (
                        <ModernTemplatePreview
                            user={previewUser}
                            layoutMaxWidth={layoutMaxWidth}
                            socialIcons={socialIcons}
                            getColorFromIcon={getColorFromIcon}
                            formatJoinedAt={formatJoinedAt}
                            getEffectClass={getEffectClass}
                            sortedWidgets={sortedWidgets}
                            previewTemplate={null}
                        />
                    ) : profile.template === 'minimalistic' ? (
                        <MinimalisticPreview
                            user={previewUser}
                            layoutMaxWidth={layoutMaxWidth}
                            socialIcons={socialIcons}
                            getColorFromIcon={getColorFromIcon}
                            formatJoinedAt={formatJoinedAt}
                            getEffectClass={getEffectClass}
                            sortedWidgets={sortedWidgets}
                            previewTemplate={null}
                        />
                    ) : (
                        <DefaultTemplatePreview
                            user={previewUser}
                            layoutMaxWidth={layoutMaxWidth}
                            socialIcons={socialIcons}
                            getColorFromIcon={getColorFromIcon}
                            formatJoinedAt={formatJoinedAt}
                            getEffectClass={getEffectClass}
                            sortedWidgets={sortedWidgets}
                            previewTemplate={null}
                        />
                    )}
                </div>
            </div>

            {/* Info text about preview */}
            {!isFullscreen && (
                <p className="mt-3 text-xs text-zinc-500 text-center">
                    This is a preview of how your profile will look. Changes are automatically applied.
                </p>
            )}
        </div>
    );
}