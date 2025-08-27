import Image from 'next/image';
import BadgeCard from 'haze.bio/components/ui/BadgeCard';
import { Eye } from 'lucide-react';
import WidgetContainer from 'haze.bio/components/widgets/WidgetContainer';
import * as SocialIcons from '../../socials/Socials';
import { Template, User } from 'haze.bio/types';
import Client3DWrapper from '../ui/Client3DWrapper';
import Tooltip from '../ui/Tooltip';
import CustomSocialLink from '../ui/social/CustomSocialLink';
import SocialLink from '../ui/social/SocialLink';
import AnimatedViewCounter from '../ui/AnimatedViewCounter';

interface MinimalisticTemplateProps {
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

const MinimalisticTemplate: React.FC<MinimalisticTemplateProps> = ({
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
    const threshold = 690;

    let background = `rgba(${parseInt((user.profile?.accent_color || '#000000').slice(1, 3), 16)}, ${parseInt((user.profile?.accent_color || '#000000').slice(3, 5), 16)}, ${parseInt((user.profile?.accent_color || '#000000').slice(5, 7), 16)}, ${user.profile?.card_opacity * 0.9})`;

    if (user.profile?.background_url) {
        background = `rgba(${parseInt((user.profile?.background_color || '#000000').slice(1, 3), 16)}, ${parseInt((user.profile?.background_color || '#000000').slice(3, 5), 16)}, ${parseInt((user.profile?.background_color || '#000000').slice(5, 7), 16)}, ${user.profile?.card_opacity * 0.9})`;
    }

    const renderWidgets = () => {
        if (!user.widgets || user.widgets.length === 0) {
            return null;
        }

        return (
            <div className={`mt-${user.profile?.show_widgets_outside ? '4' : '2'}`}>
                <div
                    className={`grid ${layoutMaxWidth < threshold ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-2`}
                >
                    {sortedWidgets.map((widget, index) => (
                        <div
                            key={widget.widget_data}
                            className={`flex-1 ${sortedWidgets.length % 2 !== 0 && index === sortedWidgets.length - 1 && layoutMaxWidth >= threshold
                                ? 'sm:col-span-2'
                                : ''
                                }`}
                        >
                            <WidgetContainer
                                widget={widget}
                                user={user}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const accentColor = user.profile?.accent_color || '#ff3030';
    const textColor = user.profile?.text_color || '#FFFFFF';

    return (
        <>
            {previewTemplate && (
                <div className="absolute top-0 left-0 w-full bg-zinc-800/70 text-white p-2 flex justify-between items-center z-10 font-poppins">
                    <span>You are previewing the template by {previewTemplate.creator_username || 'Unknown'}.</span>
                </div>
            )}

            <Client3DWrapper enable3DHover={user?.profile?.parallax_effect} layoutMaxWidth={layoutMaxWidth}>
                <div className="w-full" style={{ maxWidth: `${layoutMaxWidth}px` }}>
                    {/* Profile Card */}
                    <div
                        className="w-full relative animate-fade-in mb-4"
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
                                {/* Avatar (Top Center) */}
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
                                <div className="flex items-center">
                                    <Tooltip text={`UID ${user.uid}`} position="right">
                                        {(() => {
                                            const textColor = user.profile?.text_color || '#ffffff';
                                            const accentColor = user.profile?.accent_color || '#00ff41';

                                            let textShadow = 'none';
                                            if (user.profile?.glow_username) {
                                                textShadow = `0px 0px 16.5px ${textColor}`;
                                            } else if (user.profile.username_effects === 'cyber') {
                                                textShadow = `0 0 4px #0fa, 0 0 11px #0fa, 0 0 19px #0fa`;
                                            }

                                            const needsSpecialColorHandling = ['gradient', 'rainbow', 'liquid-metal'].includes(user.profile.username_effects || '');

                                            const commonStyle = {
                                                ...effect.style,
                                                color: needsSpecialColorHandling ? undefined : textColor,
                                                textShadow: textShadow
                                            };

                                            if (user.profile.username_effects === 'hacker') {
                                                (commonStyle as any)['--text-color'] = textColor;
                                                (commonStyle as any)['--accent-color'] = accentColor;
                                            }

                                            if (user.profile.username_effects === '3d' || user.profile.username_effects === 'hacker') {
                                                const characters = Array.from(user.display_name || user.username);

                                                return (
                                                    <h1
                                                        className={`text-xl font-bold inline-block ${effect.className} relative group`}
                                                        style={commonStyle as React.CSSProperties}
                                                    >
                                                        {characters.map((char, i) => (
                                                            <span
                                                                key={i}
                                                                style={{
                                                                    '--char-index': i,
                                                                    ...(char === ' ' ? { marginRight: '-0.25em' } : {})
                                                                } as React.CSSProperties}
                                                            >
                                                                {char === ' ' ? '\u00A0' : char}
                                                            </span>
                                                        ))}
                                                    </h1>
                                                );
                                            } else {
                                                return (
                                                    <h1
                                                        className={`text-2xl font-bold inline-block ${effect.className} relative group`}
                                                        style={commonStyle}
                                                    >
                                                        {user.display_name || user.username}
                                                    </h1>
                                                );
                                            }
                                        })()}
                                    </Tooltip>

                                    {/* Badges next to name */}
                                    {user.badges && user.badges.length > 0 && user.badges.some((badge: any) => !badge.hidden) && (
                                        <div className="ml-1.5 flex items-center px-[3px] py-[1px] rounded-[6px] bg-white/10 overflow-visible scale-90 origin-left">
                                            <BadgeCard user={user} size="small" />
                                        </div>
                                    )}
                                </div>

                                {/* Description (if available) */}
                                {user.profile?.description && (
                                    <p
                                        className={`text-sm ${user.profile?.hide_joined_date ? 'mb-5' : ''}`}
                                        style={{ color: `${textColor}CC` }}
                                        dangerouslySetInnerHTML={{ __html: user.profile?.description }}
                                    />
                                )}

                                {user.profile?.hide_joined_date ? null : (
                                    <p
                                        className="text-sm mb-5"
                                        style={{ color: `${user.profile?.text_color}99` }}
                                    >
                                        {formatJoinedAt(new Date(user.created_at))}
                                    </p>
                                )}

                                {/* User Info Section - Views, Location, Occupation */}
                                <div className={`flex flex-col ${!user.profile?.description ? 'mt-0' : 'mt-[-10px]'}`}>
                                    {/* Views */}
                                    {!user.profile?.hide_views_count && (
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
                                                    uid={user.uid}
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
                                                uid={user.uid}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* Non-external Widgets */}
                            {!user.profile?.show_widgets_outside && renderWidgets()}
                        </div>
                    </div>

                    {/* External Widgets (if enabled) */}
                    {user.profile?.show_widgets_outside && user.widgets && user.widgets.length > 0 && (
                        <div className="mt-4">
                            {renderWidgets()}
                        </div>
                    )}
                </div>
            </Client3DWrapper >
        </>
    );
};

export default MinimalisticTemplate;