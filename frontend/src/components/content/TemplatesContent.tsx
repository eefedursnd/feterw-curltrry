'use client';

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    Palette,
    Wand2,
    Share2,
    X,
    Copy,
    Clock,
    Award,
    Eye,
    CheckCheck,
    AlertTriangle,
    Search,
    TrendingUp,
    Filter,
    Users,
    SlidersHorizontal,
    Edit,
    Link,
    Star,
    ChevronRight,
    ArrowRight,
    Info,
    Plus,
    Settings
} from 'lucide-react';
import { User, Template } from '../../types';
import toast from 'react-hot-toast';
import { templateAPI } from '../../api';
import DashboardLayout from '../dashboard/Layout';
import moment from 'moment';
import CreateTemplateModal from '../modals/CreateTemplateModal';
import ApplyTemplateModal from '../modals/ApplyTemplateModal';
import TemplateDiscovery from './templates/TemplateDiscovery';
import Tooltip from '../ui/Tooltip';
import { PremiumBadge } from '../../badges/Badges';
import EditTemplateModal from '../modals/EditTemplateModal';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useUser } from 'haze.bio/context/UserContext';

interface TemplatesContentProps {
    initialTemplates: Template[];
    initialShareableTemplates?: Template[];
}

const TEMPLATE_LIMITS = {
    regular: 2,
    premium: 5
};

