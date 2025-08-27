'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCheck, Loader2, X, Award, Wand2, Info, ArrowRight, BrushIcon, CheckIcon, Star } from 'lucide-react';
import { User, Template } from 'haze.bio/types';
import { templateAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import { useUser } from 'haze.bio/context/UserContext';
import Image from 'next/image';
import Link from 'next/link';

interface ApplyTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: Template;
    onApplied: () => void;
}

export default function ApplyTemplateModal({
    isOpen,
    onClose,
    template,
    onApplied
}: ApplyTemplateModalProps) {
    const { user: contextUser } = useUser();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [premiumFeatures, setPremiumFeatures] = useState<string[]>([]);
    const [confirmPremium, setConfirmPremium] = useState(false);
    const [attemptedApply, setAttemptedApply] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setError(null);
            setPremiumFeatures([]);
            setConfirmPremium(false);
            setAttemptedApply(false);
            setIsSuccess(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isPremiumTemplate = template.premium_required && !contextUser?.has_premium;

    const handleApply = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const shouldConfirmPremium = isPremiumTemplate ? true : confirmPremium;

            await templateAPI.applyTemplate(template.id, shouldConfirmPremium);
            setIsSuccess(true);
            toast.success('Template applied successfully');
            
            setTimeout(() => {
                onApplied();
                onClose();
            }, 2000);

        } catch (error: any) {
            console.error('Error applying template:', error);

            if (error?.status === 409 && !contextUser?.has_premium) {
                setAttemptedApply(true);
                setError(error.message);

                const message = error.message;
                if (message.includes("premium features that won't be applied:")) {
                    const featuresString = message.split("premium features that won't be applied: ")[1].split('.')[0];
                    setPremiumFeatures(featuresString.split(', '));
                }
            } else {
                toast.error(error?.message || 'Failed to apply template');
                onClose();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPremium = () => {
        setConfirmPremium(true);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0E0E0E]/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                            <Wand2 className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Apply Template</h3>
                            <p className="text-sm text-white/60">Update your profile design</p>
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
                <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {isSuccess ? (
                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-5 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-purple-800/20 rounded-full flex items-center justify-center mb-3">
                                <CheckIcon className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-base font-semibold text-white mb-2">Template Applied</h3>
                            <p className="text-sm text-white/60 max-w-xs">
                                The template "{template.name}" has been successfully applied to your profile.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Template Preview */}
                            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 overflow-hidden">
                                {template.banner_url && (
                                    <div className="relative w-full h-44">
                                        <Image
                                            src={template.banner_url}
                                            alt={template.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            className="object-cover"
                                            draggable="false"
                                        />
                                        {template.premium_required && !contextUser?.has_premium && (
                                            <div className="absolute top-3 right-3 bg-[#0E0E0E]/60 backdrop-blur-md text-xs py-1 px-2 rounded-full flex items-center gap-1.5">
                                                <Star className="w-3.5 h-3.5 text-purple-400" />
                                                <span className="text-white">Premium Template</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="p-4">
                                    <h4 className="text-sm font-medium text-white">{template.name}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                            <Image
                                                src={template.creator_avatar || "https://cdn.haze.bio/default_avatar.jpeg"}
                                                alt={template.creator_username || "Template creator"}
                                                width={20}
                                                height={20}
                                                className="object-cover"
                                                draggable="false"
                                            />
                                        </div>
                                        <p className="text-xs text-white/60">@{template.creator_username || "unknown"}</p>
                                    </div>
                                    {template.tags && template.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {template.tags.map((tag: string, index: number) => (
                                                <span key={index} className="text-[10px] bg-zinc-800/50 text-white/60 px-1.5 py-0.5 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Premium Warning */}
                            {isPremiumTemplate && !attemptedApply && (
                                <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Star className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white mb-1">Premium Template</h4>
                                            <p className="text-sm text-white/60 mb-3">
                                                This template contains premium features that won't be applied to your profile.
                                                The template will still be applied without these features.
                                            </p>
                                            
                                            <Link
                                                href="/pricing"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Star className="w-3.5 h-3.5" />
                                                Upgrade to Premium
                                                <ArrowRight className="w-3 h-3 opacity-70" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Premium Features Warning */}
                            {attemptedApply && premiumFeatures.length > 0 && (
                                <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <AlertTriangle className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white mb-1">Premium Features Detected</h4>
                                            <p className="text-sm text-white/60 mb-2">
                                                This template contains the following premium features that won't be applied:
                                            </p>
                                            
                                            <ul className="list-disc list-inside text-sm text-white/60 space-y-1 mb-3">
                                                {premiumFeatures.map((feature, index) => (
                                                    <li key={index}>{feature}</li>
                                                ))}
                                            </ul>
                                            
                                            <div className="flex flex-col space-y-2">
                                                <Link
                                                    href="/pricing"
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Star className="w-3.5 h-3.5" />
                                                    Upgrade to Premium
                                                </Link>
                                                
                                                <button
                                                    onClick={handleConfirmPremium}
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white/70 rounded-lg transition-colors text-sm"
                                                >
                                                    Continue without premium features
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* General Information */}
                            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <BrushIcon className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-white mb-1">Apply "{template.name}"</h4>
                                        <p className="text-sm text-white/60">
                                            You're about to apply this template to your profile. This will update your profile design with the settings from this template.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="flex items-center gap-2 bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-3">
                                <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <p className="text-sm text-white/60">
                                    Applying this template will override your current profile design settings. This action cannot be undone.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isSuccess && !attemptedApply && (
                    <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-between">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        
                        <button
                            onClick={handleApply}
                            disabled={isLoading}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" />
                                    Apply Template
                                </>
                            )}
                        </button>
                    </div>
                )}
                
                {/* Footer for attempted apply with premium features */}
                {!isSuccess && attemptedApply && !confirmPremium && (
                    <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                
                {/* Footer for confirmed premium features */}
                {!isSuccess && attemptedApply && confirmPremium && (
                    <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-between">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        
                        <button
                            onClick={handleApply}
                            disabled={isLoading}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" />
                                    Apply Without Premium Features
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}