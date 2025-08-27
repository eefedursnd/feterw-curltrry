'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Clock,
    FileText,
    Send,
    Loader2,
    HelpCircle,
    Save,
    AlertTriangle,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Info
} from 'lucide-react';
import { applyAPI } from 'haze.bio/api';
import { Position, Question, ApplicationSession } from 'haze.bio/types/apply';
import { toast } from 'react-hot-toast';

interface ApplicationFormProps {
    positionId: string;
    initialPosition?: Position;
}

const ApplicationForm = ({ positionId, initialPosition }: ApplicationFormProps) => {
    const [session, setSession] = useState<ApplicationSession | null>(null);
    const [position, setPosition] = useState<Position | null>(initialPosition || null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [startTime, setStartTime] = useState(Date.now());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                if (position === null) {
                    toast.error('Position not correctly loaded');
                    return;
                }

                try {
                    const sessionData = await applyAPI.startApplication(positionId);
                    setSession(sessionData);

                    if (sessionData.answers && Object.keys(sessionData.answers).length > 0) {
                        const answeredQuestionIds = Object.keys(sessionData.answers);
                        const nextUnanswered = position.questions.findIndex(
                            q => !answeredQuestionIds.includes(q.id)
                        );

                        if (nextUnanswered === -1) {
                            setCurrentQuestionIndex(position.questions.length);
                        } else {
                            setCurrentQuestionIndex(nextUnanswered);
                        }
                    } else {
                        setCurrentQuestionIndex(0);
                    }
                } catch (error: any) {
                    console.error('Error starting application:', error);

                    if (error.response?.data?.error &&
                        error.response.data.error.includes('already have an active application')) {
                        toast.error('You already have an active application for this position');
                        setTimeout(() => {
                            router.push('/dashboard/applications');
                        }, 2000);
                    } else {
                        toast.error(error.message || 'Failed to start your application');
                    }
                }
            } catch (error) {
                console.error('Error fetching application data:', error);
                toast.error('Failed to load your application');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [positionId, router, initialPosition]);

    useEffect(() => {
        if (session && position && currentQuestionIndex < position.questions.length) {
            const currentQuestion = position.questions[currentQuestionIndex];
            const savedAnswer = session.answers?.[currentQuestion.id] || '';
            setAnswer(savedAnswer);
            setStartTime(Date.now());
        }
    }, [currentQuestionIndex, session, position]);

    useEffect(() => {
        if (textareaRef.current && !isLoading) {
            textareaRef.current.focus();
        }
    }, [currentQuestionIndex, isLoading]);

    const saveAnswer = async () => {
        if (!session || !position) return false;

        const currentQuestion = position.questions[currentQuestionIndex];
        if (!currentQuestion) return false;

        if (currentQuestion.required && (!answer || answer.trim() === '')) {
            toast.error('This question requires an answer');
            return false;
        }

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        try {
            setIsSaving(true);
            const updatedSession = await applyAPI.saveAnswer(
                positionId,
                currentQuestion.id,
                answer,
                timeSpent
            );
            setSession(updatedSession);
            return true;
        } catch (error) {
            console.error('Error saving answer:', error);
            toast.error('Failed to save your answer');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = async () => {
        const saved = await saveAnswer();
        if (saved) {
            setAnswer('');
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prevIndex => prevIndex - 1);
        }
    };

    const handleSubmit = async () => {
        if (!session || !position) return;

        try {
            setIsSubmitting(true);

            const requiredQuestions = position.questions.filter(q => q.required);
            const answeredQuestionIds = Object.keys(session.answers || {});

            const missingRequired = requiredQuestions.filter(
                q => !answeredQuestionIds.includes(q.id) || session.answers?.[q.id] === ''
            );

            if (missingRequired.length > 0) {
                toast.error('Please answer all required questions before submitting');
                setIsSubmitting(false);
                return;
            }

            await applyAPI.submitApplication(positionId);
            toast.success('Application submitted successfully');
            router.push('/dashboard/applications');
        } catch (error) {
            console.error('Error submitting application:', error);
            toast.error('Failed to submit your application');
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateProgress = () => {
        if (!session || !position) return 0;

        const totalRequiredQuestions = position.questions.filter(q => q.required).length;
        const answeredRequiredQuestions = position.questions
            .filter(q => q.required && session.answers?.[q.id])
            .length;

        return Math.round((answeredRequiredQuestions / totalRequiredQuestions) * 100);
    };

    const calculateAnswerQuality = (questionId: string) => {
        if (!session?.answers?.[questionId]) return 0;

        const question = position?.questions.find(q => q.id === questionId);
        if (!question) return 0;

        const answer = session.answers[questionId];
        const timeSpent = session.time_per_question?.[questionId] || 0;

        if (question.input_type === 'long_text') {
            const wordCount = answer.split(/\s+/).filter(Boolean).length;
            const avgTimePerWord = timeSpent / wordCount;

            if (wordCount < 30) return 1;
            if (wordCount < 100) return 2;
            if (avgTimePerWord < 1) return 2;
            return 3;
        } else if (question.input_type === 'short_text') {
            return answer.length > 10 ? 2 : 1;
        } else {
            return answer ? 2 : 0;
        }
    };

    const getQuestionTypeLabel = (inputType: string) => {
        switch (inputType) {
            case 'short_text': return 'Short Text';
            case 'long_text': return 'Long Text';
            case 'select': return 'Selection';
            case 'checkbox': return 'Checkbox';
            default: return 'Question';
        }
    };

    const renderQuestionInput = (question: Question) => {
        switch (question.input_type) {
            case 'short_text':
                return (
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700/50 rounded-lg text-white 
                      text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder={question.subtitle ? `${question.subtitle}...` : 'Type your answer here...'}
                    />
                );

            case 'long_text':
                return (
                    <textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700/50 rounded-lg text-white 
                      text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[120px]"
                        placeholder={question.subtitle ? `${question.subtitle}...` : 'Type your detailed answer here...'}
                    ></textarea>
                );

            case 'select':
                return (
                    <select
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700/50 rounded-lg text-white 
                      text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                    >
                        <option value="">Select an option...</option>
                        {question.options?.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <div className="space-y-2">
                        {question.options?.map((option, index) => {
                            const selectedOptions = answer ? answer.split(',') : [];
                            return (
                                <label key={index} className="flex items-center gap-3 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/70 cursor-pointer hover:bg-zinc-900/60 transition-colors">
                                    <input
                                        type="checkbox"
                                        name={`question-${question.id}`}
                                        value={option}
                                        checked={selectedOptions.includes(option)}
                                        onChange={() => {
                                            let newSelectedOptions = [...selectedOptions];
                                            if (newSelectedOptions.includes(option)) {
                                                newSelectedOptions = newSelectedOptions.filter(item => item !== option);
                                            } else {
                                                newSelectedOptions.push(option);
                                            }
                                            setAnswer(newSelectedOptions.join(','));
                                        }}
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-zinc-700 bg-black"
                                    />
                                    <span className="text-white text-sm">{option}</span>
                                </label>
                            );
                        })}
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700/50 rounded-lg text-white 
                      text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="Type your answer here..."
                    />
                );
        }
    };

    const renderStep = () => {
        if (!position) return null;

        if (currentQuestionIndex >= position.questions.length) {
            return renderReviewStep();
        }

        const currentQuestion = position.questions[currentQuestionIndex];
        const questionNumber = currentQuestionIndex + 1;

        return (
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded-md text-xs font-medium">
                            Question {questionNumber} of {position.questions.length}
                        </div>
                        <div className="text-xs text-white/60">
                            {getQuestionTypeLabel(currentQuestion.input_type)}
                        </div>
                    </div>

                    {currentQuestion.required && (
                        <span className="text-xs text-red-400">Required</span>
                    )}
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-white">{currentQuestion.title}</h2>
                        {currentQuestion.subtitle && (
                            <p className="text-white/70 text-sm">{currentQuestion.subtitle}</p>
                        )}
                    </div>

                    <div className="bg-zinc-900/30 p-5 rounded-lg border border-zinc-800/70">
                        {renderQuestionInput(currentQuestion)}

                        {(currentQuestion.input_type === 'long_text' || currentQuestion.input_type === 'short_text') && (
                            <div className="mt-2 flex items-center justify-end text-xs text-white/60">
                                <div className="flex items-center gap-1">
                                    <span>{answer.length} characters</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                            className="px-4 py-2 bg-zinc-800/50 text-white rounded-lg hover:bg-zinc-700/50 
                       transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => saveAnswer()}
                                disabled={isSaving}
                                className="px-4 py-2 bg-zinc-800/50 text-white rounded-lg hover:bg-zinc-700/50 
                         transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleNext}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg 
                         transition-colors text-sm flex items-center gap-2"
                            >
                                {currentQuestionIndex === position.questions.length - 1 ? 'Review' : 'Next'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderReviewStep = () => {
        if (!position || !session) return null;

        return (
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        Review Your Application
                    </h2>
                    <div className="text-xs text-white/60">
                        Application ID: #{session.application_id}
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-purple-900/10 border border-purple-800/20 rounded-lg p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                        <div>
                            <h3 className="text-white font-medium text-sm">Ready to Submit?</h3>
                            <p className="text-white/70 text-xs mt-1">
                                Please review your answers below before submitting your application. You can go back and edit any answer if needed.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {position.questions.map((question, index) => {
                            const userAnswer = session.answers?.[question.id] || '';
                            const answerQuality = calculateAnswerQuality(question.id);
                            const hasAnswer = userAnswer && userAnswer.trim() !== '';

                            return (
                                <div key={question.id} className="bg-zinc-900/30 rounded-lg border border-zinc-800/70 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-zinc-800/70 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">Question {index + 1}</span>
                                            {question.required && (
                                                <span className="text-xs text-red-400">Required</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {answerQuality > 0 && (
                                                <div className="flex">
                                                    {[...Array(3)].map((_, i) => (
                                                        <Sparkles
                                                            key={i}
                                                            className={`w-4 h-4 ${i < answerQuality ? 'text-purple-400' : 'text-zinc-700'}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setCurrentQuestionIndex(index)}
                                                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                                            >
                                                Edit <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-2">
                                        <h4 className="text-sm font-medium text-white">{question.title}</h4>

                                        <div className="mt-2 p-3 bg-black/40 rounded-lg">
                                            {hasAnswer ? (
                                                <p className="text-sm text-white/80 whitespace-pre-wrap">
                                                    {userAnswer}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-red-400 italic">
                                                    {question.required ? 'Required answer missing' : 'No answer provided'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                        <button
                            onClick={() => setCurrentQuestionIndex(position.questions.length - 1)}
                            className="px-4 py-2 bg-zinc-800/50 text-white rounded-lg hover:bg-zinc-700/50 
                       transition-colors text-sm flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Questions
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || calculateProgress() < 100}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg 
                       transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit Application
                                </>
                            )}
                        </button>
                    </div>

                    {calculateProgress() < 100 && (
                        <div className="bg-red-900/10 border border-red-800/20 rounded-lg p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                            <div>
                                <h3 className="text-red-400 font-medium text-sm">Required Questions Incomplete</h3>
                                <p className="text-white/70 text-xs mt-1">
                                    Please complete all required questions before submitting your application.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderExitConfirmDialog = () => {
        if (!showExitConfirm) return null;

        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
                <div className="bg-black rounded-xl p-6 border border-zinc-800/50 w-full max-w-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-red-800/20 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Exit Application?</h3>
                    </div>

                    <p className="text-white/70 text-sm mb-6">
                        Your progress has been saved, but your application is not submitted yet. You can continue later from your dashboard.
                    </p>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowExitConfirm(false)}
                            className="px-4 py-2 bg-zinc-800/50 text-white rounded-lg hover:bg-zinc-700/50 
                       transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <Link
                            href="/dashboard/applications"
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg
                      transition-colors text-sm"
                        >
                            Exit Application
                        </Link>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen relative flex flex-col">
            {/* Modern Gradient Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute top-0 left-0 right-0 h-[40%] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-purple-900/5 to-transparent"></div>
                <div className="absolute bottom-0 right-0 left-0 h-[30%] bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-purple-800/10 via-purple-900/5 to-transparent"></div>
                <div className="absolute top-[20%] right-[10%] w-[600px] h-[300px] rounded-full bg-purple-900/5 blur-[120px] animate-float-slow"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex-1 container max-w-3xl mx-auto py-12 px-4 sm:px-6">
                {/* Navigation */}
                <div className="mb-6 flex justify-between items-center">
                    <button
                        onClick={() => setShowExitConfirm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 hover:bg-zinc-900 transition-all text-zinc-400 hover:text-white border border-zinc-800/50 hover:border-purple-500/30"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Exit Application
                    </button>

                    {position && (
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50 text-white/70 text-xs">
                                {position.title}
                            </div>

                            <div className="relative w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden min-w-[100px]">
                                <div
                                    className="absolute top-0 left-0 h-full bg-purple-600"
                                    style={{ width: `${calculateProgress()}%` }}
                                ></div>
                            </div>

                            <div className="text-white/70 text-xs">
                                {calculateProgress()}%
                            </div>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800/50">
                            <div className="h-6 w-32 bg-zinc-800/60 animate-pulse rounded"></div>
                        </div>
                        <div className="p-8 flex justify-center items-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                                <p className="text-zinc-400">Loading your application...</p>
                            </div>
                        </div>
                    </div>
                ) : !position ? (
                    <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800/50">
                            <h2 className="text-white font-semibold">Position Not Found</h2>
                        </div>
                        <div className="p-8 text-center">
                            <div className="mx-auto w-16 h-16 bg-red-800/20 rounded-lg flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Position Not Found</h3>
                            <p className="text-white/60 mb-6">
                                We couldn't find the position you're looking for. It may have been removed or is no longer available.
                            </p>
                            <Link
                                href="/applications"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
                            >
                                View Available Positions
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Position Info Card */}
                        <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden mb-6">
                            <div className="px-5 py-4 border-b border-zinc-800/50">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-purple-400" />
                                    Position Information
                                </h2>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-semibold text-white mb-2">{position.title}</h3>
                                <p className="text-white/70 text-sm mb-4">{position.description}</p>

                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/20 text-purple-400 border border-purple-500/20">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {position.questions.length} Questions
                                    </span>

                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-500/20">
                                        <Clock className="w-3 h-3 mr-1" />
                                        ~{Math.ceil(position.questions.length * 1.2)} min
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Render the current step (question or review) */}
                        {renderStep()}

                        {/* Exit Confirmation Dialog */}
                        {renderExitConfirmDialog()}
                    </>
                )}
            </div>

            {/* Footer */}
            <footer className="relative z-10 py-6 border-t border-zinc-800/50 mt-auto">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <p className="text-zinc-500 text-sm">
                        © {new Date().getFullYear()} cutz.lol | All rights reserved
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ApplicationForm;