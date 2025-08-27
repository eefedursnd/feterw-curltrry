'use client';

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    X,
    Tag as TagIcon,
    Wand2,
    AlertTriangle,
    Trash2,
    Share2,
    CheckIcon,
    BrushIcon,
    RefreshCw,
    InfoIcon,
    PencilIcon,
    Settings,
    Award
} from 'lucide-react';
import { User, Template } from 'haze.bio/types';
import { templateAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import { useUser } from 'haze.bio/context/UserContext';
import Image from 'next/image';
import { PremiumBadge } from 'haze.bio/badges/Badges';

interface EditTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: Template;
    onTemplateUpdated: (template: Template) => void;
    onDeleted: () => void;
}

export default function EditTemplateModal({
    isOpen,
    onClose,
    template,
    onTemplateUpdated,
    onDeleted,
}: EditTemplateModalProps) {
    const { user: contextUser } = useUser();

    const [name, setName] = useState(template.name);
    const [tags, setTags] = useState<string[]>(template.tags);
    const [currentTag, setCurrentTag] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [overwriteDesign, setOverwriteDesign] = useState(false);
    const [isShareable, setIsShareable] = useState(template.shareable);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (template) {
            setName(template.name);
            setTags(template.tags);
            setIsShareable(template.shareable);
        }
    }, [template]);

    useEffect(() => {
        if (!isOpen) {
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
            setIsSuccess(false);
            setSuccessMessage('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleUpdate = async () => {
        if (name.length < 3) {
            toast.error('Template name must be at least 3 characters long');
            return;
        }

        try {
            setIsLoading(true);

            const updateData: Partial<Template> = {
                name: name,
                shareable: isShareable,
                tags: tags,
            };

            if (overwriteDesign) {
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

                updateData.template_data = JSON.stringify(profileData);
            }

            await templateAPI.updateTemplate(template.id, updateData, overwriteDesign);
            const updatedTemplate = { ...template, ...updateData };

            setIsSuccess(true);
            setSuccessMessage('Template updated successfully');
            toast.success('Template updated successfully');

            setTimeout(() => {
                onTemplateUpdated(updatedTemplate as Template);
                onClose();
            }, 2000);
        } catch (error: any) {
            console.error('Error updating template:', error);
            toast.error(error?.message || 'Failed to update template');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== template.name) {
            return;
        }

        try {
            setIsLoading(true);
            await templateAPI.deleteTemplate(template.id);

            setIsSuccess(true);
            setSuccessMessage('Template deleted successfully');
            toast.success('Template deleted successfully');

            setTimeout(() => {
                onDeleted();
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
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
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0E0E0E]/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                            <PencilIcon className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">Edit Template</h3>
                            <p className="text-xs text-white/60">Update template settings</p>
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
                            <h3 className="text-base font-semibold text-white mb-2">{successMessage}</h3>
                            <p className="text-sm text-white/60 max-w-xs">
                                {successMessage.includes('updated')
                                    ? 'Your template has been successfully updated.'
                                    : 'Your template has been successfully deleted.'}
                            </p>
                        </div>
                    ) : showDeleteConfirm ? (
                        <div className="space-y-5">
                            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-amber-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-white mb-1">Confirm Deletion</h4>
                                        <p className="text-xs text-white/60 mb-3">
                                            This action cannot be undone. This template will be permanently deleted.
                                        </p>

                                        <div className="p-3 bg-[#0E0E0E]/50 rounded-lg border border-zinc-800/50 mb-3">
                                            <p className="text-xs text-white/80">
                                                To confirm, please type <span className="font-medium text-white">{template.name}</span> below:
                                            </p>
                                        </div>

                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            placeholder={`Type ${template.name} to confirm`}
                                            className="w-full bg-[#0E0E0E]/50 border border-zinc-800/50 rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-3">
                                <InfoIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <p className="text-xs text-white/60">
                                    Deleting this template will not affect any profiles that have already applied it.
                                </p>
                            </div>
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
                                    </div>
                                )}
                                <div className="p-4">
                                    <h4 className="text-sm font-medium text-white">{template.name}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                                            <Image
                                                src={contextUser?.profile?.avatar_url || "https://cdn.cutz.lol/default_avatar.jpeg"}
                                                alt={contextUser?.username || "You"}
                                                width={20}
                                                height={20}
                                                className="object-cover"
                                                draggable="false"
                                            />
                                        </div>
                                        <p className="text-xs text-white/60">@{contextUser?.username}</p>
                                    </div>
                                    {tags && tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {tags.map((tag: string, index: number) => (
                                                <span key={index} className="text-[10px] bg-zinc-800/50 text-white/60 px-1.5 py-0.5 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Template Basic Info */}
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

                            {/* Template Tags */}
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
                                                <TagIcon className="w-4 h-4" />
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

                            {/* Advanced Settings */}
                            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Settings className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div className="w-full">
                                        <h4 className="text-sm font-medium text-white mb-1">Advanced Settings</h4>
                                        <p className="text-xs text-white/60 mb-3">
                                            Manage template visibility and design.
                                        </p>

                                        <div className="space-y-4">
                                            {/* Shareable Toggle */}
                                            {contextUser?.has_premium && (
                                                <div className="flex items-center justify-between p-3 bg-[#0E0E0E]/50 rounded-lg border border-zinc-800/50">
                                                    <div className="flex items-center gap-2">
                                                        <Share2 className="w-4 h-4 text-purple-400" />
                                                        <div>
                                                            <div className="text-sm text-white">Make Public</div>
                                                            <div className="text-xs text-white/50">Allow others to discover and use this template</div>
                                                        </div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isShareable}
                                                            onChange={() => setIsShareable(!isShareable)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-[#0E0E0E]/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white/80 after:border-zinc-800/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-800/20"></div>
                                                    </label>
                                                </div>
                                            )}

                                            {/* Shareable Premium Lock */}
                                            {!contextUser?.has_premium && (
                                                <div className="flex items-center justify-between p-3 bg-[#0E0E0E]/50 rounded-lg border border-zinc-800/50">
                                                    <div className="flex items-center gap-2">
                                                        <Share2 className="w-4 h-4 text-purple-400" />
                                                        <div>
                                                            <div className="text-sm text-white">Make Public</div>
                                                            <div className="text-xs text-white/50">Allow others to discover and use this template</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <PremiumBadge size={16} />
                                                        <span className="text-xs text-purple-300">Premium</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Update Design Toggle */}
                                            <div className="flex items-center justify-between p-3 bg-[#0E0E0E]/50 rounded-lg border border-zinc-800/50">
                                                <div className="flex items-center gap-2">
                                                    <RefreshCw className="w-4 h-4 text-purple-400" />
                                                    <div>
                                                        <div className="text-sm text-white">Update Design</div>
                                                        <div className="text-xs text-white/50">Use your current profile design for this template</div>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={overwriteDesign}
                                                        onChange={() => setOverwriteDesign(!overwriteDesign)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-[#0E0E0E]/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white/80 after:border-zinc-800/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-800/20"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </div>
                                    <div className="w-full">
                                        <h4 className="text-sm font-medium text-white mb-1">Danger Zone</h4>
                                        <p className="text-xs text-white/60 mb-3">
                                            These actions cannot be undone.
                                        </p>

                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full px-4 py-2.5 border border-red-900/30 bg-red-950/10 hover:bg-red-950/20 text-red-400 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Template
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isSuccess && (
                    <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-between bg-[#0E0E0E]">
                        {showDeleteConfirm ? (
                            <>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleDelete}
                                    disabled={deleteConfirmText !== template.name || isLoading}
                                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 disabled:opacity-50 disabled:hover:bg-red-600/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Delete Forever
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleUpdate}
                                    disabled={isLoading || name.length < 3}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckIcon className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}