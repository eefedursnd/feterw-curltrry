'use client';

import React, { useState } from 'react';
import {
  Flag,
  X,
  AlertTriangle,
  Loader2,
  Check,
  Info,
  Ban,
  FileWarning,
  Shield,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { User } from 'haze.bio/types';
import toast from 'react-hot-toast';
import { punishAPI } from 'haze.bio/api';
import { useRouter } from 'next/navigation';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUsername: string;
  currentUser: User | null;
}

const reportReasons = [
  {
    id: 'spam',
    name: 'Spam',
    description: 'Misleading content or excessive self-promotion',
    icon: <Info className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'inappropriate',
    name: 'Inappropriate Content',
    description: 'Content that violates community guidelines',
    icon: <AlertTriangle className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'harassment',
    name: 'Harassment',
    description: 'Bullying or targeted harassment',
    icon: <Ban className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'impersonation',
    name: 'Impersonation',
    description: 'False representation of identity',
    icon: <Shield className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'scam',
    name: 'Scam or Fraud',
    description: 'Deceptive activities or false claims',
    icon: <FileWarning className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Something else not listed here',
    icon: <Flag className="w-4 h-4 text-purple-400" />,
  },
];

export default function ReportModal({ isOpen, onClose, reportedUsername, currentUser }: ReportModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const steps = [
    { title: "Select Reason", description: "Why are you reporting this user?" },
    { title: "Add Details", description: "Provide more information about your report" },
    { title: "Review & Submit", description: "Review your report before submitting" }
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for your report');
      return;
    }

    if (!currentUser) {
      toast.error('You need to be logged in to report a user');
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await punishAPI.createReport({
        reportedUsername: reportedUsername,
        reason: reportReasons.find(r => r.id === selectedReason)?.name || selectedReason,
        details: details.trim() || "",
      });

      toast.success('Report submitted successfully');
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setSelectedReason('');
        setDetails('');
        setCurrentStep(0);
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const errorMessage = error.message || 'Failed to submit report. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // Select Reason
        return !!selectedReason;
      case 1: // Add Details
        return true; // Details are optional
      case 2: // Review & Submit
        return !isSubmitting && !!selectedReason;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
      <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
        {/* Header with progress indicator */}
        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <Flag className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Report @{reportedUsername}</h3>
              <p className="text-xs text-white/60">{steps[currentStep].description}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-zinc-800/50">
          <div
            className="h-full bg-purple-600 transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {isSuccess ? (
            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-5 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-purple-800/20 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Report Submitted</h3>
              <p className="text-sm text-white/60 max-w-xs">
                Thank you for helping keep our community safe. We'll review your report.
              </p>
            </div>
          ) : !currentUser ? (
            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Authentication Required</h4>
                  <p className="text-xs text-white/60 mb-4">
                    You need to be logged in to report a user. Please sign in to continue with your report.
                  </p>
                  <button
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/${reportedUsername}`)}&report=true`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-xs font-medium"
                  >
                    Sign in to continue
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Step 0: Select Reason */}
              {currentStep === 0 && (
                <>
                  <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white mb-1">Report Information</h4>
                        <p className="text-xs text-white/60">
                          All reports are confidential and will be reviewed by our moderation team. Please select the main reason for your report.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {reportReasons.map((reason) => (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`w-full flex items-center p-3 rounded-lg border text-left ${
                          selectedReason === reason.id
                            ? 'bg-purple-800/10 border-purple-800/30'
                            : 'bg-black/30 border-zinc-800/50 hover:bg-zinc-800/20'
                        }`}
                      >
                        <div className={`w-8 h-8 ${selectedReason === reason.id ? 'bg-purple-800/20' : 'bg-black/30'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          {reason.icon}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">{reason.name}</div>
                          <div className="text-xs text-white/60 mt-0.5">{reason.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 1: Add Details */}
              {currentStep === 1 && (
                <>
                  <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        {reportReasons.find(r => r.id === selectedReason)?.icon || <Flag className="w-4 h-4 text-purple-400" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white mb-1">
                          Reporting for: {reportReasons.find(r => r.id === selectedReason)?.name}
                        </h4>
                        <p className="text-xs text-white/60">
                          {reportReasons.find(r => r.id === selectedReason)?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileCheck className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">Additional Details</h4>
                        <p className="text-xs text-white/60 mt-1">
                          Please provide any specific details that might help us understand the issue better.
                        </p>
                      </div>
                    </div>
                    
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Describe the issue in detail (optional)..."
                      className="w-full bg-black/50 border border-zinc-800/50 p-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/30 rounded-lg resize-none h-24"
                    />
                  </div>
                </>
              )}

              {/* Step 2: Review & Submit */}
              {currentStep === 2 && (
                <>
                  <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <UserCheck className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white mb-1">Review Report</h4>
                        <p className="text-xs text-white/60">
                          Please review your report details before submitting.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800/50">
                      <h4 className="text-sm font-medium text-white">Report Summary</h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-white/60">Reporting user:</span>
                          <span className="text-sm text-white font-medium">@{reportedUsername}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-white/60">Reason:</span>
                          <span className="text-sm text-white font-medium">
                            {reportReasons.find(r => r.id === selectedReason)?.name}
                          </span>
                        </div>
                        
                        {details && (
                          <div className="pt-3 border-t border-zinc-800/50">
                            <div className="text-sm text-white/60 mb-1">Additional details:</div>
                            <p className="text-sm text-white whitespace-pre-wrap bg-black/50 p-3 rounded-lg border border-zinc-800/50">{details}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-amber-900/10 border border-amber-900/30 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <p className="text-xs text-white/60">
                      Submitting false reports may result in actions against your account. Please ensure your report is accurate and honest.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && currentUser && (
          <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-between">
            <div>
              {currentStep > 0 ? (
                <button
                  onClick={goToPreviousStep}
                  className="px-3 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
            
            <div>
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={goToNextStep}
                  disabled={!canProceedToNext()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedToNext()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}