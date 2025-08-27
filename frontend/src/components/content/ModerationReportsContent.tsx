'use client';

import { useEffect, useState } from 'react';
import {
    Flag,
    User as UserIcon,
    Users,
    ChevronRight,
    AlertTriangle,
    X,
    ArrowLeft,
    Shield,
    Ban,
    Loader2,
    ShieldAlert,
    Eye,
    CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from 'haze.bio/components/dashboard/Layout';
import { punishAPI } from 'haze.bio/api';
import { ReportWithDetails, User } from 'haze.bio/types';
import Image from 'next/image';
import CreateRestrictionModal from '../modals/CreateRestrictionModal';
import { HasModeratorPermission } from 'haze.bio/utils/staff';
import { useUser } from 'haze.bio/context/UserContext';

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export default function ModerationReportsContent() {
    const [reportList, setReportList] = useState<ReportWithDetails[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);
    const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
    const [reportedUser, setReportedUser] = useState<User | null>(null);
    const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { user: currentUser } = useUser();

    useEffect(() => {
        fetchReports();
    }, [refreshTrigger]);

    const fetchReports = async () => {
        setIsLoadingReports(true);
        try {
            const reports = await punishAPI.getOpenReports();
            setReportList(reports);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setIsLoadingReports(false);
        }
    };

    const handleSelectReport = async (report: ReportWithDetails) => {
        setSelectedReport(report);
        setReportedUser(null);

        try {
            const userData = await punishAPI.searchUsersForModeration(report.reported_username);
            if (userData && userData.length > 0) {
                setReportedUser(userData[0]);
            }
        } catch (error) {
            console.error('Error fetching reported user data:', error);
        }

        try {
            await punishAPI.assignReportToStaff(report.id);
        } catch (error: any) {
            console.error('Error assigning report:', error);
            if (error.message && (
                error.message.includes("already being handled") ||
                error.message.includes("already been handled")
            )) {
                toast.error(error.message);
                setRefreshTrigger(prev => prev + 1);
                setSelectedReport(null);
            }
        }
    };

    const handleBackToList = () => {
        setSelectedReport(null);
        setReportedUser(null);
    };

    const handleDismissReport = async () => {
        if (!selectedReport) return;

        setIsProcessing(true);
        try {
            await punishAPI.handleReport(selectedReport.id);
            toast.success('Report has been dismissed');
            setSelectedReport(null);
            setReportedUser(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error dismissing report:', error);
            toast.error('Failed to dismiss report');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReportActionSuccess = async () => {
        if (!selectedReport) return;

        try {
            await punishAPI.handleReport(selectedReport.id);
            toast.success('Action taken and report closed');
            setSelectedReport(null);
            setReportedUser(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error closing report:', error);
            toast.error('Failed to close report');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-6">
                {/* Hero Section with Header */}
                <div className="bg-gradient-to-br from-black to-black rounded-xl p-8 border border-zinc-800/80 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_70%)]"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>

                    <div className="relative z-10 max-w-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    Reports Management
                                </h1>
                                <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-sm font-medium text-red-300">
                                        {isLoadingReports
                                            ? <div className="w-5 h-2 bg-red-300/30 rounded animate-pulse"></div>
                                            : reportList.length} open
                                    </span>
                                </div>
                            </div>
                            <p className="text-white/70 text-sm md:text-base">
                                Review and handle user reports to maintain community standards.
                            </p>
                        </div>
                        {selectedReport && (
                            <button
                                onClick={handleBackToList}
                                className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors px-3 py-1.5 bg-[#0E0E0E]/50 hover:bg-zinc-900/80 rounded-lg border border-zinc-800/50"
                            >
                                <ArrowLeft size={16} />
                                <span>Back to List</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                {selectedReport ? (
                    /* Report Detail View */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Reported User Profile Card */}
                        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-red-400" />
                                    Reported User
                                </h2>
                            </div>

                            <div className="p-5">
                                {reportedUser ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-900 mb-3 border border-zinc-800/50">
                                                <Image
                                                    src={reportedUser.profile?.avatar_url || "https://cdn.haze.bio/default_avatar.jpeg"}
                                                    alt={reportedUser.username}
                                                    width={80}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                    draggable="false"
                                                />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">@{reportedUser.username}</h3>
                                            <p className="text-zinc-400">{reportedUser.display_name}</p>
                                        </div>

                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/80">
                                            <div className="flex items-center justify-between">
                                                <span className="text-zinc-400 text-sm">User ID</span>
                                                <span className="text-white text-sm font-medium">{reportedUser.uid}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/80">
                                                <span className="text-zinc-400 text-xs">Account Type</span>
                                                <div className="flex items-center mt-1">
                                                    {reportedUser.has_premium ? (
                                                        <span className="text-purple-400 text-sm font-medium">Premium</span>
                                                    ) : (
                                                        <span className="text-zinc-300 text-sm font-medium">Standard</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/80">
                                                <span className="text-zinc-400 text-xs">Joined</span>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-zinc-300 text-sm font-medium">{formatDate(reportedUser.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/80">
                                            <span className="text-zinc-400 text-xs">Total Reports</span>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-zinc-300 text-sm font-medium">{selectedReport.total_reports}</span>
                                                {selectedReport.has_active_punishment && (
                                                    <span className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded-full">
                                                        Already Restricted
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mt-4">
                                            {HasModeratorPermission(currentUser) && (
                                                <button
                                                    onClick={() => setIsRestrictionModalOpen(true)}
                                                    disabled={isProcessing}
                                                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/20 transition-colors disabled:opacity-50 font-medium"
                                                >
                                                    <Ban size={16} />
                                                    Restrict User
                                                </button>
                                            )}

                                            <button
                                                onClick={() => window.open(`/dashboard/moderation/users/${reportedUser.username}`, '_blank')}
                                                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900/30 hover:bg-zinc-800/50 text-white rounded-lg border border-zinc-800/50 transition-colors"
                                            >
                                                <Eye size={16} />
                                                View Full Profile
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 bg-zinc-900/20 rounded-lg border border-zinc-800/50">
                                        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin mb-2" />
                                        <p className="text-zinc-400">Loading user data...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Report Details */}
                        <div className="md:col-span-2 bg-[#0E0E0E] rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Flag className="w-4 h-4 text-red-400" />
                                    Report Details
                                </h2>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="flex items-start gap-3 bg-zinc-900/30 rounded-lg p-4 border border-zinc-800/80">
                                    <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-white font-medium">Reason for Report</h3>
                                            <span className="text-zinc-500 text-xs ml-2">
                                                Reported {formatDate(selectedReport.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-zinc-300 mt-1">{selectedReport.reason}</p>
                                    </div>
                                </div>

                                <div className="bg-zinc-900/30 rounded-lg p-4 border border-zinc-800/80">
                                    <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-red-400" />
                                        Report Details
                                    </h3>
                                    <p className="text-zinc-300 whitespace-pre-wrap">{selectedReport.details}</p>

                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
                                        <div className="flex items-center gap-1.5">
                                            <UserIcon size={14} className="text-zinc-500" />
                                            <span className="text-zinc-400 text-sm">
                                                Reported by <span className="text-zinc-300">@{selectedReport.reporter_username}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedReport.other_reporters && selectedReport.other_reporters.length > 0 && (
                                    <div className="bg-amber-900/10 backdrop-blur-sm rounded-lg p-4 border border-amber-500/20">
                                        <h3 className="text-amber-300 font-medium mb-2 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-amber-400" />
                                            Similar Reports
                                        </h3>
                                        <p className="text-amber-200/80 mb-3 text-sm">
                                            This user has been reported by {selectedReport.other_reporters.length} other user(s) for the same reason:
                                        </p>

                                        <div className="bg-amber-900/20 rounded-lg p-3">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedReport.other_reporters.map((username, idx) => (
                                                    <div key={idx} className="px-2 py-1 bg-amber-800/30 rounded-full text-amber-200 text-xs">
                                                        @{username}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedReport.has_active_punishment && (
                                    <div className="bg-red-900/10 backdrop-blur-sm rounded-lg p-4 border border-red-500/20">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5 text-red-400" />
                                            <h3 className="text-red-300 font-medium">User Already Restricted</h3>
                                        </div>
                                        <p className="text-red-200/80 mt-1 text-sm">
                                            This user already has an active restriction. You can view the details in their profile.
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-zinc-800">
                                    <h3 className="text-white font-medium mb-3">Actions</h3>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={handleDismissReport}
                                            disabled={isProcessing}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900/50 hover:bg-zinc-800/70 text-white rounded-lg border border-zinc-800/50 transition-colors disabled:opacity-50 font-medium"
                                        >
                                            {isProcessing ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <CheckCircle size={16} />
                                            )}
                                            Dismiss Report
                                        </button>

                                        {HasModeratorPermission(currentUser) && (
                                            <button
                                                onClick={() => setIsRestrictionModalOpen(true)}
                                                disabled={isProcessing}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/20 transition-colors disabled:opacity-50 font-medium"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Ban size={16} />
                                                )}
                                                Restrict User
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Reports List View */
                    <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800 overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800">
                            <h2 className="text-white font-semibold flex items-center gap-2">
                                <Flag className="w-4 h-4 text-red-400" />
                                Open Reports
                            </h2>
                        </div>

                        <div className="p-5">
                            {isLoadingReports ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-10 h-10 border-2 border-red-500/20 border-t-red-500/80 rounded-full animate-spin"></div>
                                </div>
                            ) : reportList.length > 0 ? (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                    {reportList.map((report) => (
                                        <div
                                            key={report.id}
                                            onClick={() => handleSelectReport(report)}
                                            className="bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-800/50 hover:border-red-500/30 rounded-lg p-4 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
                                                        <Flag className="w-4 h-4 text-red-400" />
                                                    </div>
                                                    <h3 className="text-white font-medium">@{report.reported_username}</h3>
                                                    {report.has_active_punishment && (
                                                        <span className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded-full">
                                                            Already Restricted
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-zinc-500 text-xs">
                                                    {formatDate(report.created_at)}
                                                </span>
                                            </div>

                                            <div className="pl-11">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-zinc-300 truncate max-w-md">{report.reason}</p>

                                                    <div className="flex items-center gap-1.5">
                                                        {report.total_reports > 1 && (
                                                            <span className="text-xs bg-amber-900/30 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <Users size={12} />
                                                                {report.total_reports}
                                                            </span>
                                                        )}
                                                        <button className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-2 py-1 rounded-md transition-colors">
                                                            Review
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center mt-2 text-zinc-500 text-xs">
                                                    <UserIcon size={12} className="mr-1.5" />
                                                    Reported by @{report.reporter_username}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 rounded-lg border border-zinc-800/50">
                                    <div className="w-14 h-14 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                                        <Flag className="w-7 h-7 text-zinc-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-zinc-300 mb-2">No Open Reports</h3>
                                    <p className="text-zinc-400 text-center max-w-md">
                                        There are no user reports that require your attention at this time.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {reportedUser && HasModeratorPermission(currentUser) && (
                <CreateRestrictionModal
                    isOpen={isRestrictionModalOpen}
                    onClose={() => setIsRestrictionModalOpen(false)}
                    onSuccess={handleReportActionSuccess}
                    preselectedUser={reportedUser}
                />
            )}
        </DashboardLayout>
    );
}