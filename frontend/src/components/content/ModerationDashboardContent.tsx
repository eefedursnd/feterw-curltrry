'use client';

import { useEffect, useState } from 'react';
import {
    ShieldAlert,
    Search,
    User as UserIcon,
    Users,
    ChevronRight,
    ArrowRight,
    AlertTriangle,
    Info,
    FileText,
    Shield,
    UserCheck,
    X,
    Flag,
    Link,
    Database,
    Clock,
    Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from 'haze.bio/components/dashboard/Layout';
import { useRouter } from 'next/navigation';
import { punishAPI } from 'haze.bio/api';
import Image from 'next/image';

interface ModerationDashboardContentProps {
}

export default function ModerationDashboardContent({ }: ModerationDashboardContentProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const [openReportCount, setOpenReportCount] = useState<number>(0);
    const [isLoadingReportCount, setIsLoadingReportCount] = useState(false);
    const [moderationStats, setModerationStats] = useState({
        total_bans: 0,
        total_mutes: 0,
        reports_processed: 0,
        active_punishments: 0
    });

    useEffect(() => {
        try {
            const savedSearches = localStorage.getItem('mod_recent_searches');
            if (savedSearches) {
                setRecentSearches(JSON.parse(savedSearches));
            }
        } catch (e) {
            console.error('Failed to load recent searches', e);
        }

        fetchReportCount();
        fetchModerationStats();
    }, []);

    const fetchModerationStats = async () => {
        try {
            // Mock data for now, would normally be fetched from API
            setModerationStats({
                total_bans: 143,
                total_mutes: 267,
                reports_processed: 512,
                active_punishments: 78
            });
        } catch (error) {
            console.error('Error fetching moderation stats:', error);
        }
    };

    const handleUserSearch = async () => {
        if (!searchTerm || searchTerm.length < 3) {
            toast.error('Please enter at least 3 characters to search');
            return;
        }

        setIsSearching(true);

        try {
            const results = await punishAPI.searchUsersForModeration(searchTerm);
            setSearchResults(results || []);

            if (!results || results.length === 0) {
                toast.error('No users found with that username');
            }
        } catch (error) {
            console.error('Error searching users:', error);
            toast.error('Error searching users');
        } finally {
            setIsSearching(false);
        }
    };

    const handleViewUserDetails = (username: string) => {
        setRecentSearches(prev => {
            const updatedSearches = [username, ...prev.filter(s => s !== username)].slice(0, 5);
            try {
                localStorage.setItem('mod_recent_searches', JSON.stringify(updatedSearches));
            } catch (e) {
                console.error('Failed to save recent searches', e);
            }
            return updatedSearches;
        });

        router.push(`/dashboard/moderation/users/${username}`);
    };

    const fetchReportCount = async () => {
        setIsLoadingReportCount(true);
        try {
            const count = await punishAPI.getOpenReportCount();
            setOpenReportCount(count);
        } catch (error) {
            console.error('Error fetching report count:', error);
        } finally {
            setIsLoadingReportCount(false);
        }
    };

    const handleGetRandomReport = async () => {
        try {
            router.push('/dashboard/moderation/reports');
        } catch (error) {
            console.error('Error getting report:', error);
            toast.error('Error retrieving report');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (searchTerm.length >= 3) {
                handleUserSearch();
            } else {
                toast.error('Please enter at least 3 characters to search');
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-6">
                {/* Hero Section with Header */}
                <div className="bg-gradient-to-br from-black to-black rounded-xl p-8 border border-zinc-800/80 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_70%)]"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>
                    <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 max-w-3xl">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                Moderation Dashboard
                            </h1>
                            <span className="px-2 py-0.5 bg-red-900/30 border border-red-800/30 rounded-full text-[10px] font-medium text-red-300">
                                STAFF
                            </span>
                        </div>
                        <p className="text-white/70 text-sm md:text-base mb-6">
                            Find users by username and access moderation tools. View detailed user information and apply restrictions when necessary.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleGetRandomReport}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/10"
                            >
                                <Flag className="w-4 h-4" /> 
                                Manage Reports
                                {openReportCount > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-medium bg-red-500 text-white rounded-full ml-1">
                                        {openReportCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Overview Grid */}
                {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden p-5 hover:border-red-500/20 transition-all duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-white/60 text-xs">Active Restrictions</p>
                                <p className="text-white font-medium text-lg">
                                    {moderationStats.active_punishments}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden p-5 hover:border-red-500/20 transition-all duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <Flag className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-white/60 text-xs">Reports Processed</p>
                                <p className="text-white font-medium text-lg">
                                    {moderationStats.reports_processed}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden p-5 hover:border-red-500/20 transition-all duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <Database className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-white/60 text-xs">Total Bans</p>
                                <p className="text-white font-medium text-lg">
                                    {moderationStats.total_bans}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden p-5 hover:border-red-500/20 transition-all duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-white/60 text-xs">Total Mutes</p>
                                <p className="text-white font-medium text-lg">
                                    {moderationStats.total_mutes}
                                </p>
                            </div>
                        </div>
                    </div>
                </div> */}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* User Search Card */}
                        <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Search className="w-4 h-4 text-red-400" />
                                    Find Users
                                </h2>
                            </div>

                            <div className="p-5">
                                <div className="flex gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="Search by username..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="w-full bg-zinc-900/30 border border-zinc-800/80 rounded-lg py-3 pl-10 pr-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500/30"
                                        />
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    </div>
                                    <button
                                        onClick={handleUserSearch}
                                        disabled={isSearching || searchTerm.length < 3}
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-5 py-2 rounded-lg border border-red-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSearching ? (
                                            <div className="w-5 h-5 border-2 border-red-400/20 border-t-red-400/80 rounded-full animate-spin"></div>
                                        ) : (
                                            <Search size={18} />
                                        )}
                                        Search
                                    </button>
                                </div>

                                <p className="text-zinc-500 text-sm mb-5">
                                    Enter a username to find users and access moderation tools.
                                </p>

                                {isSearching ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500/80 rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {searchResults.length > 0 && (
                                            <>
                                                <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
                                                    <Users size={14} className="text-red-400" />
                                                    Search Results
                                                </h3>

                                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                                    {searchResults.map((user) => (
                                                        <div
                                                            key={user.uid}
                                                            className="bg-zinc-900/20 hover:bg-zinc-800/30 border border-zinc-800/50 hover:border-red-500/30 rounded-lg p-3 cursor-pointer transition-colors"
                                                            onClick={() => handleViewUserDetails(user.username)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-black/50 rounded-lg overflow-hidden border border-zinc-800/50 flex-shrink-0">
                                                                        {user.profile?.avatar_url ? (
                                                                            <Image
                                                                                src={user.profile.avatar_url}
                                                                                alt={user.username}
                                                                                width={40}
                                                                                height={40}
                                                                                className="object-cover w-full h-full"
                                                                                draggable="false"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                <UserIcon className="w-5 h-5 text-white/40" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-white font-medium">@{user.username}</p>
                                                                            {user.has_premium && (
                                                                                <span className="text-xs bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded-full">
                                                                                    Premium
                                                                                </span>
                                                                            )}
                                                                            {user.punishments?.some((p: any) => p.active) && (
                                                                                <span className="text-xs bg-red-900/30 text-red-300 px-1.5 py-0.5 rounded-full">
                                                                                    Restricted
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-zinc-400 text-sm">{user.display_name || user.username}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-zinc-500 text-xs">UID: {user.uid}</div>
                                                                    <button className="flex items-center gap-1 bg-red-900/20 hover:bg-red-900/30 text-red-300 text-xs px-2 py-1 rounded-md transition-colors">
                                                                        View Details
                                                                        <ChevronRight size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Open Reports Card */}
                        <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Flag className="w-4 h-4 text-red-400" />
                                    Open Reports
                                </h2>
                            </div>

                            <div className="p-5">
                                <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-lg p-4 mb-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                                            <span className="text-white font-medium text-lg">
                                                {isLoadingReportCount ? (
                                                    <span className="inline-block w-6 h-4 bg-zinc-800 rounded animate-pulse"></span>
                                                ) : (
                                                    openReportCount
                                                )}
                                            </span>
                                            <span className="text-zinc-400">
                                                {openReportCount === 1 ? 'report' : 'reports'} waiting for review
                                            </span>
                                        </div>

                                        {openReportCount > 0 && (
                                            <span className="text-xs bg-amber-900/30 text-amber-300 px-2 py-1 rounded-full">
                                                Needs attention
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-sm text-zinc-300 mb-5">
                                    Review user reports to maintain community guidelines and take appropriate action against users who violate platform rules.
                                </div>

                                <button
                                    onClick={handleGetRandomReport}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border text-sm font-medium transition-colors bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/20"
                                >
                                    <Flag size={16} />
                                    Manage Reports
                                </button>
                            </div>
                        </div>

                        {/* Help Card */}
                        <div className="bg-red-900/10 backdrop-blur-sm rounded-xl border border-red-500/20 p-5">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-red-500/10 rounded-lg flex-shrink-0">
                                    <Info className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-medium text-white mb-2">Need help with moderation?</h3>
                                    <p className="text-sm text-red-100/70 mb-3">
                                        Remember to follow moderation guidelines when taking action. If you're unsure about a decision,
                                        consult with a head moderator or refer to the policy documentation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Recent Searches */}
                        <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-red-400" />
                                    Recent Users
                                </h2>
                            </div>

                            <div className="p-5">
                                {recentSearches.length > 0 ? (
                                    <div className="space-y-2">
                                        {recentSearches.map((username, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleViewUserDetails(username)}
                                                className="bg-zinc-900/20 hover:bg-zinc-800/30 border border-zinc-800/50 hover:border-red-500/30 rounded-lg p-3 cursor-pointer transition-colors flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <UserIcon size={18} className="text-zinc-400" />
                                                    <span className="text-white">@{username}</span>
                                                </div>
                                                <ArrowRight size={16} className="text-red-400" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 bg-zinc-900/20 rounded-lg border border-zinc-800/50">
                                        <Users className="w-8 h-8 text-zinc-600 mb-2" />
                                        <p className="text-zinc-400">No recent users</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Info className="w-4 h-4 text-red-400" />
                                    Moderation Tips
                                </h2>
                            </div>

                            <div className="p-5">
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 bg-red-900/20 rounded-lg flex-shrink-0 flex items-center justify-center">
                                            <Shield size={12} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">Be Objective</p>
                                            <p className="text-zinc-400 text-xs">Assess reports based on platform rules, not personal opinions</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 bg-red-900/20 rounded-lg flex-shrink-0 flex items-center justify-center">
                                            <FileText size={12} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">Document Everything</p>
                                            <p className="text-zinc-400 text-xs">Always add clear notes about the reason for actions taken</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 bg-red-900/20 rounded-lg flex-shrink-0 flex items-center justify-center">
                                            <AlertTriangle size={12} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">Escalate When Needed</p>
                                            <p className="text-zinc-400 text-xs">Don't hesitate to escalate complex cases to senior moderators</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}