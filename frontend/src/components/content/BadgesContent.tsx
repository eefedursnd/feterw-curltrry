'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StaffBadge, EarlyUserBadge, BoosterBadge, BugHunterBadge, EventWinnerBadge, PremiumBadge, FeaturedBadge, PartnerBadge, Easter2025Badge, InnovatorBadge } from 'haze.bio/badges/Badges';
import { Award, BadgeCheck, Palette, Loader2, Wand2, Settings, X, Info, CreditCard, ArrowRight, Star, Calendar, Users, LucideIcon, Trophy, Eye, Gem } from 'lucide-react';
import BadgeSort from 'haze.bio/components/sorting/BadgeSort';
import { UserBadge } from 'haze.bio/types';
import { badgeAPI, profileAPI } from 'haze.bio/api';
import ColorPickerPortal from 'haze.bio/components/ui/ColorPickerPortal';
import toast from 'react-hot-toast';
import DashboardLayout from '../dashboard/Layout';
import { useUser } from 'haze.bio/context/UserContext';
import Link from 'next/link';
import EditBadgeModal from '../modals/EditBadgeModal';

interface BadgesContentProps {
}

interface BadgeCategory {
    title: string;
    description: string;
    icon: LucideIcon;
    badges: BadgeInfo[];
}

interface BadgeInfo {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    ctaText?: string;
    ctaLink?: string;
    order?: number;
    category: string;
}

const BADGE_CATEGORIES: BadgeCategory[] = [
    {
        title: "Community Badges",
        description: "Badges earned through community participation",
        icon: Users,
        badges: [
            {
                id: 'featured',
                title: "Featured",
                description: "Featured on the cutz.lol homepage",
                icon: <FeaturedBadge size={32} />,
                ctaText: "Share your page",
                ctaLink: "https://discord.com/channels/1401929292052566055/1408080948045807729",
                order: 7,
                category: 'community'
            },
            {
                id: 'partner',
                title: "Partner",
                description: "Official partner of cutz.lol",
                icon: <PartnerBadge size={32} />,
                order: 3,
                category: 'community'
            },
            {
                id: 'booster',
                title: "Booster",
                description: "Boosted the cutz.lol Discord server",
                icon: <BoosterBadge size={32} />,
                ctaText: "Boost Server",
                ctaLink: "https://discord.gg/cutz",
                order: 8,
                category: 'community'
            }
        ]
    },
    {
        title: "Achievement Badges",
        description: "Badges earned through platform achievements",
        icon: Trophy,
        badges: [
            {
                id: 'early_user',
                title: "Early User",
                description: "One of the first 25 users of cutz.lol",
                icon: <EarlyUserBadge size={32} />,
                order: 2,
                category: 'achievement'
            },
            {
                id: 'bug_hunter',
                title: "Bug Hunter",
                description: "Reported more than 5 bugs to the cutz.lol team",
                icon: <BugHunterBadge size={32} />,
                ctaText: "Report a Bug",
                ctaLink: "https://discord.gg/cutz",
                order: 4,
                category: 'achievement'
            },
            {
                id: 'innovator',
                title: "Innovator",
                description: "Suggest at least 5 features or improvements for cutz.lol",
                icon: <InnovatorBadge size={32} />,
                ctaText: "Make a Suggestion",
                ctaLink: "https://discord.gg/cutz",
                order: 6,
                category: 'achievement'
            },
            {
                id: 'event_winner',
                title: "Event Winner",
                description: "Won a cutz.lol event or competition",
                icon: <EventWinnerBadge size={32} />,
                order: 8,
                category: 'achievement'
            },
            {
                id: 'easter_2025',
                title: "Easter 2025",
                description: "Participated in the Easter 2025 event",
                icon: <Easter2025Badge size={32} />,
                order: 10,
                category: 'achievement'
            }
        ]
    },
    {
        title: "Status Badges",
        description: "Badges that represent your platform status",
        icon: Star,
        badges: [
            {
                id: 'staff',
                title: "Staff",
                description: "Official staff member of cutz.lol",
                icon: <StaffBadge size={32} />,
                ctaText: "Apply",
                ctaLink: "https://cutz.lol/dashboard/applications",
                order: 1,
                category: 'status'
            },
            {
                id: 'premium',
                title: "Premium",
                description: "Purchased premium on cutz.lol",
                icon: <PremiumBadge size={32} />,
                ctaText: "Get Premium",
                ctaLink: "/pricing",
                order: 5,
                category: 'status'
            }
        ]
    }
];

