'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    User,
    Search,
    Filter,
    ArrowUpDown,
    Eye,
    Briefcase,
    RefreshCw,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { applyAPI } from 'haze.bio/api';
import { StaffApplicationListItem, ApplicationStatus } from 'haze.bio/types/apply';
import DashboardLayout from 'haze.bio/components/dashboard/Layout';
import ApplicationStatusBadge from '../application/ApplicationStatus';
import ApplicationReview from '../application/ApplicationReview';

interface ModerationApplyContentProps {
    initialApplications: StaffApplicationListItem[];
}

export default function ModerationApplyContent({ initialApplications }: ModerationApplyContentProps) {
    const [applications, setApplications] = useState<StaffApplicationListItem[]>(initialApplications || []);
    const [filteredApplications, setFilteredApplications] = useState<StaffApplicationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'pending' | 'all'>('pending');
    const [sortField, setSortField] = useState<string>('submitted_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedApplication, setSelectedApplication] = useState<StaffApplicationListItem | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    useEffect(() => {
        if (!applications || !Array.isArray(applications)) {
            setFilteredApplications([]);
            return;
        }

        let result = [...applications];

        if (statusFilter === 'pending') {
            result = result.filter(app => app.status === 'submitted' || app.status === 'in_review');
        } else if (statusFilter !== 'all') {
            result = result.filter(app => app.status === statusFilter);
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                app =>
                    (app.username && app.username.toLowerCase().includes(query)) ||
                    (app.display_name && app.display_name.toLowerCase().includes(query)) ||
                    (app.position_title && app.position_title.toLowerCase().includes(query)) ||
                    (app.id && app.id.toString().includes(query))
            );
        }

        result.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'submitted_at':
                    comparison = new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime();
                    break;
                case 'last_updated_at':
                    comparison = new Date(a.last_updated_at || 0).getTime() - new Date(b.last_updated_at || 0).getTime();
                    break;
                case 'username':
                    comparison = (a.username || '').localeCompare(b.username || '');
                    break;
                case 'display_name':
                    comparison = (a.display_name || '').localeCompare(b.display_name || '');
                    break;
                case 'position_title':
                    comparison = (a.position_title || '').localeCompare(b.position_title || '');
                    break;
                case 'status':
                    comparison = (a.status || '').localeCompare(b.status || '');
                    break;
                default:
                    comparison = 0;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        setFilteredApplications(result);
    }, [applications, searchQuery, statusFilter, sortField, sortDirection]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewApplication = async (application: StaffApplicationListItem) => {
        setSelectedApplication(application);

        if (application.status === 'submitted') {
            try {
                await applyAPI.reviewApplication(application.id, 'in_review', '');
                const updatedApp = { ...application, status: 'in_review' as ApplicationStatus };
                setSelectedApplication(updatedApp);

                setApplications(prevApps =>
                    prevApps.map(app =>
                        app.id === application.id ? updatedApp : app
                    )
                );

                toast.success('Application marked as in review');
            } catch (error) {
                console.error('Error updating application status:', error);
                toast.error('Failed to update application status');
            }
        }

        setShowReviewModal(true);
    };

    const handleStatusChange = async (applicationId: number, newStatus: ApplicationStatus, feedbackNote: string) => {
        try {
            await applyAPI.reviewApplication(applicationId, newStatus, feedbackNote);
            setApplications(prevApps =>
                prevApps.map(app =>
                    app.id === applicationId
                        ? { ...app, status: newStatus, feedback_note: feedbackNote }
                        : app
                )
            );

            setShowReviewModal(false);
        } catch (error) {
            console.error('Error updating application status:', error);
            toast.error('Failed to update application status');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-8 relative">
                {/* Header Section */}
                <div className="bg-black rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                Application Management
                            </h1>
                            <p className="text-white/70 text-sm md:text-base max-w-2xl">
                                Review and manage user applications. You can search and take action on applications.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800/50">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <Search className="w-4 h-4 text-purple-400" />
                            Search Applications
                        </h2>
                    </div>

                    <div className="p-5">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 bg-zinc-900/50 border border-zinc-800/70 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                placeholder="Search by name, username, position, ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-between items-center mt-3">
                            <div className="text-xs text-white/60">
                                Showing {filteredApplications.length} of {applications.length} applications
                            </div>

                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-xs"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800/50">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-400" />
                            Applications
                        </h2>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
                                <p className="text-white/60">Loading applications...</p>
                            </div>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto w-14 h-14 bg-purple-800/20 rounded-lg flex items-center justify-center mb-4">
                                <FileText className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No Applications Found</h3>
                            <p className="text-white/60 mb-6 max-w-md mx-auto">
                                {searchQuery.trim() !== ''
                                    ? "There are no applications matching your search."
                                    : "There are no applications pending review at this time."}
                            </p>
                            {searchQuery.trim() !== '' && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-zinc-900/50 border-b border-zinc-800/70">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('id')}>
                                            <div className="flex items-center gap-1">
                                                ID
                                                {sortField === 'id' && (
                                                    <ChevronDown className={`w-3 h-3 ${sortDirection === 'desc' ? '' : 'rotate-180'}`} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('display_name')}>
                                            <div className="flex items-center gap-1">
                                                Applicant
                                                {sortField === 'display_name' && (
                                                    <ChevronDown className={`w-3 h-3 ${sortDirection === 'desc' ? '' : 'rotate-180'}`} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('position_title')}>
                                            <div className="flex items-center gap-1">
                                                Position
                                                {sortField === 'position_title' && (
                                                    <ChevronDown className={`w-3 h-3 ${sortDirection === 'desc' ? '' : 'rotate-180'}`} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('status')}>
                                            <div className="flex items-center gap-1">
                                                Status
                                                {sortField === 'status' && (
                                                    <ChevronDown className={`w-3 h-3 ${sortDirection === 'desc' ? '' : 'rotate-180'}`} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('submitted_at')}>
                                            <div className="flex items-center gap-1">
                                                Submitted
                                                {sortField === 'submitted_at' && (
                                                    <ChevronDown className={`w-3 h-3 ${sortDirection === 'desc' ? '' : 'rotate-180'}`} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-zinc-800/30 transition-colors" onClick={() => handleSort('last_updated_at')}>
                                            <div className="flex items-center gap-1">
                                                Last Updated
                                                {sortField === 'last_updated_at' && (
                                                    <ChevronDown className={`w-3 h-3 ${sortDirection === 'desc' ? '' : 'rotate-180'}`} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filteredApplications.map((application) => (
                                        <tr
                                            key={application.id}
                                            className="hover:bg-zinc-900/30 transition-colors cursor-pointer"
                                            onClick={() => handleViewApplication(application)}
                                        >
                                            <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                                                #{application.id}
                                            </td>
                                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-zinc-800/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User className="w-3 h-3 text-white/70" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white">{application.display_name || 'Unknown'}</div>
                                                        <div className="text-xs text-white/60">@{application.username || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-3 h-3 text-purple-400" />
                                                    {application.position_title || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                <ApplicationStatusBadge status={application.status} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                                                {application.submitted_at ? formatDate(application.submitted_at) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                                                {formatDate(application.last_updated_at)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewApplication(application);
                                                    }}
                                                    className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-white rounded transition-colors text-xs inline-flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Review Modal */}
                {selectedApplication && (
                    <ApplicationReview
                        application={selectedApplication}
                        isOpen={showReviewModal}
                        onClose={() => setShowReviewModal(false)}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}