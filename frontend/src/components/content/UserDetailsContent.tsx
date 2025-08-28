'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from 'haze.bio/components/dashboard/Layout';
import { useRouter } from 'next/navigation';
import { punishAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
    ShieldAlert,
    User as UserIcon,
    ChevronLeft,
    Ban,
    Clock,
    Calendar,
    AtSign,
    Mail,
    Flag,
    Shield,
    ExternalLink,
    Pencil,
    Link as LinkIcon,
    MapPin,
    RefreshCw,
    Smartphone,
    History,
    Lock,
    Unlock,
    Eye,
    AlertTriangle,
    Crown,
    BadgeCheck,
    Layers,
    Hash,
    Info,
    Share2,
    Globe,
    Headphones,
    Activity,
    Settings
} from 'lucide-react';
import { Punishment, User, UserBadge, UserSession } from 'haze.bio/types';
import CreateRestrictionModal from '../modals/CreateRestrictionModal';
import { PremiumBadge } from 'haze.bio/badges/Badges';
import { DiscordIcon } from 'haze.bio/socials/Socials';
import { GetStaffLevelName, HasHeadModPermission, HasModeratorPermission } from 'haze.bio/utils/staff';
import { useUser } from 'haze.bio/context/UserContext';

interface UserDetailsContentProps {
    username: string;
    initialData?: User;
}

const getActiveRestriction = (history: Punishment[] | undefined) => {
    if (!history || !Array.isArray(history)) return null;
    return history.find(restriction => restriction.active === true);
};

