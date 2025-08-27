import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    User,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MessageSquare,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Loader2,
    Info,
    HelpCircle
} from 'lucide-react';
import { StaffApplicationListItem, ApplicationStatus, EnrichedApplication, Response } from 'haze.bio/types/apply';
import { applyAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import ApplicationStatusBadge from './ApplicationStatus';

interface ApplicationReviewProps {
    application: StaffApplicationListItem;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange: (applicationId: number, newStatus: ApplicationStatus, feedbackNote: string) => Promise<void>;
}

export default function ApplicationReview({
    application,
    isOpen,
    onClose,
    onStatusChange
}: ApplicationReviewProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [detailedApplication, setDetailedApplication] = useState<EnrichedApplication | null>(null);
    const [currentStep, setCurrentStep] = useState<'review' | 'action'>('review');
    const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(application.status);
    const [feedbackNote, setFeedbackNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
    const [positionQuestions, setPositionQuestions] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen && application) {
            const fetchApplicationDetails = async () => {
                setIsLoading(true);
                try {
                    const data = await applyAPI.getApplicationDetail(application.id);
                    setDetailedApplication(data);

                    if (data.position?.questions) {
                        setPositionQuestions(data.position.questions);
                    } else if (data.application?.position_id) {
                        const position = await applyAPI.getPositionById(data.application.position_id);
                        setPositionQuestions(position.questions || []);
                    }

                    setCurrentStep('review');
                    setSelectedStatus(application.status);
                    setFeedbackNote(application.feedback_note || '');
                    setCurrentResponseIndex(0);
                } catch (error) {
                    console.error('Error fetching application details:', error);
                    toast.error('Failed to load application details');
                } finally {
                    setIsLoading(false);
                }
            };

            fetchApplicationDetails();
        }
    }, [isOpen, application]);

    const handleSubmitReview = async () => {
        if (!application) return;

        setIsSubmitting(true);
        try {
            await onStatusChange(application.id, selectedStatus, feedbackNote);
            toast.success(`Application status updated to ${selectedStatus}`);
            onClose();
        } catch (error) {
            console.error('Error updating application status:', error);
            toast.error('Failed to update application status');
        } finally {
            setIsSubmitting(false);
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

    const calculateTimeSpent = (seconds?: number) => {
        if (!seconds) return '-';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes < 1) {
            return `${remainingSeconds} sec`;
        } else if (minutes < 60) {
            return `${minutes} min ${remainingSeconds} sec`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours} hr ${remainingMinutes} min`;
        }
    };

    const getAnswerQuality = (response?: Response | null) => {
        if (!response || !response.answer || response.answer.trim() === '') return 0;

        const answerLength = response.answer.length;
        const timeSpent = response.time_to_answer || 0;

        if (answerLength < 50) return 1;
        if (answerLength < 200 || timeSpent < 60) return 2;
        return 3;
    };

    const getQuestionText = (questionId: string) => {
        const question = positionQuestions.find(q => q.id === questionId);
        return question ? question.title : 'Unknown question';
    };

    const getQuestionDescription = (questionId: string) => {
        const question = positionQuestions.find(q => q.id === questionId);
        return question?.subtitle;
    };

    const isQuestionRequired = (questionId: string) => {
        const question = positionQuestions.find(q => q.id === questionId);
        return question?.required ?? false;
    };

    if (!mounted || !isOpen) return null;

    const currentResponse = detailedApplication?.application?.responses?.[currentResponseIndex];
    const responseCount = detailedApplication?.application?.responses?.length || 0;

    const modalContent = (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-6xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between sticky top-0 bg-black z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                Application Review
                                <ApplicationStatusBadge status={application.status} />
                            </h3>
                            <p className="text-xs text-white/60 mt-0.5">
                                Application #{application.id} for {application.position_title || 'Unknown Position'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
                                <p className="text-white/60">Loading application details...</p>
                            </div>
                        </div>
                    ) : currentStep === 'review' ? (
                        <div className="space-y-8">
                            {/* Applicant Information */}
                            <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/70 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h4 className="text-white font-semibold flex items-center gap-2">
                                        <User className="w-4 h-4 text-purple-400" />
                                        Applicant Information
                                    </h4>
                                </div>
                                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                    <div>
                                        <p className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Name
                                        </p>
                                        <p className="text-white font-medium">
                                            {detailedApplication?.applicant?.display_name || 'Unknown'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Username
                                        </p>
                                        <p className="text-white font-medium">
                                            @{detailedApplication?.applicant?.username || 'Unknown'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Member Since
                                        </p>
                                        <p className="text-white font-medium">
                                            {detailedApplication?.applicant?.member_since
                                                ? formatDate(detailedApplication.applicant.member_since)
                                                : 'Unknown'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Submitted
                                        </p>
                                        <p className="text-white font-medium">
                                            {detailedApplication?.application?.submitted_at
                                                ? formatDate(detailedApplication.application.submitted_at)
                                                : 'Not submitted'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Total Time Spent
                                        </p>
                                        <p className="text-white font-medium">
                                            {calculateTimeSpent(detailedApplication?.application?.time_to_complete)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Question Responses */}
                            <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/70 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                    <h4 className="text-white font-semibold flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-purple-400" />
                                        Responses
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs text-white/60">
                                            {responseCount > 0 ? (
                                                <>
                                                    Response {currentResponseIndex + 1} of {responseCount}
                                                </>
                                            ) : (
                                                'No responses'
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setCurrentResponseIndex(prev => Math.max(0, prev - 1))}
                                                disabled={currentResponseIndex === 0 || responseCount === 0}
                                                className="p-1.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setCurrentResponseIndex(prev => Math.min(responseCount - 1, prev + 1))}
                                                disabled={currentResponseIndex === responseCount - 1 || responseCount === 0}
                                                className="p-1.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {responseCount === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="mx-auto w-14 h-14 bg-zinc-800/20 rounded-lg flex items-center justify-center mb-4">
                                            <AlertCircle className="w-7 h-7 text-yellow-400" />
                                        </div>
                                        <h5 className="text-lg font-semibold text-white mb-2">No Responses Found</h5>
                                        <p className="text-white/60 mb-6 max-w-md mx-auto">
                                            This application doesn't have any responses yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="text-lg font-medium text-white">
                                                Question #{currentResponseIndex + 1}
                                            </h5>
                                            <div className="flex">
                                                {currentResponse && [...Array(3)].map((_, i) => (
                                                    <Sparkles
                                                        key={`quality-star-${i}`}
                                                        className={`w-5 h-5 ${i < getAnswerQuality(currentResponse) ? 'text-purple-400' : 'text-zinc-700'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Question Text - New Addition */}
                                        {currentResponse && (
                                            <div className="mb-4">
                                                <div className="bg-purple-900/10 rounded-lg p-4 border border-purple-800/20">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <HelpCircle className="w-4 h-4 text-purple-400" />
                                                            <span className="text-white font-medium">
                                                                Question
                                                            </span>
                                                        </div>
                                                        {isQuestionRequired(currentResponse.question_id) && (
                                                            <span className="text-xs px-2 py-0.5 bg-purple-900/20 text-purple-400 rounded-full">
                                                                Required
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-white font-medium mb-1">
                                                        {getQuestionText(currentResponse.question_id)}
                                                    </p>
                                                    {getQuestionDescription(currentResponse.question_id) && (
                                                        <p className="text-white/70 text-sm">
                                                            {getQuestionDescription(currentResponse.question_id)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-black/40 rounded-lg p-4 border border-zinc-800/70">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-white/60">
                                                    Time Spent: {calculateTimeSpent(currentResponse?.time_to_answer)}
                                                </span>
                                                <span className="text-xs text-white/60">
                                                    {currentResponse?.answer?.length || 0} characters
                                                </span>
                                            </div>
                                            <div className="text-white whitespace-pre-wrap text-sm">
                                                {currentResponse?.answer || 'No answer provided'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Previous Feedback */}
                            {application.feedback_note && (
                                <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/70 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-zinc-800/50">
                                        <h4 className="text-white font-semibold flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-purple-400" />
                                            Previous Feedback
                                        </h4>
                                    </div>
                                    <div className="p-5">
                                        <div className="bg-black/40 rounded-lg p-4 border border-zinc-800/70">
                                            <p className="text-white/80 text-sm whitespace-pre-wrap">
                                                {application.feedback_note}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/70 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h4 className="text-white font-semibold flex items-center gap-2">
                                        <Info className="w-4 h-4 text-purple-400" />
                                        Update Application Status
                                    </h4>
                                </div>
                                <div className="p-5 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        <button
                                            onClick={() => setSelectedStatus('approved')}
                                            className={`p-4 rounded-lg border flex flex-col justify-between h-24 transition-colors ${selectedStatus === 'approved'
                                                ? 'bg-zinc-800/50 border-purple-500 text-white'
                                                : 'bg-black/30 border-zinc-800/70 text-white/70 hover:bg-zinc-900/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="font-medium">Approved</span>
                                            </div>
                                            <p className="text-xs mt-2 text-left">Accept application</p>
                                        </button>

                                        <button
                                            onClick={() => setSelectedStatus('rejected')}
                                            className={`p-4 rounded-lg border flex flex-col justify-between h-24 transition-colors ${selectedStatus === 'rejected'
                                                ? 'bg-zinc-800/50 border-purple-500 text-white'
                                                : 'bg-black/30 border-zinc-800/70 text-white/70 hover:bg-zinc-900/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <XCircle className="w-4 h-4" />
                                                <span className="font-medium">Rejected</span>
                                            </div>
                                            <p className="text-xs mt-2 text-left">Decline application</p>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/70 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h4 className="text-white font-semibold flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-purple-400" />
                                        Feedback Note
                                    </h4>
                                </div>
                                <div className="p-5">
                                    <textarea
                                        value={feedbackNote}
                                        onChange={(e) => setFeedbackNote(e.target.value)}
                                        placeholder="Enter feedback for the applicant (optional)..."
                                        className="w-full px-4 py-3 bg-black border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[120px]"
                                    ></textarea>

                                    <div className="mt-3 text-xs text-white/60">
                                        <p>This feedback will be visible to the applicant.</p>

                                        {(selectedStatus === 'approved' || selectedStatus === 'rejected') && (
                                            <div className="mt-3 bg-purple-900/10 border border-purple-800/20 rounded-lg p-3">
                                                <p className="flex items-center gap-1">
                                                    <Info className="w-3 h-3 text-purple-400" />
                                                    <span>
                                                        {selectedStatus === 'approved'
                                                            ? 'Consider providing instructions for next steps.'
                                                            : 'Consider providing constructive feedback on why the application was rejected.'}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-800/50 flex justify-between items-center sticky bottom-0 bg-black">
                    {currentStep === 'review' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => setCurrentStep('action')}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                            >
                                Take Action
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setCurrentStep('review')}
                                className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Review
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Update Status
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}