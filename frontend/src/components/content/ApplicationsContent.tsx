'use client';

import { useState } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  Info,
  XCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  ArrowRight,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Application, ApplicationStatus, Position } from 'haze.bio/types/apply';
import DashboardLayout from 'haze.bio/components/dashboard/Layout';
import NewApplicationModal from 'haze.bio/components/modals/NewApplicationModal';

interface ApplicationsContentProps {
  initialApplications: Application[];
  initialOpenPositions: number;
  initialPositions: Position[];
}

export default function ApplicationsContent({
  initialApplications,
  initialOpenPositions,
  initialPositions
}: ApplicationsContentProps) {
  const [applications] = useState<Application[]>(Array.isArray(initialApplications) ? initialApplications : []);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const router = useRouter();

  const filteredApplications = statusFilter === 'all'
    ? applications
    : applications.filter(app => app.status === statusFilter);

  const pendingCount = applications.filter(app =>
    app.status === 'submitted' || app.status === 'in_review'
  ).length;

  const approvedCount = applications.filter(app =>
    app.status === 'approved'
  ).length;

  const handleResumeApplication = (positionId: string) => {
    router.push(`/dashboard/applications/${positionId}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not submitted';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const ms = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getStatusInfo = (status: ApplicationStatus) => {
    const statusInfo = {
      draft: {
        color: 'text-zinc-400',
        bg: 'bg-zinc-800/30',
        border: 'border-zinc-700/30',
        icon: <FileText className="w-5 h-5 text-zinc-400" />,
        title: 'Continue Your Application',
        description: 'Your application is in progress. Continue from where you left off.'
      },
      submitted: {
        color: 'text-blue-400',
        bg: 'bg-blue-900/10',
        border: 'border-blue-700/20',
        icon: <Clock className="w-5 h-5 text-blue-400" />,
        title: 'Application Submitted',
        description: 'Your application has been received and is awaiting review.'
      },
      in_review: {
        color: 'text-yellow-400',
        bg: 'bg-yellow-900/10',
        border: 'border-yellow-700/20',
        icon: <Info className="w-5 h-5 text-yellow-400" />,
        title: 'Under Review',
        description: 'Our team is currently reviewing your application.'
      },
      approved: {
        color: 'text-green-400',
        bg: 'bg-green-900/10',
        border: 'border-green-700/20',
        icon: <CheckCircle className="w-5 h-5 text-green-400" />,
        title: 'Congratulations!',
        description: 'Your application has been approved. We\'ll contact you soon with next steps.'
      },
      rejected: {
        color: 'text-red-400',
        bg: 'bg-red-900/10',
        border: 'border-red-700/20',
        icon: <XCircle className="w-5 h-5 text-red-400" />,
        title: 'Application Not Accepted',
        description: 'Unfortunately, your application was not successful at this time.'
      }
    };

    return statusInfo[status] || statusInfo.draft;
  };

  return (
    <DashboardLayout>
      <div className="max-w-[100rem] mx-auto space-y-8 relative">
        {/* Hero Section */}
        <div className="bg-[#0E0E0E] rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Your Applications
            </h1>
            <p className="text-white/70 text-sm md:text-base">
              Track the status of your applications and complete any drafts.
              {initialOpenPositions > 0 && ` There are currently ${initialOpenPositions} open positions.`}
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <button
                onClick={() => setIsApplicationModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Apply for Position
              </button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Total Applications</p>
                <p className="text-white font-medium text-lg">{applications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Pending Review</p>
                <p className="text-white font-medium text-lg">{pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Approved</p>
                <p className="text-white font-medium text-lg">{approvedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Open Positions</p>
                <p className="text-white font-medium text-lg">{initialOpenPositions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Application History
            </h2>

            <div className="flex items-center gap-2 bg-zinc-800/30 rounded-lg border border-zinc-700/50 p-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === 'draft'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
              >
                Drafts
              </button>
              <button
                onClick={() => setStatusFilter('submitted')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === 'submitted'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
              >
                Active
              </button>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-14 h-14 bg-purple-800/20 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Applications Found</h3>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                {statusFilter === 'all'
                  ? "You haven't started any applications yet. Explore available positions to apply."
                  : `You don't have any applications with "${statusFilter}" status.`}
              </p>
              <button
                onClick={() => setIsApplicationModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Apply for a Position
              </button>
            </div>
          ) : (
            <div>
              {filteredApplications.map((application) => {
                // Bestimme die Farben und Icons basierend auf dem Status
                const iconBgClass = {
                  draft: 'bg-zinc-800/50',
                  submitted: 'bg-blue-900/20',
                  in_review: 'bg-yellow-900/20',
                  approved: 'bg-green-900/20',
                  rejected: 'bg-red-900/20',
                }[application.status] || 'bg-zinc-800/50';

                const statusTextClass = {
                  draft: 'text-zinc-400',
                  submitted: 'text-blue-400',
                  in_review: 'text-yellow-400',
                  approved: 'text-green-400',
                  rejected: 'text-red-400',
                }[application.status] || 'text-zinc-400';

                const statusIcon = getStatusInfo(application.status).icon;

                return (
                  <div
                    key={application.id}
                    className="border-b border-zinc-800/50 last:border-b-0"
                  >
                    <div
                      className={`flex p-5 ${(application.status === 'draft')
                        ? 'cursor-pointer hover:bg-zinc-900/30'
                        : 'cursor-default'
                        } transition-colors`}
                      onClick={(e) => {
                        if (application.status === 'draft') {
                          handleResumeApplication(application.position_id);
                        }
                      }}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 mr-4 ${iconBgClass}`}>
                        {statusIcon}
                      </div>

                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium truncate">{application.position_title}</h3>
                          <span className={`text-xs font-medium ${statusTextClass} ml-2`}>
                            {application.status === 'draft' && 'Draft'}
                            {application.status === 'submitted' && 'Submitted'}
                            {application.status === 'in_review' && 'In Review'}
                            {application.status === 'approved' && 'Approved'}
                            {application.status === 'rejected' && 'Rejected'}
                          </span>
                        </div>

                        <div className="flex items-center text-xs text-zinc-500">
                          <span>ID: #{application.id}</span>
                          <span className="mx-2">•</span>
                          <span>{application.submitted_at ? formatDate(application.submitted_at) : 'Not submitted'}</span>
                          <span className="mx-2">•</span>
                          <span>Updated {getTimeAgo(application.last_updated_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        {application.status === 'draft' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResumeApplication(application.position_id);
                            }}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Clock className="w-3 h-3" />
                            Resume
                          </button>
                        )}

                        {application.status === 'approved' && (
                          <a
                            href="https://discord.gg/cutz"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Discord
                          </a>
                        )}

                        {(application.status === 'draft') && (
                          <ChevronRight className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                    </div>

                    {(application.status === 'rejected' || application.status === 'approved') && application.feedback_note && (
                      <div className={`px-5 py-3 ${application.status === 'rejected' ? 'bg-red-900/5' : 'bg-green-900/5'
                        }`}>
                        <div className={`flex gap-2 p-3 rounded-lg border ${application.status === 'rejected' ? 'border-red-900/10' : 'border-green-900/10'
                          }`}>
                          <Info className={`w-4 h-4 mt-0.5 ${application.status === 'rejected' ? 'text-red-400' : 'text-green-400'
                            }`} />
                          <div>
                            <p className={`text-xs font-medium mb-1 ${application.status === 'rejected' ? 'text-red-400' : 'text-green-400'
                              }`}>
                              {application.status === 'rejected' ? 'Feedback:' : 'Note:'}
                            </p>
                            <p className="text-xs text-zinc-400">{application.feedback_note}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Application Tips */}
        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/50">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400" />
              Application Tips
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Be Thorough</h3>
                <p className="text-xs text-zinc-400 mt-1">Answer all questions completely and thoughtfully. Quality over quantity.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Take Your Time</h3>
                <p className="text-xs text-zinc-400 mt-1">Draft applications are saved for 7 days. You can come back and continue anytime.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Check Status Regularly</h3>
                <p className="text-xs text-zinc-400 mt-1">Monitor your application status and respond promptly if additional information is requested.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        <NewApplicationModal
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
          initialPositions={initialPositions}
        />
      </div>
    </DashboardLayout>
  );
}