export default function UserDetailsContent({ username, initialData }: UserDetailsContentProps) {
    const router = useRouter();
    const [userData, setUserData] = useState<User | null>(initialData || null);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [punishmentHistory, setPunishmentHistory] = useState<Punishment[]>(userData?.punishments || []);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'activity'>('overview');
    const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);

    const activeRestriction = getActiveRestriction(userData?.punishments || []);
    const { user: currentUser } = useUser();

    useEffect(() => {
        if (!initialData && username) {
            loadUserData();
        }
    }, [username, initialData]);

    useEffect(() => {
        if (userData && activeTab === 'history' && (!punishmentHistory || punishmentHistory.length === 0)) {
            loadPunishmentHistory();
        }
    }, [activeTab, userData]);

    const loadUserData = async () => {
        setIsLoading(true);
        try {
            const results = await punishAPI.searchUsersForModeration(username);
            if (results && results.length > 0) {
                setUserData(results[0]);
                setPunishmentHistory(results[0].punishments || []);
            } else {
                toast.error('User not found');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            toast.error('Failed to load user data');
        } finally {
            setIsLoading(false);
        }
    };

    const loadPunishmentHistory = async () => {
        if (!userData) return;

        setIsLoadingHistory(true);
        try {
            setPunishmentHistory(userData.punishments || []);
        } catch (error) {
            console.error('Error loading punishment history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleUnrestrictUser = async (punishmentId: number) => {
        try {
            await punishAPI.unrestrictUser(punishmentId);
            toast.success(`Restriction removed from user ${username}`);

            // Update local state
            if (userData) {
                const updatedPunishments = (userData.punishments || []).filter(p => p.id !== punishmentId);
                setUserData({
                    ...userData,
                    punishments: updatedPunishments
                });
                setPunishmentHistory(prev => prev.filter(p => p.id !== punishmentId));
            }
        } catch (error) {
            console.error('Error removing restriction:', error);
            toast.error('Failed to remove restriction');
        }
    };

    const openRestrictionModal = () => {
        setIsRestrictionModalOpen(true);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getAccountAge = (createdAt: string) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
            return `${diffDays} days`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? 'month' : 'months'}`;
        } else {
            const years = Math.floor(diffDays / 365);
            const remainingMonths = Math.floor((diffDays % 365) / 30);
            return `${years} ${years === 1 ? 'year' : 'years'}${remainingMonths > 0 ? ` ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}` : ''}`;
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-black to-black rounded-xl p-8 border border-zinc-800/80 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_70%)]"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>

                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/dashboard/moderation')}
                                className="p-2 bg-black/40 hover:bg-zinc-800/60 rounded-lg transition-colors border border-zinc-800/50 hover:border-red-500/20"
                            >
                                <ChevronLeft size={16} className="text-white/70" />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-red-800/20 rounded-lg flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-red-400" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    User Details
                                </h1>
                            </div>
                        </div>

                        {!isLoading && userData && (
                            <div className="flex gap-2">
                                {activeRestriction ? (
                                    HasHeadModPermission(currentUser) && (
                                        <button
                                            onClick={() => handleUnrestrictUser(activeRestriction.id)}
                                            className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded-lg flex items-center gap-1.5 border border-green-500/10"
                                        >
                                            <Unlock size={14} />
                                            Remove Restriction
                                        </button>
                                    )
                                ) : (
                                    HasModeratorPermission(currentUser) && (
                                        <button
                                            onClick={openRestrictionModal}
                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg flex items-center gap-1.5 border border-red-500/10"
                                        >
                                            <Ban size={14} />
                                            Add Restriction
                                        </button>
                                    )
                                )}

                                {/* View Profile link - always visible */}
                                <a
                                    href={`/${userData.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-black/40 hover:bg-zinc-800/60 text-white/80 hover:text-white text-sm rounded-lg flex items-center gap-1.5 border border-zinc-800/50"
                                >
                                    <ExternalLink size={14} />
                                    View Profile
                                </a>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500/80 rounded-full animate-spin"></div>
                        </div>
                    ) : userData ? (
                        <div className="flex flex-col sm:flex-row gap-6 relative">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-800/40 border-2 border-zinc-800/50 shadow-lg">
                                    <Image
                                        src={userData.profile?.avatar_url || "https://cdn.cutz.lol/default-avatar.png"}
                                        alt={userData.username}
                                        width={96}
                                        height={96}
                                        className="object-cover transition-transform hover:scale-110 duration-500"
                                        draggable="false"
                                    />
                                </div>
                            </div>

                            {/* User Details */}
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="flex items-center flex-wrap gap-2">
                                    <h2 className="text-xl font-bold text-white">{userData.display_name}</h2>
                                    {userData.has_premium && (
                                        <div className="flex items-center gap-1.5 text-[#b5a4ff] bg-[#382779]/20 px-2 py-0.5 rounded-full text-xs border border-[#382779]/30">
                                            <PremiumBadge size={14} />
                                            <span className="font-medium">Premium</span>
                                        </div>
                                    )}
                                    {activeRestriction && (
                                        <div className="flex items-center gap-1.5 text-red-300 bg-red-900/20 px-2 py-0.5 rounded-full text-xs border border-red-700/30">
                                            <Lock size={14} className="text-red-300" />
                                            <span className="font-medium">Restricted</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-zinc-400 flex items-center gap-1.5">
                                    <AtSign size={14} />
                                    {userData.username}
                                    <span className="text-zinc-500 text-xs">UID: {userData.uid}</span>
                                </p>
                                {userData.email && (
                                    <p className="text-zinc-500 text-sm flex items-center gap-1.5">
                                        <Mail size={14} />
                                        {userData.email}
                                        {userData.email_verified ? (
                                            <span className="text-xs bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded-full">Verified</span>
                                        ) : (
                                            <span className="text-xs bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded-full">Unverified</span>
                                        )}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                                        <Calendar size={12} />
                                        Joined {formatDate(userData.created_at)}
                                        <span className="text-zinc-600">({getAccountAge(userData.created_at)} ago)</span>
                                    </span>
                                    <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                                        <Eye size={12} />
                                        {userData.profile?.views || 0} profile views
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <UserIcon className="w-12 h-12 text-zinc-700 mb-3" />
                            <p className="text-zinc-400 text-center">User not found</p>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                {!isLoading && userData && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-black rounded-xl border border-zinc-800 p-4 hover:border-red-500/20 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-zinc-400 text-sm">Account Age</p>
                                        <p className="text-white font-medium">{getAccountAge(userData.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black rounded-xl border border-zinc-800 p-4 hover:border-red-500/20 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                        <BadgeCheck className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-zinc-400 text-sm">Badges</p>
                                        <p className="text-white font-medium">{userData.badges?.length || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black rounded-xl border border-zinc-800 p-4 hover:border-red-500/20 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-zinc-400 text-sm">Profile Views</p>
                                        <p className="text-white font-medium">{userData.profile?.views || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black rounded-xl border border-zinc-800 p-4 hover:border-red-500/20 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                        <Flag className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-zinc-400 text-sm">Reports</p>
                                        <p className="text-white font-medium">
                                            {0}
                                            {activeRestriction && (
                                                <span className="ml-2 text-xs bg-red-900/30 text-red-300 px-1.5 py-0.5 rounded-full">
                                                    Restricted
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex border-b border-zinc-800 mt-6">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'overview'
                                    ? 'border-red-500 text-white'
                                    : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                                    }`}
                            >
                                Overview
                            </button>

                            {HasModeratorPermission(currentUser) && (
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'history'
                                        ? 'border-red-500 text-white'
                                        : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                                        }`}
                                >
                                    Moderation History
                                </button>
                            )}

                            {HasModeratorPermission(currentUser) && (
                                <button
                                    onClick={() => setActiveTab('activity')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'activity'
                                        ? 'border-red-500 text-white'
                                        : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                                        }`}
                                >
                                    Activity & Sessions
                                </button>
                            )}
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Account Details */}
                                <div className="md:col-span-2 bg-black rounded-xl border border-zinc-800 p-5">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                                            <UserIcon className="w-4 h-4 text-red-400" />
                                        </div>
                                        Account Details
                                    </h3>

                                    {activeTab === 'overview' && userData?.staff_level > 0 && (
                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                            <span className="text-zinc-400 text-xs">Staff Level</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Shield size={14} className="text-red-400" />
                                                <span className="text-white">{GetStaffLevelName(userData.staff_level)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                                <p className="text-zinc-400 text-xs mb-1">Username</p>
                                                <div className="flex items-center gap-2">
                                                    <AtSign className="text-red-400 w-4 h-4" />
                                                    <p className="text-white text-sm">{userData.username}</p>
                                                </div>
                                            </div>

                                            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                                <p className="text-zinc-400 text-xs mb-1">Display Name</p>
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="text-red-400 w-4 h-4" />
                                                    <p className="text-white text-sm">{userData.display_name}</p>
                                                </div>
                                            </div>

                                            {userData.alias && (
                                                <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                                    <p className="text-zinc-400 text-xs mb-1">Alias</p>
                                                    <div className="flex items-center gap-2">
                                                        <LinkIcon className="text-red-400 w-4 h-4" />
                                                        <p className="text-white text-sm">{userData.alias}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                                <p className="text-zinc-400 text-xs mb-1">Email</p>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="text-red-400 w-4 h-4" />
                                                    <p className="text-white text-sm">{userData.email || 'Not provided'}</p>
                                                    {userData.email_verified && (
                                                        <span className="text-xs bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded-full">Verified</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                                <p className="text-zinc-400 text-xs mb-1">Account Status</p>
                                                <div className="flex items-center gap-2">
                                                    {activeRestriction ? (
                                                        <>
                                                            <Lock className="text-red-400 w-4 h-4" />
                                                            <p className="text-red-300 text-sm">Restricted</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Shield className="text-green-400 w-4 h-4" />
                                                            <p className="text-green-300 text-sm">Active</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                                <p className="text-zinc-400 text-xs mb-1">Membership</p>
                                                <div className="flex items-center gap-2">
                                                    {userData.has_premium ? (
                                                        <>
                                                            <PremiumBadge size={16} />
                                                            <p className="text-white text-sm">Premium since {formatDate(userData.subscription?.created_at || '')}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserIcon className="text-zinc-400 w-4 h-4" />
                                                            <p className="text-white text-sm">Standard</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {userData.login_with_discord && (
                                                <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                                    <p className="text-zinc-400 text-xs mb-1">Discord</p>
                                                    <div className="flex items-center gap-2">
                                                        <DiscordIcon size={16} className="text-[#5865f2]" />
                                                        <p className="text-white text-sm">
                                                            Linked {formatDate(userData.linked_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                                <p className="text-zinc-400 text-xs mb-1">Badge Edit Credits</p>
                                                <div className="flex items-center gap-2">
                                                    <BadgeCheck className="text-red-400 w-4 h-4" />
                                                    <p className="text-white text-sm">{userData.badge_edit_credits || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Restriction */}
                                    {activeRestriction && (
                                        <div className="mt-4 bg-red-900/10 rounded-lg p-3 border border-red-700/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                                    <h4 className="text-sm font-medium text-white">Active Restriction</h4>
                                                </div>
                                                <span className="text-zinc-500 text-xs">
                                                    Applied by {activeRestriction.staff_name || 'System'} on {formatDate(activeRestriction.created_at)}
                                                </span>
                                            </div>

                                            <div className="bg-black/20 rounded-lg p-3 text-sm">
                                                <p className="text-red-300 text-sm font-medium">{activeRestriction.reason}</p>
                                                <p className="text-zinc-400 text-xs mt-1">{activeRestriction.details}</p>
                                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-red-900/30">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={12} className="text-zinc-500" />
                                                        <span className="text-zinc-400 text-xs">
                                                            {activeRestriction.end_date
                                                                ? `Until ${formatDate(activeRestriction.end_date)}`
                                                                : 'Permanent restriction'}
                                                        </span>
                                                    </div>
                                                    {HasHeadModPermission(currentUser) && (
                                                        <button
                                                            onClick={() => handleUnrestrictUser(activeRestriction.id)}
                                                            className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 py-1 px-2 rounded flex items-center gap-1 border border-green-500/10"
                                                        >
                                                            <Unlock size={12} />
                                                            <span>Remove Restriction</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Profile Info */}
                                    {userData.profile && (
                                        <div className="mt-4 bg-zinc-900/20 rounded-lg p-3 border border-zinc-800/30">
                                            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                                <Settings size={14} className="text-red-400" />
                                                Profile Configuration
                                            </h4>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {userData.profile.description && (
                                                    <div className="bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/50 col-span-2 md:col-span-3">
                                                        <p className="text-zinc-400 text-xs mb-1">Bio</p>
                                                        <p className="text-zinc-300 text-sm">{userData.profile.description}</p>
                                                    </div>
                                                )}

                                                {userData.profile.location && (
                                                    <div className="bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/50">
                                                        <p className="text-zinc-400 text-xs mb-1">Location</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin size={12} className="text-red-400" />
                                                            <p className="text-zinc-300 text-sm">{userData.profile.location}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {userData.profile.template && (
                                                    <div className="bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/50">
                                                        <p className="text-zinc-400 text-xs mb-1">Template</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <Layers size={12} className="text-red-400" />
                                                            <p className="text-zinc-300 text-sm capitalize">{userData.profile.template}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {userData.profile.audio_url && (
                                                    <div className="bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/50">
                                                        <p className="text-zinc-400 text-xs mb-1">Profile Music</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <Headphones size={12} className="text-red-400" />
                                                            <p className="text-zinc-300 text-sm">Yes</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Security Status */}
                                    <div className="bg-black rounded-xl border border-zinc-800 p-5">
                                        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                                                <Shield className="w-4 h-4 text-red-400" />
                                            </div>
                                            Security Status
                                        </h3>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/50">
                                                <span className="text-zinc-300 text-xs">Email Verification</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${userData.email_verified ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                                                    {userData.email_verified ? 'Verified' : 'Unverified'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/50">
                                                <span className="text-zinc-300 text-xs">Two-Factor Authentication</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${userData.mfa_enabled ? 'bg-green-900/30 text-green-300' : 'bg-zinc-800/30 text-zinc-300'}`}>
                                                    {userData.mfa_enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/50">
                                                <span className="text-zinc-300 text-xs">Discord Integration</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${userData.login_with_discord ? 'bg-indigo-900/30 text-indigo-300' : 'bg-zinc-800/30 text-zinc-300'}`}>
                                                    {userData.login_with_discord ? 'Linked' : 'Not Linked'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Actions */}
                                    <div className="bg-black rounded-xl border border-zinc-800 p-5">
                                        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                                                <Activity className="w-4 h-4 text-red-400" />
                                            </div>
                                            Moderation Actions
                                        </h3>

                                        <div className="space-y-2">
                                            {HasModeratorPermission(currentUser) && (
                                                <button
                                                    onClick={openRestrictionModal}
                                                    disabled={!!activeRestriction}
                                                    className={`w-full px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2
                    ${activeRestriction
                                                            ? 'bg-zinc-900/30 text-zinc-500 cursor-not-allowed'
                                                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10'
                                                        }`}
                                                >
                                                    <Ban size={16} />
                                                    {activeRestriction ? 'User Already Restricted' : 'Restrict Account'}
                                                </button>
                                            )}

                                            <a
                                                href={`/${userData.username}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full px-3 py-2 text-sm font-medium bg-black/40 hover:bg-zinc-900/30 text-white/80 hover:text-white rounded-lg flex items-center justify-center gap-2 border border-zinc-800/50"
                                            >
                                                <ExternalLink size={16} />
                                                View Public Profile
                                            </a>

                                            {HasModeratorPermission(currentUser) && (
                                                <button
                                                    onClick={() => setActiveTab('history')}
                                                    className="w-full px-3 py-2 text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center gap-2 border border-red-500/10"
                                                >
                                                    <History size={16} />
                                                    View Moderation History
                                                </button>
                                            )}

                                            {activeRestriction && HasHeadModPermission(currentUser) && (
                                                <button
                                                    onClick={() => handleUnrestrictUser(activeRestriction.id)}
                                                    className="w-full px-3 py-2 text-sm font-medium bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center gap-2 border border-green-500/10"
                                                >
                                                    <Unlock size={16} />
                                                    Remove Restriction
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    {userData.badges && userData.badges.length > 0 && (
                                        <div className="bg-black rounded-xl border border-zinc-800 p-5">
                                            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                                <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                                                    <BadgeCheck className="w-4 h-4 text-red-400" />
                                                </div>
                                                Badges ({userData.badges.length})
                                            </h3>

                                            <div className="flex flex-wrap gap-2">
                                                {userData.badges.map((badge: UserBadge) => (
                                                    <div
                                                        key={badge.id}
                                                        className="px-2 py-1 bg-zinc-900/30 rounded-md text-xs text-zinc-300 border border-zinc-800/50"
                                                        title={badge.badge?.name}
                                                    >
                                                        {badge.badge?.name}
                                                        {badge.hidden && (
                                                            <span className="ml-1 text-zinc-500">(Hidden)</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className="bg-black rounded-xl border border-zinc-800 p-5">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                                        <History className="w-4 h-4 text-red-400" />
                                    </div>
                                    Moderation History
                                </h3>

                                {isLoadingHistory ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-red-500/20 border-t-red-500/80 rounded-full animate-spin"></div>
                                    </div>
                                ) : punishmentHistory && punishmentHistory.length > 0 ? (
                                    <div className="space-y-3">
                                        {punishmentHistory.map((punishment) => (
                                            <div
                                                key={punishment.id}
                                                className={`bg-zinc-900/30 rounded-lg p-3 border ${punishment.active
                                                    ? 'border-red-700/30'
                                                    : 'border-zinc-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-1.5">
                                                        {punishment.active ? (
                                                            <Lock size={14} className="text-red-400" />
                                                        ) : (
                                                            <Unlock size={14} className="text-green-400" />
                                                        )}
                                                        <span className="text-white font-medium text-sm">
                                                            {punishment.punishment_type === 'full' ? 'Full Restriction' : 'Partial Restriction'}
                                                            {punishment.active ? ' (Active)' : ' (Removed)'}
                                                        </span>
                                                    </div>
                                                    <span className="text-zinc-500 text-xs">
                                                        {formatDate(punishment.created_at)} by {punishment.staff_name || 'System'}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-300 text-sm mb-1">
                                                    {punishment.reason}
                                                </p>
                                                <p className="text-zinc-400 text-xs mb-2">
                                                    {punishment.details}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} className="text-zinc-500" />
                                                        <span className="text-zinc-500 text-xs">
                                                            {punishment.end_date
                                                                ? `Expires: ${formatDate(punishment.end_date)}`
                                                                : 'Permanent restriction'}
                                                        </span>
                                                    </div>
                                                    {punishment.active && (
                                                        <button
                                                            onClick={() => handleUnrestrictUser(punishment.id)}
                                                            className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 py-1 px-2 rounded flex items-center gap-1 border border-green-500/10"
                                                        >
                                                            <Unlock size={12} />
                                                            <span>Remove Restriction</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 bg-zinc-900/20 rounded-lg border border-zinc-800/50">
                                        <History className="w-8 h-8 text-zinc-600 mb-2" />
                                        <p className="text-zinc-400">No moderation history</p>
                                        <p className="text-zinc-500 text-sm mt-1">This user has no previous restrictions or warnings</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Sessions */}
                                <div className="bg-black rounded-xl border border-zinc-800 p-5">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                                            <Smartphone className="w-4 h-4 text-red-400" />
                                        </div>
                                        Recent Sessions
                                    </h3>

                                    {userData.sessions && userData.sessions.length > 0 ? (
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                            {userData.sessions.map((session: UserSession) => (
                                                <div
                                                    key={session.id}
                                                    className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-zinc-300 text-xs font-medium truncate max-w-[80%]">
                                                            {session.user_agent}
                                                        </span>
                                                        {session.current_session && (
                                                            <span className="text-xs bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded-full">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-zinc-500 text-xs mt-1">
                                                        {formatDate(session.created_at)}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 text-zinc-500 text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={10} />
                                                            {session.location || 'Unknown'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Globe size={10} />
                                                            {session.ip_address || 'Unknown IP'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 bg-zinc-900/20 rounded-lg border border-zinc-800/50">
                                            <Smartphone className="w-8 h-8 text-zinc-600 mb-2" />
                                            <p className="text-zinc-400">No session data available</p>
                                        </div>
                                    )}
                                </div>

                                {/* Profile Activity */}
                                <div className="bg-black rounded-xl border border-zinc-800 p-5">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                                            <Activity className="w-4 h-4 text-red-400" />
                                        </div>
                                        Profile Activity
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                            <p className="text-zinc-400 text-xs mb-2">Profile Views</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Eye className="text-red-400 w-4 h-4" />
                                                    <p className="text-white text-lg font-medium">{userData.profile?.views || 0}</p>
                                                </div>
                                                <span className="text-xs bg-zinc-900/60 px-2 py-1 rounded-full text-zinc-400">
                                                    All time
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                            <p className="text-zinc-400 text-xs mb-2">Socials Count</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Share2 className="text-red-400 w-4 h-4" />
                                                    <p className="text-white text-lg font-medium">{userData.socials?.length || 0}</p>
                                                </div>
                                                <span className="text-xs bg-zinc-900/60 px-2 py-1 rounded-full text-zinc-400">
                                                    Linked platforms
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                            <p className="text-zinc-400 text-xs mb-2">Widget Count</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="text-red-400 w-4 h-4" />
                                                    <p className="text-white text-lg font-medium">{userData.widgets?.length || 0}</p>
                                                </div>
                                                <span className="text-xs bg-zinc-900/60 px-2 py-1 rounded-full text-zinc-400">
                                                    Active widgets
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
                                            <p className="text-zinc-400 text-xs mb-2">Account Age</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="text-red-400 w-4 h-4" />
                                                    <p className="text-white text-lg font-medium">{getAccountAge(userData.created_at)}</p>
                                                </div>
                                                <span className="text-xs bg-zinc-900/60 px-2 py-1 rounded-full text-zinc-400">
                                                    Since {formatDate(userData.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {userData && HasModeratorPermission(currentUser) && (
                <CreateRestrictionModal
                    isOpen={isRestrictionModalOpen}
                    onClose={() => {
                        setIsRestrictionModalOpen(false);
                    }}
                    onSuccess={() => {
                        setIsRestrictionModalOpen(false);
                        window.location.reload();
                    }}
                    preselectedUser={userData}
                />
            )}
        </DashboardLayout>
    );
}