export default function TemplatesContent({ initialTemplates, initialShareableTemplates = [] }: TemplatesContentProps) {
    const { user: contextUser, updateUser } = useUser();

    const [templates, setTemplates] = useState<Template[]>(Array.isArray(initialTemplates) ? initialTemplates : []);
    const [shareableTemplates, setShareableTemplates] = useState<Template[]>(Array.isArray(initialShareableTemplates) ? initialShareableTemplates : []);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'my-templates' | 'discover'>('discover');
    const [isLoadingShareable, setIsLoadingShareable] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const discoverId = searchParams.get('discoverId');

    useEffect(() => {
        if (shareableTemplates.length === 0) {
            loadShareableTemplates();
        }
    }, [shareableTemplates]);

    const loadShareableTemplates = async () => {
        if (isLoadingShareable) return;

        try {
            setIsLoadingShareable(true);
            const templates = await templateAPI.getShareableTemplates();
            setShareableTemplates(templates);
        } catch (error) {
            console.error("Error loading shareable templates:", error);
            toast.error("Failed to load template gallery");
        } finally {
            setIsLoadingShareable(false);
        }
    };

    const templateLimit = contextUser?.has_premium ? TEMPLATE_LIMITS.premium : TEMPLATE_LIMITS.regular;
    const canCreateTemplate = (templates?.length || 0) < templateLimit;

    const handleApplyTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setIsApplyModalOpen(true);
    };

    const handleDeleteTemplate = (templateId: number) => {
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        setTemplates(updatedTemplates);

        handleCloseEditModal();
    };

    const handleOpenEditModal = (template: Template) => {
        setSelectedTemplate(template);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedTemplate(null);
    };

    const handleTemplateUpdated = (updatedTemplate: Template) => {
        if (!templates || !Array.isArray(templates)) return;
        
        const updatedTemplates = templates.map(t =>
            t.id === updatedTemplate.id ? updatedTemplate : t
        );

        setTemplates(updatedTemplates);
    };

    const handleCopyToClipboard = (template: Template) => {
        const current = new URL(window.location.origin + pathname);
        current.searchParams.set('discoverId', String(template.id));
        navigator.clipboard.writeText(current.toString());
        toast.success('Template link copied to clipboard');
    };

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-8 relative">
                {/* Hero Section with Header */}
                <div className="bg-[#0E0E0E] rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>

                    <div className="relative z-10 max-w-3xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">Templates</h1>
                                    <div className="px-3 py-1 bg-purple-900/20 rounded-full border border-purple-800/30 flex items-center gap-1.5">
                                        <Palette className="w-3.5 h-3.5 text-purple-400" />
                                        <span className={`text-sm font-medium ${templates?.length >= templateLimit ? 'text-yellow-300' : 'text-white/80'}`}>
                                            {templates?.length || 0}/{templateLimit}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-white/70 text-sm md:text-base mt-1">
                                    Create, manage, and discover profile templates to customize your profile design.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                disabled={!canCreateTemplate || isRefreshing}
                                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500
                                transition-colors font-medium disabled:opacity-50
                                disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Create
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-2 border-t border-zinc-800/50 pt-4">
                            <button
                                onClick={() => setActiveTab('my-templates')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${activeTab === 'my-templates'
                                        ? 'bg-purple-600 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <Palette className="w-4 h-4" /> My Templates
                            </button>
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${activeTab === 'discover'
                                        ? 'bg-purple-600 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <Search className="w-4 h-4" /> Discover
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'my-templates' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* My Templates */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-purple-400" />
                                        My Templates
                                    </h2>
                                    <span className="text-xs text-white/60">
                                        {templates?.length || 0} {(templates?.length || 0) === 1 ? 'Template' : 'Templates'}
                                    </span>
                                </div>

                                <div className="p-5">
                                    {isRefreshing ? (
                                        <div className="flex justify-center items-center py-12">
                                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                        </div>
                                    ) : templates && Array.isArray(templates) && templates.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {templates.map(template => (
                                                <div
                                                    key={template.id}
                                                    className="bg-zinc-800/30 border border-zinc-800/50 rounded-xl hover:border-purple-500/20 hover:bg-zinc-800/40 transition-all duration-300 flex flex-col"
                                                >
                                                    {/* Banner Image */}
                                                    <div className="relative">
                                                        {template.banner_url ? (
                                                            <div className="relative w-full h-32 overflow-hidden rounded-t-xl">
                                                                <Image
                                                                    src={template.banner_url}
                                                                    alt="Template Banner"
                                                                    fill
                                                                    style={{ objectFit: 'cover' }}
                                                                    className="object-cover"
                                                                    draggable="false"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-32 rounded-t-xl bg-gradient-to-br from-purple-900/10 to-black" />
                                                        )}

                                                        {/* Overlay Actions */}
                                                        <div className="absolute top-3 right-3 flex items-center gap-2">
                                                            <Tooltip text="Copy Link">
                                                                <button
                                                                    onClick={() => handleCopyToClipboard(template)}
                                                                    className="p-1.5 bg-[#0E0E0E]/50 backdrop-blur-sm text-white hover:bg-[#0E0E0E]/70 rounded transition-colors"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip text="Preview">
                                                                <button
                                                                    onClick={() => window.open(`/${contextUser?.username}?previewTemplateId=${template.id}`, '_blank')}
                                                                    className="p-1.5 bg-[#0E0E0E]/50 backdrop-blur-sm text-white hover:bg-[#0E0E0E]/70 rounded transition-colors"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            </Tooltip>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="font-medium text-white text-base">{template.name}</h3>
                                                            <div className="flex items-center gap-1">
                                                                {template.premium_required && (
                                                                    <Tooltip
                                                                        text="<strong>Premium Template</strong><br/>Premium features will be removed for non premium users"
                                                                        html={true}
                                                                        position="top"
                                                                    >
                                                                        <div className="flex items-center gap-1 text-purple-400 bg-purple-800/20 px-1.5 py-0.5 rounded-full text-xs border border-purple-800/30">
                                                                            <Star className="w-3 h-3" />
                                                                            <span className="font-medium">Premium</span>
                                                                        </div>
                                                                    </Tooltip>
                                                                )}
                                                                {template.shareable && (
                                                                    <Tooltip
                                                                        text="<strong>Shareable Template</strong><br/>Template is public and appears in the discovery tab"
                                                                        html={true}
                                                                        position="top"
                                                                    >
                                                                        <div className="flex items-center gap-1 text-white/80 bg-zinc-700/50 px-1.5 py-0.5 rounded-full text-xs">
                                                                            <Share2 className="w-3 h-3" />
                                                                            <span className="font-medium">Public</span>
                                                                        </div>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Stats */}
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 mb-3">
                                                            <div className="flex items-center gap-1">
                                                                <Eye className="w-3.5 h-3.5" />
                                                                {template.uses} {template.uses === 1 ? 'use' : 'uses'}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {moment(template.created_at).fromNow()}
                                                            </div>
                                                        </div>

                                                        {/* Tags */}
                                                        {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                                {template.tags.map((tag, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="bg-zinc-800/70 text-white/80 rounded-full px-2 py-0.5 text-xs"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer Actions */}
                                                    <div className="mt-auto p-4 pt-3 border-t border-zinc-800/50">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => handleOpenEditModal(template)}
                                                                className="px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleApplyTemplate(template)}
                                                                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                                                            >
                                                                <CheckCheck className="w-4 h-4" />
                                                                Apply
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 px-4 bg-zinc-800/20 rounded-lg border border-zinc-800/40 text-center">
                                            <div className="w-16 h-16 rounded-full bg-purple-800/15 flex items-center justify-center mb-4">
                                                <Palette className="w-7 h-7 text-purple-400" />
                                            </div>
                                            <h3 className="text-white font-medium text-lg mb-2">No templates yet</h3>
                                            <p className="text-white/60 text-sm max-w-md mb-5">
                                                Create your first template to save your current profile design and
                                                apply it anytime or share it with others.
                                            </p>
                                            <button
                                                onClick={() => setIsCreateModalOpen(true)}
                                                disabled={!canCreateTemplate}
                                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create Template
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Template Tips */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Info className="w-4 h-4 text-purple-400" />
                                        Template Tips
                                    </h2>
                                </div>
                                <div className="p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <div className="flex items-start gap-3 mb-1">
                                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Share2 className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-white">Share Your Designs</h3>
                                                    <p className="text-xs text-white/60 mt-1">
                                                        Make your templates public to share with the community and showcase your creativity.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <div className="flex items-start gap-3 mb-1">
                                                <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <CheckCheck className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-white">Switch Anytime</h3>
                                                    <p className="text-xs text-white/60 mt-1">
                                                        Create multiple templates to quickly switch between different profile designs based on your mood.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Side Content */}
                        <div className="space-y-6">
                            {/* Template Options */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-purple-400" />
                                        Template Options
                                    </h2>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="text-sm text-white/80">
                                        Templates limit: <span className="font-medium">{templateLimit}</span>
                                    </div>
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <p className="text-xs text-white/60">
                                            {contextUser?.has_premium ? (
                                                "You have a premium account with expanded template limits."
                                            ) : (
                                                "Upgrade to premium for expanded template limits and extra features."
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        disabled={!canCreateTemplate}
                                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create New Template
                                    </button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Settings className="w-4 h-4 text-purple-400" />
                                        Quick Actions
                                    </h2>
                                </div>
                                <div className="divide-y divide-zinc-800/50">
                                    <button
                                        onClick={() => setActiveTab('discover')}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Search className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-medium text-white">Discover Templates</span>
                                            <span className="text-xs text-white/60">Browse community templates</span>
                                        </div>
                                    </button>

                                    <Link
                                        href={`/${contextUser?.username}`}
                                        target="_blank"
                                        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Eye className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-medium text-white">View Profile</span>
                                            <span className="text-xs text-white/60">See how your profile looks</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            {/* Template Stats Card */}
                            {templates && templates.length > 0 && (
                                <div className="bg-[#0E0E0E] rounded-lg border border-zinc-800/50 relative overflow-hidden p-5">
                                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                                    <div className="relative">
                                        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-purple-400" />
                                            Template Stats
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-3 text-center">
                                                <div className="text-2xl font-bold text-white mb-1">
                                                    {templates.reduce((sum, template) => sum + template.uses, 0)}
                                                </div>
                                                <div className="text-xs text-white/60">Total Uses</div>
                                            </div>
                                            <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-3 text-center">
                                                <div className="text-2xl font-bold text-white mb-1">
                                                    {templates.filter(t => t.shareable).length}
                                                </div>
                                                <div className="text-xs text-white/60">Public Templates</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Discovery View */}
                        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Search className="w-4 h-4 text-purple-400" />
                                    Discover Templates
                                </h2>
                                <div className="text-sm text-white/60">
                                    Browse templates created by the community
                                </div>
                            </div>

                            <div className="p-5">
                                {isLoadingShareable ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                    </div>
                                ) : (
                                    <TemplateDiscovery
                                        templates={shareableTemplates}
                                        isLoading={isLoadingShareable}
                                        onApplyTemplate={handleApplyTemplate}
                                        discoverId={discoverId}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="bg-[#0E0E0E] rounded-xl border border-zinc-800/50 overflow-hidden p-6 relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.15),transparent_70%)]"></div>

                            <div className="relative flex flex-col md:flex-row gap-6 items-center">
                                <div className="w-16 h-16 bg-purple-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Palette className="w-8 h-8 text-purple-400" />
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white mb-2">Looking for inspiration?</h3>
                                    <p className="text-white/70 mb-0 md:mb-0 max-w-2xl">
                                        Browse the template discovery to find designs that match your style, or create your own template to share with the community.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    disabled={!canCreateTemplate}
                                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Template
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Template Modal */}
            <CreateTemplateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={(newTemplate: Template) => {
                    setTemplates([newTemplate, ...(templates || [])]);
                    if (newTemplate.shareable) {
                        setShareableTemplates([newTemplate, ...(shareableTemplates || [])]);
                    }
                    setIsCreateModalOpen(false);
                }}
            />

            {/* Apply Template Modal */}
            {selectedTemplate && (
                <ApplyTemplateModal
                    isOpen={isApplyModalOpen}
                    onClose={() => setIsApplyModalOpen(false)}
                    template={selectedTemplate}
                    onApplied={() => {
                        if (activeTab === 'my-templates' && templates && Array.isArray(templates)) {
                            setTemplates(templates.map(t =>
                                t.id === selectedTemplate.id
                                    ? { ...t, uses: t.uses + 1 }
                                    : t
                            ));
                        }
                        setIsApplyModalOpen(false);
                    }}
                />
            )}

            {/* Edit Template Modal */}
            {selectedTemplate && (
                <EditTemplateModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    template={selectedTemplate}
                    onTemplateUpdated={handleTemplateUpdated}
                    onDeleted={() => handleDeleteTemplate(selectedTemplate.id)}
                />
            )}
        </DashboardLayout>
    );
}