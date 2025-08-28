'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCheck, Award, Share2, Clock, Eye, Search, TrendingUp, SlidersHorizontal, Users, Edit, Copy, X, Tag, Filter, Star } from 'lucide-react';
import moment from 'moment';
import Tooltip from '../../ui/Tooltip';
import toast from 'react-hot-toast';
import { Template, User } from 'haze.bio/types';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useUser } from 'haze.bio/context/UserContext';

interface TemplateDiscoveryProps {
    templates: Template[];
    isLoading: boolean;
    onApplyTemplate: (template: Template) => void;
    discoverId?: string | null;
}

type SortOption = 'popular' | 'newest' | 'oldest';
type FilterOption = 'all' | 'premium' | 'standard';

const DEFAULT_AVATAR_URL = "https://cdn.cutz.lol/default-avatar.png";

export default function TemplateDiscovery({
    templates,
    isLoading,
    onApplyTemplate,
    discoverId
}: TemplateDiscoveryProps) {
    const { user: contextUser } = useUser();

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('popular');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(Array.isArray(templates) ? templates : []);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (templates && Array.isArray(templates) && templates.length > 0) {
            const allTags = templates
                .flatMap(template => template.tags || [])
                .filter((tag, index, self) => tag && self.indexOf(tag) === index);
            setAvailableTags(allTags);
        }
    }, [templates]);

    useEffect(() => {
        if (!templates || !Array.isArray(templates)) {
            setFilteredTemplates([]);
            return;
        }
        
        let results = [...templates];

        if (discoverId) {
            results = results.filter(template => template.id === Number(discoverId));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            results = results.filter(template =>
                template.name.toLowerCase().includes(query) ||
                (template.tags && template.tags.some((tag: string) => tag.toLowerCase().includes(query as string)))
            );
        }

        if (filterBy === 'premium') {
            results = results.filter(template => template.premium_required);
        } else if (filterBy === 'standard') {
            results = results.filter(template => !template.premium_required);
        }

        if (selectedTags.length > 0) {
            results = results.filter(template =>
                template.tags && selectedTags.some(tag => template.tags.includes(tag))
            );
        }

        if (sortBy === 'popular') {
            results.sort((a, b) => b.uses - a.uses);
        } else if (sortBy === 'newest') {
            results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === 'oldest') {
            results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }

        setFilteredTemplates(results);
    }, [templates, searchQuery, sortBy, filterBy, selectedTags, discoverId]);

    const handleCopyToClipboard = (template: Template) => {
        const current = new URL(window.location.origin + pathname);
        searchParams.forEach((value, key) => {
            current.searchParams.set(key, value);
        });
        current.searchParams.set('discoverId', String(template.id));
        navigator.clipboard.writeText(current.toString());
        toast.success('Template link copied to clipboard');
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSortBy('popular');
        setFilterBy('all');
        setSelectedTags([]);
    };

    return (
        <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1">
                        <div className="bg-black/40 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-white/50" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search templates by name or tag..."
                                    className="block w-full pl-10 pr-3 py-2.5 bg-transparent text-white 
                                    placeholder-white/40 focus:outline-none text-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="w-full sm:w-48">
                        <div className="bg-black/40 rounded-lg border border-zinc-800/50 hover:border-purple-500/20 transition-all duration-300">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <TrendingUp className="h-4 w-4 text-white/50" />
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="block w-full pl-10 pr-8 py-2.5 bg-transparent text-white 
                                    appearance-none focus:outline-none text-sm cursor-pointer"
                                >
                                    <option value="popular" className="bg-zinc-900">Most Popular</option>
                                    <option value="newest" className="bg-zinc-900">Newest First</option>
                                    <option value="oldest" className="bg-zinc-900">Oldest First</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <SlidersHorizontal className="h-4 w-4 text-white/50" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Button */}
                    <div className="w-full sm:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border transition-colors ${showFilters || selectedTags.length > 0 || filterBy !== 'all'
                                    ? 'bg-purple-600 text-white border-purple-500'
                                    : 'bg-black/40 text-white border-zinc-800/50 hover:border-purple-500/20'
                                }`}
                        >
                            <Filter className="h-4 w-4" />
                            <span className="text-sm">Filters</span>
                            {(selectedTags.length > 0 || filterBy !== 'all') && (
                                <span className="bg-white/20 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {selectedTags.length + (filterBy !== 'all' ? 1 : 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Filter Options */}
                {showFilters && (
                    <div className="bg-black/40 rounded-lg border border-zinc-800/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-medium text-sm">Filters</h3>
                            {(selectedTags.length > 0 || filterBy !== 'all') && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                    Clear all filters
                                </button>
                            )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Template Type */}
                            <div>
                                <label className="block text-white/60 text-xs mb-2">Template Type</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFilterBy('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${filterBy === 'all'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-zinc-800/50 text-white/60 hover:bg-zinc-800/70 hover:text-white'
                                            }`}
                                    >
                                        <Users className="w-3 h-3" />
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilterBy('premium')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${filterBy === 'premium'
                                                ? 'bg-purple-800/40 text-purple-400 border border-purple-800/50'
                                                : 'bg-zinc-800/50 text-white/60 hover:bg-zinc-800/70 hover:text-white'
                                            }`}
                                    >
                                        <Star className="w-3 h-3" />
                                        Premium
                                    </button>
                                    <button
                                        onClick={() => setFilterBy('standard')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${filterBy === 'standard'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-zinc-800/50 text-white/60 hover:bg-zinc-800/70 hover:text-white'
                                            }`}
                                    >
                                        <Tag className="w-3 h-3" />
                                        Standard
                                    </button>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-white/60 text-xs mb-2">
                                    Tags {selectedTags.length > 0 && `(${selectedTags.length} selected)`}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {availableTags && Array.isArray(availableTags) && availableTags.slice(0, 10).map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${selectedTags.includes(tag)
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-zinc-800/50 text-white/60 hover:bg-zinc-800/70 hover:text-white'
                                                }`}
                                        >
                                            {selectedTags.includes(tag) && <CheckCheck className="w-3 h-3" />}
                                            {tag}
                                        </button>
                                    ))}
                                    {availableTags.length > 10 && (
                                        <span className="text-white/40 text-xs px-2 py-1">
                                            +{availableTags.length - 10} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-white/60">
                    {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} found
                </div>
            </div>

            {/* Templates Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                </div>
            ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                                                {filteredTemplates && Array.isArray(filteredTemplates) && filteredTemplates.map(template => (
                        <div
                            key={template.id}
                            className="bg-zinc-800/30 border border-zinc-800/50 rounded-xl hover:border-purple-500/20 hover:bg-zinc-800/40 transition-all duration-300 flex flex-col group"
                        >
                            <div className="relative">
                                {template.banner_url ? (
                                    <div className="relative w-full h-36 overflow-hidden rounded-t-xl">
                                        <Image
                                            src={template.banner_url}
                                            alt="Template Banner"
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            draggable="false"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                ) : (
                                    <div className="w-full h-36 rounded-t-xl bg-gradient-to-br from-purple-900/10 to-black" />
                                )}

                                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Tooltip text="Copy Link">
                                        <button
                                            onClick={() => handleCopyToClipboard(template)}
                                            className="p-1.5 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 rounded-md flex items-center justify-center w-7 h-7 transition-colors"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </Tooltip>
                                    <Tooltip text="Preview">
                                        <a
                                            href={`/${contextUser?.username}?previewTemplateId=${template.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 rounded-md flex items-center justify-center w-7 h-7 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </a>
                                    </Tooltip>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Image
                                            src={template.creator_avatar || DEFAULT_AVATAR_URL}
                                            width={24}
                                            height={24}
                                            alt={`${template.creator_username}'s avatar`}
                                            className="w-6 h-6 rounded-full"
                                            draggable="false"
                                        />
                                        <Link
                                            href={`/${template.creator_username}`}
                                            className="text-white text-sm hover:text-purple-300 transition-colors truncate max-w-[120px]"
                                        >
                                            {template.creator_username}
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5 text-white/60" />
                                        <span className="text-xs text-white/60">{template.uses}</span>
                                    </div>
                                </div>

                                <h3 className="font-medium text-white text-base mb-1.5">{template.name}</h3>

                                {/* Tags and Badge Row */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-3">
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

                                                                                            {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && template.tags.slice(0, 3).map((tag, index) => (
                                        <span
                                            key={index}
                                            className="bg-zinc-800/70 text-white/60 rounded-full px-2 py-0.5 text-xs"
                                        >
                                            {tag}
                                        </span>
                                    ))}

                                    {template.tags && template.tags.length > 3 && (
                                        <span className="text-white/40 text-xs">
                                            +{template.tags.length - 3}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-white/50">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{moment(template.created_at).fromNow()}</span>
                                </div>
                            </div>

                            <div className="mt-auto p-4 pt-3 border-t border-zinc-800/50">
                                <button
                                    onClick={() => onApplyTemplate(template)}
                                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg 
                                    transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Apply Template
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-zinc-800/30 rounded-xl p-8 max-w-md w-full border border-zinc-800/50">
                        <div className="bg-purple-800/20 rounded-full p-4 mb-4 inline-block">
                            <Search className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">No templates found</h3>
                        <p className="text-white/60 mb-6">
                            {searchQuery || selectedTags.length > 0 || filterBy !== 'all' ?
                                `No templates match your current filters` :
                                "No shareable templates are available yet. Check back later or create your own!"
                            }
                        </p>
                        {(searchQuery || selectedTags.length > 0 || filterBy !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}