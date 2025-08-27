'use client';

import { Loader2, Tag, Wand2, X, Upload, ArrowRight, ArrowLeft, Check, BrushIcon, InfoIcon, EyeIcon, Tag as TagIcon, PaletteIcon, Star } from 'lucide-react';
import { Template, User } from 'haze.bio/types';
import toast from 'react-hot-toast';
import { templateAPI } from 'haze.bio/api';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useFileUpload } from '../FileUpload';
import { useUser } from 'haze.bio/context/UserContext';

interface CreateTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (template: Template) => void;
}

export default function CreateTemplateModal({ isOpen, onClose, onCreated }: CreateTemplateModalProps) {
    const { user: contextUser } = useUser();
    const [currentStep, setCurrentStep] = useState(0);
    const [name, setName] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bannerUrl, setBannerUrl] = useState<string | undefined>(undefined);
    const [isSuccess, setIsSuccess] = useState(false);

    const steps = [
        { title: "Upload Banner", description: "Add a visual preview for your template" },
        { title: "Basic Info", description: "Set name and tags for your template" },
        { title: "Review & Create", description: "Finalize your template" }
    ];

    const handleBannerUpload = (url: string) => {
        setBannerUrl(url);
    };

    const { openFileUploadDialog, isUploading, uploadProgress } = useFileUpload(
        handleBannerUpload,
        { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
        'template_preview',
        undefined,
        bannerUrl
    );

    const addCacheBuster = (url: string) => {
        if (!url) return '';
        return `${url}?${new Date().getTime()}`;
    };

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (name.length < 3) {
            toast.error('Template name must be at least 3 characters long');
            return;
        }

        if (!bannerUrl) {
            toast.error('Please upload a template banner');
            return;
        }

        try {
            setIsLoading(true);

            const profileData: any = {
                avatar_url: contextUser?.profile.avatar_url,
                background_url: contextUser?.profile.background_url,
                audio_url: contextUser?.profile.audio_url,
                cursor_url: contextUser?.profile.cursor_url,
                banner_url: contextUser?.profile.banner_url,
                background_color: contextUser?.profile.background_color,
                text_color: contextUser?.profile.text_color,
                accent_color: contextUser?.profile.accent_color,
                icon_color: contextUser?.profile.icon_color,
                badge_color: contextUser?.profile.badge_color,
                gradient_from_color: contextUser?.profile.gradient_from_color,
                gradient_to_color: contextUser?.profile.gradient_to_color,
                page_transition: contextUser?.profile.page_transition,
                page_transition_duration: contextUser?.profile.page_transition_duration,
                text_font: contextUser?.profile.text_font,
                avatar_shape: contextUser?.profile.avatar_shape,
                template: contextUser?.profile.template,
                monochrome_icons: contextUser?.profile.monochrome_icons,
                monochrome_badges: contextUser?.profile.monochrome_badges,
                hide_joined_date: contextUser?.profile.hide_joined_date,
                hide_views_count: contextUser?.profile.hide_views_count,
                card_opacity: contextUser?.profile.card_opacity,
                card_blur: contextUser?.profile.card_blur,
                card_border_radius: contextUser?.profile.card_border_radius,
                parallax_effect: contextUser?.profile.parallax_effect,
                layout_max_width: contextUser?.profile.layout_max_width,
                username_effects: contextUser?.profile.username_effects,
                background_effects: contextUser?.profile.background_effects,
                cursor_effects: contextUser?.profile.cursor_effects,
                glow_username: contextUser?.profile.glow_username,
                glow_badges: contextUser?.profile.glow_badges,
                glow_socials: contextUser?.profile.glow_socials,
                show_widgets_outside: contextUser?.profile.show_widgets_outside,
                views_animation: contextUser?.profile.views_animation,
            };

            const template = await templateAPI.createTemplate({
                name,
                tags,
                template_data: JSON.stringify(profileData),
                shareable: false,
                banner_url: bannerUrl
            });

            setIsSuccess(true);
            toast.success('Template created successfully');

            setTimeout(() => {
                onCreated(template);
                setName('');
                setTags([]);
                setCurrentTag('');
                setBannerUrl(undefined);
                setIsSuccess(false);
                setCurrentStep(0);
                onClose();
            }, 2000);
        } catch (error: any) {
            console.error('Error creating template:', error);
            toast.error(error?.message || 'Failed to create template');
        } finally {
            setIsLoading(false);
        }
    };

    const addTag = () => {
        if (currentTag && !tags.includes(currentTag) && tags.length < 5) {
            setTags([...tags, currentTag]);
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag: string) => tag !== tagToRemove));
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
            case 0: // Upload Banner
                return !!bannerUrl && !isUploading;
            case 1: // Basic Info
                return name.length >= 3;
            case 2: // Review & Create
                return !isLoading && !!name && name.length >= 3 && !!bannerUrl;
            default:
                return false;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0E0E0E]/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
                {/* Header with progress indicator */}
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                            <Wand2 className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">{steps[currentStep].title}</h3>
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
                        className="h-full bg-purple-600/50 transition-all duration-300"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {isSuccess ? (
                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-5 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-purple-800/20 rounded-full flex items-center justify-center mb-3">
                                <Check className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-base font-semibold text-white mb-2">Template Created</h3>
                            <p className="text-sm text-white/60 max-w-xs">
                                Your template "{name}" has been successfully created.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Step 0: Upload Banner */}
                            {currentStep === 0 && (
                                <>
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <PaletteIcon className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white mb-1">Template Banner</h4>
                                                <p className="text-xs text-white/60 mb-3">
                                                    Upload an image that showcases your template design. This will be displayed in the template gallery.
                                                </p>

                                                <div
                                                    className={`relative w-full h-40 overflow-hidden rounded-lg cursor-pointer 
                                                        ${!bannerUrl ? 'border-2 border-dashed border-zinc-700 hover:border-purple-600/50 bg-[#0E0E0E]/30' : 'bg-[#0E0E0E]/30'}`}
                                                    onClick={openFileUploadDialog}
                                                >
                                                    {bannerUrl ? (
                                                        <>
                                                            <Image
                                                                src={addCacheBuster(bannerUrl)}
                                                                alt="Template Banner Preview"
                                                                fill
                                                                style={{ objectFit: 'cover' }}
                                                                className="object-cover"
                                                                draggable="false"
                                                            />
                                                            <div className="absolute inset-0 bg-[#0E0E0E]/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <Upload className="w-8 h-8 text-white" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-full gap-2">
                                                            <Upload className="w-8 h-8 text-white/30" />
                                                            <span className="text-sm text-white/50">Click to upload banner</span>
                                                            <span className="text-xs text-white/30">PNG, JPG, WEBP up to 2MB</span>
                                                        </div>
                                                    )}
                                                    {isUploading && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#0E0E0E]/40">
                                                            <div
                                                                className="h-full bg-purple-600/50 transition-all duration-300"
                                                                style={{ width: `${uploadProgress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <InfoIcon className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white mb-1">Template Tip</h4>
                                                <p className="text-xs text-white/60">
                                                    For the best presentation, use an image that shows your profile design clearly. Recommended size: 1200×630 pixels.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 1: Basic Info */}
                            {currentStep === 1 && (
                                <>
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <BrushIcon className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="w-full">
                                                <h4 className="text-sm font-medium text-white mb-1">Template Name</h4>
                                                <p className="text-xs text-white/60 mb-3">
                                                    Choose a descriptive name for your template.
                                                </p>

                                                <input
                                                    type="text"
                                                    className="w-full bg-[#0E0E0E]/50 border border-zinc-800/50 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/30"
                                                    placeholder="e.g., Neon Glow Theme"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    maxLength={50}
                                                />
                                                <p className="text-xs text-white/40 mt-1">
                                                    {name.length}/50 characters
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <TagIcon className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="w-full">
                                                <h4 className="text-sm font-medium text-white mb-1">Template Tags</h4>
                                                <p className="text-xs text-white/60 mb-3">
                                                    Add tags to help others find your template (optional).
                                                </p>

                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-grow bg-[#0E0E0E]/50 border border-zinc-800/50 rounded-lg py-2 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/30"
                                                        placeholder="Add a tag"
                                                        value={currentTag}
                                                        onChange={(e) => setCurrentTag(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addTag}
                                                        disabled={!currentTag || tags.length >= 5}
                                                        className="px-3 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 disabled:opacity-50 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center"
                                                    >
                                                        <Tag className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {tags.map((tag: string, index: number) => (
                                                            <div
                                                                key={index}
                                                                className="bg-[#0E0E0E]/50 text-white/80 border border-zinc-800/50 px-2 py-1 rounded-full flex items-center gap-1.5"
                                                            >
                                                                <span className="text-xs">{tag}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTag(tag)}
                                                                    className="text-white/60 hover:text-white"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-xs text-white/40 mt-2">
                                                    {tags.length}/5 tags
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 2: Review & Create */}
                            {currentStep === 2 && (
                                <>
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <EyeIcon className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white mb-1">Preview</h4>
                                                <p className="text-xs text-white/60 mb-3">
                                                    Review how your template will appear in the gallery.
                                                </p>

                                                <div className="bg-[#0E0E0E]/50 border border-zinc-800/50 rounded-lg overflow-hidden">
                                                    {bannerUrl && (
                                                        <div className="relative w-full h-32">
                                                            <Image
                                                                src={addCacheBuster(bannerUrl)}
                                                                alt={name || "Template Preview"}
                                                                fill
                                                                style={{ objectFit: 'cover' }}
                                                                className="object-cover"
                                                                draggable="false"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="p-3">
                                                        <h5 className="text-sm font-medium text-white">{name || "Untitled Template"}</h5>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                                                                <Image
                                                                    src={contextUser?.profile.avatar_url || "https://cdn.cutz.lol/default_avatar.jpeg"}
                                                                    alt={contextUser?.username || "User"}
                                                                    width={20}
                                                                    height={20}
                                                                    className="object-cover"
                                                                    draggable="false"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <p className="text-xs text-white/60">@{contextUser?.username}</p>
                                                                {contextUser?.has_premium && (
                                                                    <Star className="w-3 h-3 text-purple-400" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        {tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {tags.map((tag, index) => (
                                                                    <span key={index} className="text-[10px] bg-zinc-800/50 text-white/60 px-1.5 py-0.5 rounded">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <InfoIcon className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white mb-1">Template Details</h4>

                                                <div className="space-y-2 mt-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-white/60">Name:</span>
                                                        <span className="text-xs text-white">{name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-white/60">Tags:</span>
                                                        <span className="text-xs text-white">
                                                            {tags.length > 0 ? tags.join(', ') : 'None'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-white/60">Visibility:</span>
                                                        <span className="text-xs text-white">Private</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-3">
                                        <InfoIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                        <p className="text-xs text-white/60">
                                            This template will save your current profile design settings.
                                            {contextUser?.has_premium ? " As a premium user, you can make it shareable after creation." : ""}
                                        </p>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isSuccess && (
                                                <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-between bg-[#0E0E0E]">
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
                                    onClick={handleCreate}
                                    disabled={!canProceedToNext()}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4" />
                                            Create Template
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