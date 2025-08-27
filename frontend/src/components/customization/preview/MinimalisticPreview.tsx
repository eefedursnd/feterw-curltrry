import Image from 'next/image';
import BadgeCard from 'haze.bio/components/ui/BadgeCard';
import * as SocialIcons from '../../../socials/Socials';
import { Template, User } from 'haze.bio/types';
import Client3DWrapper from '../../ui/Client3DWrapper';
import Tooltip from '../../ui/Tooltip';
import CustomSocialLink from '../../ui/social/CustomSocialLink';
import SocialLink from '../../ui/social/SocialLink';
import AnimatedViewCounter from '../../ui/AnimatedViewCounter';

interface MinimalisticPreviewProps {
    user: User;
    layoutMaxWidth: number;
    socialIcons: { [key: string]: React.FC<{ size?: number; color?: string; className?: string }> };
    getColorFromIcon: (icon: string) => string;
    formatJoinedAt: (date: Date) => string;
    getEffectClass: (effect: string | undefined | null) => { className: string; style?: React.CSSProperties };
    sortedWidgets: any[];
    previewTemplate: Template | null | undefined;
}

interface Social {
    id: number;
    platform: string;
    link: string;
    image_url?: string;
    social_type?: string;
}

const MinimalisticPreview: React.FC<MinimalisticPreviewProps> = ({
    user,
    layoutMaxWidth,
    socialIcons,
    getColorFromIcon,
    formatJoinedAt,
    getEffectClass,
    sortedWidgets,
    previewTemplate
}) => {
    const effect = getEffectClass(user.profile.username_effects);
    
    // Background mit leicht stärkerem Blur-Effekt für die Preview
    let background = `rgba(${parseInt((user.profile?.accent_color || '#000000').slice(1, 3), 16)}, ${parseInt((user.profile?.accent_color || '#000000').slice(3, 5), 16)}, ${parseInt((user.profile?.accent_color || '#000000').slice(5, 7), 16)}, ${user.profile?.card_opacity * 0.9})`;

    if (user.profile?.background_url) {
        background = `rgba(${parseInt((user.profile?.background_color || '#000000').slice(1, 3), 16)}, ${parseInt((user.profile?.background_color || '#000000').slice(3, 5), 16)}, ${parseInt((user.profile?.background_color || '#000000').slice(5, 7), 16)}, ${user.profile?.card_opacity * 0.9})`;
    }

    // Accentfarbe für Highlights
    const accentColor = user.profile?.accent_color || '#ff3030';
    const textColor = user.profile?.text_color || '#FFFFFF';

    return (
        <>
            {previewTemplate && (
                <div className="absolute top-0 left-0 w-full bg-zinc-800/70 text-white p-2 flex justify-between items-center z-[60] font-poppins">
                    <span>You are previewing the template by {previewTemplate.creator_username || 'Unknown'}.</span>
                </div>
            )}

            <Client3DWrapper enable3DHover={user?.profile?.parallax_effect} layoutMaxWidth={layoutMaxWidth} isPreview={true}>
                <div
                    className={`relative w-full animate-fade-in z-10`}
                    style={{
                        backdropFilter: `blur(${Math.min(25, (user.profile?.card_blur || 0) * 1.5)}px)`,
                        borderRadius: `${user?.profile?.card_border_radius || 16}px`,
                        background: background,
                        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2)`,
                        border: `1px solid rgba(255, 255, 255, 0.08)`
                    }}
                >
                    <div className="p-5 relative">
                        {/* Vertically stacked layout */}
                        <div className="flex flex-col">
                            {/* Avatar (Top) */}
                            {user.profile?.avatar_url && (
                                <div className="relative w-24 h-24 mb-4">
                                    <Image
                                        src={user.profile.avatar_url}
                                        alt=""
                                        width={96}
                                        height={96}
                                        className={`transition-transform duration-300 hover:scale-105 ${user.profile?.avatar_shape || 'rounded-lg'}`}
                                        priority
                                        style={{
                                            maxWidth: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                        draggable="false"
                                    />
                                </div>
                            )}

                            {/* Username and Badges on Same Line */}
                            <div className="flex items-center mb-2">
                                <Tooltip text={`UID ${user.uid}`} position="top">
                                    <h1
                                        className={`text-xl font-bold ${effect.className}`}
                                        style={{
                                            ...effect.style,
                                            color: textColor,
                                            textShadow: user.profile?.glow_username ? `0px 0px 16px ${textColor}` : 'none'
                                        }}
                                    >
                                        {user.display_name || user.username}
                                    </h1>
                                </Tooltip>

                                {/* Badges next to name */}
                                {user.badges && user.badges.length > 0 && user.badges.some((badge: any) => !badge.hidden) && (
                                    <div className="ml-2 flex items-center px-[4px] py-[2px] rounded-[8px] bg-white/10 overflow-visible">
                                        <BadgeCard user={user} />
                                    </div>
                                )}
                            </div>

                            {/* Description (if available) */}
                            {user.profile?.description && (
                                <p
                                    className="mb-3 text-sm"
                                    style={{ color: `${textColor}CC` }}
                                    dangerouslySetInnerHTML={{ __html: user.profile?.description }}
                                />
                            )}

                            {/* User Info Section - Views, Location, Occupation */}
                            <div className={`flex flex-col ${!user.profile?.description ? 'mt-0' : 'mt-0'}`}>
                                {/* Views */}
                                {!user.profile?.hide_views_count && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={accentColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{
                                                filter: user.profile?.glow_socials ? `drop-shadow(0px 0px 6px ${accentColor})` : "none"
                                            }}
                                        >
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        <span
                                            className="text-sm font-medium"
                                            style={{
                                                color: `${textColor}DC`,
                                            }}
                                        >
                                            {user.profile.views} views
                                        </span>
                                    </div>
                                )}

                                {/* Location */}
                                {user.profile.location && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={accentColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{
                                                filter: user.profile?.glow_socials ? `drop-shadow(0px 0px 6px ${accentColor})` : "none"
                                            }}
                                        >
                                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span
                                            className="text-sm font-medium"
                                            style={{
                                                color: `${textColor}DC`,
                                            }}
                                        >
                                            {user.profile.location}
                                        </span>
                                    </div>
                                )}

                                {/* Occupation */}
                                {user.profile.occupation && (
                                    <div className="flex items-center gap-1">
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={accentColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{
                                                filter: user.profile?.glow_socials ? `drop-shadow(0px 0px 6px ${accentColor})` : "none"
                                            }}
                                        >
                                            <path d="M20 7h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                                        </svg>
                                        <span
                                            className="text-sm font-medium"
                                            style={{
                                                color: `${textColor}DC`,
                                            }}
                                        >
                                            {user.profile.occupation}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Socials */}
                        {user.socials && user.socials.length > 0 && (
                            <div className="mt-5 flex justify-center flex-wrap gap-2">
                                {user.socials.map((social: Social) => {
                                    if (social.platform.toLowerCase() === "custom") {
                                        return (
                                            <CustomSocialLink
                                                key={`custom-${social.link}`}
                                                link={social.link}
                                                imageUrl={social.image_url}
                                                glowSocials={user.profile?.glow_socials}
                                                iconColor={user.profile?.monochrome_icons ? user.profile?.icon_color || undefined : undefined}
                                                socialType={social.social_type}
                                            />
                                        );
                                    }

                                    const Icon = socialIcons[social.platform.toLowerCase()] || SocialIcons.DefaultIcon;
                                    const IconColor = getColorFromIcon(social.platform.toLowerCase());

                                    return (
                                        <SocialLink
                                            key={social.id}
                                            id={social.id}
                                            link={social.link}
                                            platform={social.platform}
                                            icon={<Icon color={user.profile?.monochrome_icons ? user.profile?.icon_color || undefined : IconColor} className="no-transform" />}
                                            socialType={social.social_type}
                                            iconColor={user.profile?.monochrome_icons ? user.profile?.icon_color || undefined : IconColor}
                                            glowSocials={user.profile?.glow_socials}
                                            isMonochrome={user.profile?.monochrome_icons}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </Client3DWrapper>
        </>
    );
};

export default MinimalisticPreview;