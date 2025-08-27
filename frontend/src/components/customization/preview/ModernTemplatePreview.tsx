import Image from 'next/image';
import BadgeCard from 'haze.bio/components/ui/BadgeCard';
import * as SocialIcons from '../../../socials/Socials';
import { Template, User } from 'haze.bio/types';
import Client3DWrapper from '../../ui/Client3DWrapper';
import Tooltip from '../../ui/Tooltip';
import CustomSocialLink from '../../ui/social/CustomSocialLink';
import SocialLink from '../../ui/social/SocialLink';
import AnimatedViewCounter from '../../ui/AnimatedViewCounter';

interface ModernTemplateProps {
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

const ModernTemplatePreview: React.FC<ModernTemplateProps> = ({ user, layoutMaxWidth, socialIcons, getColorFromIcon, formatJoinedAt, getEffectClass, sortedWidgets, previewTemplate }) => {
    const effect = getEffectClass(user.profile.username_effects);
    const threshold = 690;
    let background = `rgba(${parseInt((user.profile?.accent_color || '#000000').slice(1, 3), 16)}, ${parseInt((user.profile?.accent_color || '#000000').slice(3, 5), 16)}, ${parseInt((user.profile?.accent_color || '#000000').slice(5, 7), 16)}, ${user.profile?.card_opacity})`;

    if (user.profile?.background_url) {
        background = `rgba(${parseInt((user.profile?.background_color || '#000000').slice(1, 3), 16)}, ${parseInt((user.profile?.background_color || '#000000').slice(3, 5), 16)}, ${parseInt((user.profile?.background_color || '#000000').slice(5, 7), 16)}, ${user.profile?.card_opacity})`;
    }

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
                        backdropFilter: `blur(${user.profile?.card_blur}px)`,
                        borderRadius: `${user?.profile?.card_border_radius}px`,
                        background: background,
                    }}
                >
                    {user.profile?.banner_url ? (
                        <div
                            className="relative w-full h-36"
                            style={{
                                borderTopLeftRadius: `${user?.profile?.card_border_radius}px`,
                                borderTopRightRadius: `${user?.profile?.card_border_radius}px`
                            }}
                        >
                            <Image
                                src={user.profile.banner_url || ''}
                                alt="Banner"
                                fill
                                style={{
                                    objectFit: 'cover',
                                    borderTopLeftRadius: `${user?.profile?.card_border_radius}px`,
                                    borderTopRightRadius: `${user?.profile?.card_border_radius}px`
                                }}
                                priority
                                draggable="false"
                            />
                        </div>
                    ) : null}

                    {/* Centered Content */}
                    <div className={`relative flex flex-col items-center ${user.profile?.banner_url ? '-mt-10' : 'pt-6'}`}>
                        {user.profile?.avatar_url ? (
                            <div className="relative w-28 h-28 flex-shrink-0 group">
                                <div
                                    className="absolute inset-0 rounded-full transition-all duration-300 group-hover:scale-105"
                                    style={{
                                        transform: 'scale(1.02)',
                                    }}
                                />
                                <Image
                                    src={user.profile?.avatar_url || ''}
                                    alt=""
                                    width={112}
                                    height={112}
                                    className={`transition-transform duration-300 group-hover:scale-105 ${user.profile?.avatar_shape || 'rounded-2xl'}`}
                                    priority
                                    style={{
                                        maxWidth: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                    draggable="false"
                                />

                                {user.profile?.use_discord_decoration && user.profile?.decoration_url && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <Image
                                            src={user.profile.decoration_url}
                                            alt="Discord Decoration"
                                            width={220}
                                            height={220}
                                            className="transition-transform duration-300 group-hover:scale-105"
                                            priority
                                            style={{
                                                position: "absolute",
                                                objectFit: "contain",
                                                zIndex: 10,
                                                transform: "scale(1.19)"
                                            }}
                                            draggable="false"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : null}
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
                                            className={`text-2xl font-bold inline-block ${effect.className} relative group`}
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

                        {user.profile?.description && (
                            <p
                                className="mt-2 text-base text-center"
                                style={{ color: `${user.profile?.text_color}CC` }}
                                dangerouslySetInnerHTML={{ __html: user.profile?.description }}
                            />
                        )}

                        {user.profile?.hide_joined_date ? null : (
                            <p
                                className="mt-2 text-sm"
                                style={{ color: `${user.profile?.text_color}99` }}
                            >
                                {formatJoinedAt(new Date(user.created_at))}
                            </p>
                        )}

                        {user.badges && user.badges.length > 0 && user.badges.some((badge: { hidden: any; }) => !badge.hidden) && (
                            <div
                                className="flex justify-center items-center mt-2 px-[8px] py-[4px] rounded-[17px] bg-white/10 overflow-visible"
                                style={{
                                    textShadow: user.profile?.glow_badges ? `0px 0px 16.5px ${user.profile?.text_color}` : 'none',
                                    borderColor: `rgba(${parseInt((user.profile?.accent_color || '#000000').slice(1, 3), 16)}, ${parseInt((user.profile?.accent_color || '#000000').slice(3, 5), 16)}, ${parseInt((user.profile?.accent_color || '#000000').slice(5, 7), 16)}, 0.1)`, // Adjusted opacity to 0.1
                                    borderWidth: '2px',
                                    borderStyle: 'solid',
                                }}
                            >
                                <BadgeCard user={user} />
                            </div>
                        )}
                    </div>

                    <div className="p-6 pb-10">
                        <div>
                            {user.socials && user.socials.length > 0 && (
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
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

                    <div
                        className="absolute bottom-[0.15rem] flex items-center"
                        style={{
                            left: `${Math.max(0.35, user?.profile?.card_border_radius / 50)}rem`
                        }}
                    >
                        {/* Views count */}
                        {!user.profile?.hide_views_count && (
                            <AnimatedViewCounter
                                views={user.profile.views}
                                textColor={user.profile?.text_color || '#FFFFFF'}
                                glow={user.profile?.glow_socials || false}
                                animate={user.profile?.views_animation || false}
                            />
                        )}

                        {!user.profile?.hide_views_count && user.profile.location && (
                            <div
                                className="h-4 w-[1.5px] ml-2 mr-1.5"
                                style={{
                                    backgroundColor: `${user.profile?.text_color}44`
                                }}
                            ></div>
                        )}

                        {/* Location */}
                        {user.profile.location && (
                            <div className="flex items-center gap-1">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        color: `${user.profile?.text_color}`,
                                        filter: user.profile?.glow_socials ? `drop-shadow(0px 0px 6px ${user.profile?.text_color})` : "none"
                                    }}
                                >
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span
                                    className="text-sm font-medium select-none"
                                    style={{
                                        color: `${user.profile?.text_color}`,
                                        textShadow: user.profile?.glow_socials ? `0px 0px 6px ${user.profile?.text_color}` : 'none'
                                    }}
                                >
                                    {user.profile.location}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Client3DWrapper>
        </>
    );
};

export default ModernTemplatePreview;