const ALL_BADGES = BADGE_CATEGORIES.flatMap(category => category.badges);

export default function BadgesContent({ }: BadgesContentProps) {
    const { user: contextUser, updateUser } = useUser();

    const [localBadges, setLocalBadges] = useState<UserBadge[]>(contextUser?.badges || []);
    const [monochromeBadges, setMonochromeBadges] = useState(contextUser?.profile?.monochrome_badges || false);
    const [badgeColor, setBadgeColor] = useState(contextUser?.profile?.badge_color || '#ffffff');
    const [isLoading, setIsLoading] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorPickerRect, setColorPickerRect] = useState<DOMRect | null>(null);
    const colorButtonRef = useRef<HTMLDivElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newBadgeName, setNewBadgeName] = useState('');
    const [newMediaURL, setNewMediaURL] = useState('');
    const [creditsLeft, setCreditsLeft] = useState(contextUser?.badge_edit_credits || 0);
    const [activeTab, setActiveTab] = useState<'manage' | 'available'>('manage');

    const handleReorder = async (newBadges: UserBadge[]) => {
        setLocalBadges(newBadges);

        if (contextUser && updateUser) {
            updateUser({
                badges: newBadges
            });
        }
    };

    const handleCloseColorPicker = () => {
        setShowColorPicker(false);
    };

    const handleColorClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        const buttonRect = colorButtonRef.current?.getBoundingClientRect() || null;
        setColorPickerRect(buttonRect);
        setShowColorPicker(!showColorPicker);
    };

    const handleProfileSettingsSave = async () => {
        try {
            setIsLoading(true);
            await profileAPI.updateProfile({
                monochrome_badges: monochromeBadges,
                badge_color: badgeColor
            });
            setMonochromeBadges(monochromeBadges);
            setBadgeColor(badgeColor);
            toast.success('Badges settings saved successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to save badges settings');
            console.error('Failed to update badges settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBadgeChangesSave = async () => {
        try {
            setIsLoading(true);
            if (selectedBadge && (newBadgeName !== selectedBadge.badge.name || newMediaURL !== selectedBadge.badge.media_url)) {
                if (creditsLeft > 0) {
                    await badgeAPI.editCustomBadge(selectedBadge.badge.id, newBadgeName, newMediaURL);
                    const updatedBadges = localBadges.map(badge =>
                        badge.badge_id === selectedBadge.badge_id
                            ? {
                                ...badge,
                                badge_name: newBadgeName,
                                badge: {
                                    ...badge.badge,
                                    media_url: newMediaURL
                                }
                            }
                            : badge
                    );
                    setLocalBadges(updatedBadges);
                    setCreditsLeft(creditsLeft - 1);
                    toast.success('Badge settings saved successfully');
                } else {
                    toast.error('Not enough credits to save badge settings');
                    return;
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to save badge settings');
        } finally {
            setIsLoading(false);
            setShowEditModal(false);
        }
    };

    const handleSaveChanges = async () => {
        await handleProfileSettingsSave();
    };

    const handleOpenEditModal = (badge: UserBadge) => {
        setSelectedBadge(badge);
        setNewBadgeName(badge.badge.name);
        setNewMediaURL(badge.badge.media_url);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedBadge(null);
    };

    const handleFileUpload = (fileName: string) => {
        setNewMediaURL(fileName);
    };

    const userBadgeIds = localBadges.map(badge => badge.badge.name.toLowerCase().replace(' ', '_'));

    const getBadgeIcon = (name: string, size: number = 48, className: string = "",
        style: React.CSSProperties = {}, monochrome: boolean = false, monochromeColor: string = "#ffffff") => {

        const normalizedName = name.toLowerCase().replace(' ', '_');

        switch (normalizedName) {
            case 'staff':
                return <StaffBadge size={size} style={style}
                    color={monochromeColor} />;

            case 'early_user':
            case 'early user':
                return <EarlyUserBadge size={size} style={style}
                    color={monochromeColor} />;

            case 'partner':
                return <PartnerBadge size={size} style={style}
                    color={monochromeColor} />;

            case 'bug_hunter':
            case 'bug hunter':
                return <BugHunterBadge size={size} style={style}
                    color={monochromeColor} />;

            case 'premium':
                return <PremiumBadge size={size} style={style}
                    color={monochromeColor} />;

            case 'event_winner':
            case 'event winner':
                return <EventWinnerBadge size={size} style={style}
                    color={monochromeColor} />;

            case 'featured':
                return <FeaturedBadge size={size} style={style}
                    color={monochromeColor} />;

            case 'booster':
                return <BoosterBadge size={size} style={style}
                    color={monochromeColor} />;

            case 'easter_2025':
            case 'easter 2025':
                return <Easter2025Badge size={size} style={style}
                    color={monochromeColor} />;

            default:
                return (
                    <div className={`w-${size / 4} h-${size / 4} rounded-full bg-purple-800/20 flex items-center justify-center ${className}`} style={style}>
                        <BadgeCheck className={`w-${size / 8} h-${size / 8} text-purple-400`} />
                    </div>
                );
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-8 relative">
                {/* Hero Section with Header */}
                <div className="bg-[#0E0E0E] rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>

                    <div className="relative z-10 max-w-3xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">My Badges</h1>
                                    <div className="px-3 py-1 bg-purple-900/20 rounded-full border border-purple-800/30 flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-sm font-medium text-white/80">{creditsLeft} Credits</span>
                                    </div>
                                </div>
                                <p className="text-white/70 text-sm md:text-base mt-1">
                                    Manage and display your earned badges on your profile.
                                </p>
                            </div>
                            <button
                                onClick={handleSaveChanges}
                                disabled={isLoading}
                                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500
                                      transition-colors font-medium disabled:opacity-50
                                      disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-2 border-t border-zinc-800/50 pt-4">
                            <button
                                onClick={() => setActiveTab('manage')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                      ${activeTab === 'manage'
                                        ? 'bg-purple-600 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <Settings className="w-4 h-4" /> Manage Badges
                            </button>
                            <button
                                onClick={() => setActiveTab('available')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                      ${activeTab === 'available'
                                        ? 'bg-purple-600 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <Award className="w-4 h-4" /> Available Badges
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'manage' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Badge Management with BadgeSort */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <BadgeCheck className="w-4 h-4 text-purple-400" />
                                        Badge Order & Visibility
                                    </h2>
                                    <span className="text-xs text-white/60">
                                        {localBadges.length} {localBadges.length === 1 ? 'Badge' : 'Badges'}
                                    </span>
                                </div>
                                <div className="p-5">
                                    <BadgeSort
                                        userBadges={localBadges.map(badge => ({
                                            ...badge,
                                            isCustom: badge.badge.is_custom
                                        }))}
                                        onReorder={handleReorder}
                                        onEdit={handleOpenEditModal}
                                    />
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Info className="w-4 h-4 text-purple-400" />
                                        Badge Tips
                                    </h2>
                                </div>
                                <div className="p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <div className="flex items-start gap-3 mb-1">
                                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Award className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-white">Customize Your Profile</h3>
                                                    <p className="text-xs text-white/60 mt-1">
                                                        Displaying badges helps visitors understand your achievements and status within the community.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <div className="flex items-start gap-3 mb-1">
                                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Eye className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-white">Badge Visibility</h3>
                                                    <p className="text-xs text-white/60 mt-1">
                                                        Drag and drop badges to change their display order. Hide badges by toggling their visibility.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Right Column - Side Content */}
                        <div className="space-y-6">
                            {/* Badge Settings */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-purple-400" />
                                        Badge Display
                                    </h2>
                                </div>
                                <div className="p-5 space-y-5">
                                    {/* Monochrome Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg
                                                border border-zinc-800/50 hover:border-purple-800/30 hover:bg-zinc-800/40 transition-all duration-300"
                                    >
                                        <div>
                                            <span className="block text-sm font-medium text-white">
                                                Monochrome Badges
                                            </span>
                                            <span className="text-xs text-white/60">
                                                Display badges in a single color
                                            </span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={monochromeBadges}
                                                onChange={(e) => setMonochromeBadges(e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer
                                                        peer-checked:after:translate-x-full peer-checked:after:border-white
                                                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                                        after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                                        peer-checked:bg-purple-600"
                                            />
                                        </label>
                                    </div>

                                    {/* Color Picker */}
                                    <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-800/30 hover:bg-zinc-800/40 transition-all duration-300">
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Badge Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div
                                                ref={colorButtonRef}
                                                onClick={handleColorClick}
                                                className="w-12 h-12 rounded-lg border border-zinc-700/50 cursor-pointer
                                                        transition-transform hover:scale-105 hover:border-purple-500/30 shadow-md"
                                                style={{ backgroundColor: badgeColor }}
                                            />
                                            <div className="flex items-center gap-1 bg-[#0E0E0E]/40 px-3 py-2 rounded-lg border border-zinc-800/50">
                                                <span className="text-xs text-white/60">#</span>
                                                <span className="text-sm text-white">
                                                    {badgeColor.replace('#', '')}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/60 mt-2">
                                            This color will be used when the monochrome setting is enabled
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 relative overflow-hidden p-5">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Gem className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-white">Badge Edit Credits</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-white/60">Available:</span>
                                                <span className="text-sm font-medium text-white">{creditsLeft}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/60 mb-4">
                                        Credits are used to edit custom badges. Each edit consumes one credit.
                                    </p>
                                    <Link
                                        href="/pricing"
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg
                                              transition-all text-sm font-medium flex items-center justify-center gap-2 w-full"
                                    >
                                        <Gem className="w-4 h-4" />
                                        Get More Credits
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                )}

                {activeTab === 'available' && (
                    <div className="space-y-6">
                        {/* Badge Categories */}
                        {BADGE_CATEGORIES.map(category => (
                            <div key={category.title} className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                        <category.icon className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-semibold text-sm">{category.title}</h2>
                                        <p className="text-xs text-white/60">{category.description}</p>
                                    </div>
                                </div>

                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {category.badges.map(badge => {
                                        const hasBadge = userBadgeIds.includes(badge.id);

                                        return (
                                            <div
                                                key={badge.id}
                                                className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-[#0E0E0E]/30 rounded-lg">
                                                        {React.cloneElement(badge.icon as React.ReactElement<any, any>, { size: 24 })}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-sm font-medium text-white truncate">{badge.title}</h3>
                                                        <p className="text-xs text-white/60 line-clamp-1">
                                                            {badge.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    {hasBadge ? (
                                                        <div className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-purple-900/30 text-purple-400 text-xs font-medium rounded-lg">
                                                            <BadgeCheck className="w-3.5 h-3.5" /> Earned
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-white/40">Not earned</div>
                                                    )}
                                                    
                                                    {!hasBadge && badge.ctaText && badge.ctaLink && (
                                                        <a
                                                            href={badge.ctaLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center py-1 px-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-white text-xs font-medium rounded-lg transition-colors"
                                                        >
                                                            {badge.ctaText}
                                                            <ArrowRight className="w-3 h-3 ml-1" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Help Section */}
                        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden p-6 relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.15),transparent_70%)]"></div>
                            
                            <div className="relative flex flex-col md:flex-row gap-6 items-center">
                                <div className="w-16 h-16 bg-purple-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <BadgeCheck className="w-8 h-8 text-purple-400" />
                                </div>
                                
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white mb-2">Looking for more badges?</h3>
                                    <p className="text-white/70 mb-0 md:mb-0 max-w-2xl">
                                        Join the cutz.lol community and participate in events to unlock exclusive badges that make your profile stand out.
                                    </p>
                                </div>
                                
                                <a
                                    href="https://discord.gg/cutz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 flex-shrink-0"
                                >
                                    Join our Discord
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Color Picker Portal */}
            {showColorPicker && (
                <ColorPickerPortal
                    color={badgeColor}
                    onChange={setBadgeColor}
                    onClose={handleCloseColorPicker}
                    targetRect={colorPickerRect}
                    ref={colorPickerRef}
                />
            )}

            {/* Edit Badge Modal */}
            {showEditModal && selectedBadge && (
                <EditBadgeModal
                    isOpen={showEditModal}
                    onClose={handleCloseEditModal}
                    badge={selectedBadge}
                    onFileUpload={handleFileUpload}
                    newBadgeName={newBadgeName}
                    setNewBadgeName={setNewBadgeName}
                    newMediaURL={newMediaURL}
                    onSaveChanges={handleBadgeChangesSave}
                    isLoading={isLoading}
                    creditsLeft={creditsLeft}
                />
            )}
        </DashboardLayout>
    );
}