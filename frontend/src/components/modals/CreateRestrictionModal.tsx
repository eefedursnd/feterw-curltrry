'use client';

import React, { useState, useEffect } from 'react';
import {
    ShieldAlert,
    Ban,
    X,
    Search,
    Clock,
    AlertCircle,
    Loader2,
    ChevronRight,
    Check,
    User as UserIcon,
    ArrowRight,
    ArrowLeft,
    Clock4,
    Shield,
    FileCheck,
    Info,
    BookTemplate,
    Star
} from 'lucide-react';
import { User } from 'haze.bio/types';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { punishAPI } from 'haze.bio/api';
import { PremiumBadge } from 'haze.bio/badges/Badges';

interface CreateRestrictionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preselectedUser?: User | null;
}

interface RestrictionData {
    userId: number;
    username: string;
    reason: string;
    templateId: string;
    details: string;
    duration: number;
    restrictType: 'full' | 'partial';
}

const CreateRestrictionModal: React.FC<CreateRestrictionModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    preselectedUser = null
}) => {
    const [currentStep, setCurrentStep] = useState(preselectedUser ? 1 : 0);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Array<any>>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [selectedUser, setSelectedUser] = useState<any>(preselectedUser);
    const [restrictionData, setRestrictionData] = useState<RestrictionData | null>(null);
    const [restrictionTemplates, setRestrictionTemplates] = useState<any[]>([]);

    const steps = [
        { title: "Select User", description: "Find the user you want to restrict" },
        { title: "Choose Template", description: "Select a restriction template" },
        { title: "Set Duration", description: "Define how long the restriction lasts" },
        { title: "Add Details", description: "Add detailed notes for this restriction" },
        { title: "Review & Confirm", description: "Review the restriction details" }
    ];

    useEffect(() => {
        if (preselectedUser && !restrictionData) {
            setSelectedUser(preselectedUser);
            setRestrictionData({
                userId: preselectedUser.uid,
                username: preselectedUser.username,
                reason: '',
                templateId: '',
                details: '',
                duration: 24,
                restrictType: 'full'
            });
        }
    }, [preselectedUser, restrictionData]);

    useEffect(() => {
        if (isOpen) {
            loadPunishmentTemplates();
        }
    }, [isOpen]);

    const loadPunishmentTemplates = async () => {
        try {
            const response = await punishAPI.getPunishmentTemplates();
            if (response) {
                setRestrictionTemplates(response);
            }
        } catch (error) {
            console.error('Error loading punishment templates:', error);
            toast.error('Failed to load punishment templates');
        }
    };

    const handleSearchUser = async () => {
        if (!searchTerm || searchTerm.length < 3) {
            toast.error('Please enter at least 3 characters to search');
            return;
        }

        setIsSearching(true);

        try {
            const results = await punishAPI.searchUsersForModeration(searchTerm);
            setSearchResults(results || []);
        } catch (error) {
            console.error('Error searching users:', error);
            toast.error('Error searching users');
        } finally {
            setIsSearching(false);
        }
    };

    const handleUserSelect = (user: any) => {
        setSelectedUser(user);

        setRestrictionData({
            userId: user.uid,
            username: user.username,
            reason: '',
            templateId: '',
            details: '',
            duration: 24,
            restrictType: 'full'
        });

        setCurrentStep(1);
    };

    const handleTemplateSelect = (templateId: string) => {
        const template = restrictionTemplates.find(t => t.id === templateId);

        if (template && restrictionData) {
            setRestrictionData({
                ...restrictionData,
                templateId,
                reason: template.id === 'custom' ? '' : template.name,
                duration: template.defaultDuration || 24
            });
            // Move to next step
            setCurrentStep(2);
        }
    };

    const handleDurationChange = (duration: number) => {
        if (restrictionData) {
            setRestrictionData({
                ...restrictionData,
                duration
            });
        }
    };

    const handleRestrictionTypeSelect = (type: 'full' | 'partial') => {
        if (restrictionData) {
            setRestrictionData({
                ...restrictionData,
                restrictType: type
            });
        }
    };

    const handleDetailsChange = (details: string) => {
        if (restrictionData) {
            setRestrictionData({
                ...restrictionData,
                details
            });
        }
    };

    const handleRestrictUser = async () => {
        if (!restrictionData || !restrictionData.templateId || !restrictionData.details) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (restrictionData.templateId === 'custom' && !restrictionData.reason) {
            toast.error('Please provide a custom reason');
            return;
        }

        setIsProcessing(true);

        try {
            await punishAPI.restrictUser({
                userId: restrictionData.userId,
                templateId: restrictionData.templateId,
                reason: restrictionData.reason,
                details: restrictionData.details,
                duration: restrictionData.duration,
                restrictType: restrictionData.restrictType
            });

            setIsProcessing(false);
            setShowSuccess(true);

            // Wait a bit before closing to show success state
            setTimeout(() => {
                if (onSuccess) onSuccess();
                handleReset();
                onClose();
            }, 1500);

        } catch (error) {
            console.error('Error restricting user:', error);
            toast.error('Failed to restrict user');
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setSelectedUser(null);
        setRestrictionData(null);
        setSearchTerm('');
        setSearchResults([]);
        setShowSuccess(false);
        setCurrentStep(0);
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

    const getTemplate = () => {
        if (!restrictionData?.templateId) return null;
        return restrictionTemplates.find(t => t.id === restrictionData.templateId);
    };

    const canProceedToNext = () => {
        switch (currentStep) {
            case 0: // Select User
                return !!selectedUser;
            case 1: // Choose Template
                return !!restrictionData?.templateId;
            case 2: // Set Duration
                return true; // Duration always has a default value
            case 3: // Add Details
                return !!restrictionData?.details && restrictionData.details.length >= 10;
            case 4: // Review & Confirm
                return !isProcessing && !!restrictionData?.templateId && !!restrictionData?.details &&
                    (restrictionData.templateId !== 'custom' || !!restrictionData.reason);
            default:
                return false;
        }
    };

    const formatDuration = (hours: number) => {
        if (hours < 0) return "Permanent";
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} day${days > 1 ? 's' : ''}`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''}`;
        const months = Math.floor(days / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-md overflow-hidden">
                {/* Header with progress indicator */}
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                            <ShieldAlert className="w-4 h-4 text-purple-400" />
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
                    {showSuccess ? (
                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-5 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-purple-800/20 rounded-full flex items-center justify-center mb-3">
                                <Check className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-base font-semibold text-white mb-2">User Restricted</h3>
                            <p className="text-sm text-white/60 max-w-xs">
                                {selectedUser?.username} has been successfully restricted from the platform.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Step 0: User Selection */}
                            {currentStep === 0 && (
                                <>
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <UserIcon className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white mb-1">Search for User</h4>
                                                <p className="text-xs text-white/60 mb-3">
                                                    Enter a username to find the user you want to restrict.
                                                </p>
                                                
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Search by username..."
                                                            className="w-full bg-black/50 border border-zinc-800/50 rounded-lg py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/30"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                                        />
                                                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                                                    </div>
                                                    <button
                                                        onClick={handleSearchUser}
                                                        disabled={isSearching}
                                                        className="bg-zinc-800/70 hover:bg-zinc-700/50 disabled:opacity-50 text-white text-sm px-3 py-2 rounded-lg border border-zinc-800/50 flex items-center gap-1.5"
                                                    >
                                                        {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                                        Search
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {isSearching ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 size={24} className="animate-spin text-purple-400" />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {searchResults.length > 0 ? (
                                                <>
                                                    <div className="text-xs text-white/50 mb-1 ml-1">
                                                        {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
                                                    </div>
                                                    {searchResults.map((user) => (
                                                        <button
                                                            key={user.uid}
                                                            className="w-full bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-800/50 hover:border-purple-500/20 rounded-lg p-3 cursor-pointer transition-colors flex items-center justify-between"
                                                            onClick={() => handleUserSelect(user)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                                                                    <Image
                                                                        src={user.profile?.avatar_url || "https://cdn.cutz.lol/default_avatar.jpeg"}
                                                                        alt={user.username}
                                                                        width={40}
                                                                        height={40}
                                                                        className="object-cover"
                                                                        draggable="false"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="text-white font-medium text-sm flex items-center gap-1.5">
                                                                        @{user.username}
                                                                        {user.has_premium && <Star className="w-4 h-4 text-purple-400" />}
                                                                    </p>
                                                                    <p className="text-white/40 text-xs">{user.display_name}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-xs text-white/40 bg-black/30 px-2 py-1 rounded">UID: {user.uid}</div>
                                                                <ChevronRight size={16} className="text-white/40" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </>
                                            ) : searchTerm.length > 0 ? (
                                                <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-8 text-center">
                                                    <UserIcon className="mx-auto h-8 w-8 text-white/30 mb-2" />
                                                    <p className="text-white/80 text-sm font-medium">No users found</p>
                                                    <p className="text-white/40 text-xs mt-1">Try a different search term</p>
                                                </div>
                                            ) : (
                                                <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-8 text-center">
                                                    <Search className="mx-auto h-8 w-8 text-white/30 mb-2" />
                                                    <p className="text-white/80 text-sm font-medium">Search for a user</p>
                                                    <p className="text-white/40 text-xs mt-1">Enter username or UID</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Step 1: Template Selection */}
                            {currentStep === 1 && (
                                <>
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <UserIcon className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-white mb-1">
                                                    Selected User
                                                </h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                                                        <Image
                                                            src={selectedUser.profile?.avatar_url || "https://cdn.cutz.lol/default_avatar.jpeg"}
                                                            alt={selectedUser.username}
                                                            width={32}
                                                            height={32}
                                                            className="object-cover"
                                                            draggable="false"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-white font-medium text-sm">@{selectedUser.username}</span>
                                                            {selectedUser.has_premium && 
                                                                <Star className="w-4 h-4 text-purple-400" />
                                                            }
                                                        </div>
                                                        <div className="text-xs text-white/40">UID: {selectedUser.uid}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <BookTemplate className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white mb-1">
                                                    Select Restriction Template
                                                </h4>
                                                <p className="text-xs text-white/60 mb-3">
                                                    Choose a template that best describes the reason for restriction.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 mt-3">
                                            {restrictionTemplates.map(template => (
                                                <button
                                                    key={template.id}
                                                    className={`w-full p-3 text-left rounded-lg border flex items-center gap-3 transition-all 
                                                        ${restrictionData?.templateId === template.id
                                                            ? 'bg-zinc-800/50 border-purple-500/20 text-white'
                                                            : 'bg-black/50 border-zinc-800/50 hover:bg-zinc-800/30 text-white/80'}`}
                                                    onClick={() => handleTemplateSelect(template.id)}
                                                >
                                                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <BookTemplate className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{template.name}</div>
                                                        <div className="text-xs text-white/50 mt-0.5">{template.description}</div>
                                                    </div>
                                                    <ChevronRight size={16} className={restrictionData?.templateId === template.id ? "text-purple-400" : "text-white/40"} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 2: Duration Selection */}
                            {currentStep === 2 && (
                                <>
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <BookTemplate className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white mb-1">
                                                    Selected Template
                                                </h4>
                                                <p className="text-xs text-white/60">
                                                    {getTemplate()?.name}
                                                </p>
                                                <p className="text-xs text-white/40 mt-1">
                                                    {getTemplate()?.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Clock4 className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="w-full">
                                                <h4 className="text-sm font-medium text-white mb-1">
                                                    Set Restriction Duration
                                                </h4>
                                                <p className="text-xs text-white/60 mb-3">
                                                    Define how long this restriction will remain active.
                                                </p>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-white">
                                                        {restrictionData?.duration === -1 ? 'Permanent' : formatDuration(restrictionData?.duration || 0)}
                                                    </span>
                                                    {restrictionData?.templateId === 'scam' && (
                                                        <span className="text-xs bg-purple-900/20 text-purple-400 px-2 py-0.5 rounded">
                                                            Scam violations are always permanent
                                                        </span>
                                                    )}
                                                </div>

                                                <select
                                                    value={restrictionData?.duration || 24}
                                                    onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                                                    disabled={restrictionData?.templateId === 'scam'}
                                                    className="w-full mt-2 bg-black/50 border border-zinc-800/50 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-purple-500/30"
                                                >
                                                    <option value="1">1 hour</option>
                                                    <option value="6">6 hours</option>
                                                    <option value="12">12 hours</option>
                                                    <option value="24">24 hours</option>
                                                    <option value="48">2 days</option>
                                                    <option value="72">3 days</option>
                                                    <option value="168">1 week</option>
                                                    <option value="336">2 weeks</option>
                                                    <option value="720">30 days</option>
                                                    <option value="-1">Permanent</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Shield className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="w-full">
                                                <h4 className="text-sm font-medium text-white mb-1">
                                                    Restriction Type
                                                </h4>
                                                <p className="text-xs text-white/60 mb-3">
                                                    Choose how limited the user's access will be.
                                                </p>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        className={`p-3 text-center rounded-lg border transition-all
                                                            ${restrictionData?.restrictType === 'full'
                                                                ? 'bg-zinc-800/50 border-purple-500/20 text-white'
                                                                : 'bg-black/50 border-zinc-800/50 hover:bg-zinc-800/30 text-white/80'}`}
                                                        onClick={() => handleRestrictionTypeSelect('full')}
                                                    >
                                                        <div className="font-medium text-sm">Full Restriction</div>
                                                        <div className="text-xs mt-1 text-white/50">Block all platform access</div>
                                                    </button>

                                                    <button
                                                        className={`p-3 text-center rounded-lg border transition-all
                                                            ${restrictionData?.restrictType === 'partial'
                                                                ? 'bg-zinc-800/50 border-purple-500/20 text-white'
                                                                : 'bg-black/50 border-zinc-800/50 hover:bg-zinc-800/30 text-white/80'}`}
                                                        onClick={() => handleRestrictionTypeSelect('partial')}
                                                    >
                                                        <div className="font-medium text-sm">Partial Restriction</div>
                                                        <div className="text-xs mt-1 text-white/50">Limit specific features</div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 3: Details Entry */}
                            {currentStep === 3 && (
                                <>
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Info className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white mb-1">
                                                    Restriction Summary
                                                </h4>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                                    <div>
                                                        <p className="text-xs text-white/40 mb-0.5">User</p>
                                                        <p className="text-sm text-white">@{selectedUser.username}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white/40 mb-0.5">Template</p>
                                                        <p className="text-sm text-white">{getTemplate()?.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white/40 mb-0.5">Duration</p>
                                                        <p className="text-sm text-white">{formatDuration(restrictionData?.duration || 0)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white/40 mb-0.5">Type</p>
                                                        <p className="text-sm text-white">{restrictionData?.restrictType === 'full' ? 'Full Restriction' : 'Partial Restriction'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <FileCheck className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white">Detailed Notes</h4>
                                                <p className="text-xs text-white/60 mt-1">
                                                    These notes will only be visible to staff members, not to the user.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <textarea
                                            className="w-full bg-black/50 border border-zinc-800/50 rounded-lg py-3 px-3 text-sm text-white placeholder-white/30 min-h-[120px] focus:outline-none focus:border-purple-500/30 resize-none"
                                            placeholder="Provide specific details about this restriction including evidence, context, and justification..."
                                            value={restrictionData?.details || ''}
                                            onChange={(e) => handleDetailsChange(e.target.value)}
                                        />
                                        
                                        <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                                            <Info size={12} />
                                            <span>Minimum 10 characters required</span>
                                        </div>
                                    </div>

                                    {restrictionData?.templateId === 'custom' && (
                                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <BookTemplate className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-white">Custom Reason</h4>
                                                    <p className="text-xs text-white/60 mt-1">
                                                        This reason will be shown to the user.
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <input
                                                type="text"
                                                className="w-full bg-black/50 border border-zinc-800/50 rounded-lg py-2 px-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/30"
                                                placeholder="Enter custom restriction reason"
                                                value={restrictionData?.reason || ''}
                                                onChange={(e) => setRestrictionData(restrictionData ? {
                                                    ...restrictionData,
                                                    reason: e.target.value
                                                } : null)}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Step 4: Review & Confirm */}
                            {currentStep === 4 && (
                                <>
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <UserIcon className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-white mb-1">
                                                    User to be Restricted
                                                </h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                                                        <Image
                                                            src={selectedUser.profile?.avatar_url || "https://cdn.cutz.lol/default_avatar.jpeg"}
                                                            alt={selectedUser.username}
                                                            width={32}
                                                            height={32}
                                                            className="object-cover"
                                                            draggable="false"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-white font-medium text-sm">@{selectedUser.username}</span>
                                                            {selectedUser.has_premium && 
                                                                <Star className="w-4 h-4 text-purple-400" />
                                                            }
                                                        </div>
                                                        <div className="text-xs text-white/40">UID: {selectedUser.uid}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-zinc-800/50">
                                            <h4 className="text-sm font-medium text-white">Restriction Summary</h4>
                                        </div>

                                        <div className="p-4">
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Type:</span>
                                                    <span className="text-white">
                                                        {restrictionData?.restrictType === 'full' ? 'Full Restriction' : 'Partial Restriction'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Template:</span>
                                                    <span className="text-white">{getTemplate()?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Duration:</span>
                                                    <span className="text-white">{formatDuration(restrictionData?.duration || 0)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/60">Reason:</span>
                                                    <span className="text-white">{restrictionData?.reason || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-zinc-800/50">
                                            <h4 className="text-sm font-medium text-white">Staff Notes</h4>
                                        </div>

                                        <div className="p-4">
                                            <p className="text-sm text-white/80 whitespace-pre-wrap">{restrictionData?.details}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-3">
                                        <AlertCircle size={16} className="text-purple-400 flex-shrink-0" />
                                        <p className="text-xs text-white/60">
                                            This action will be logged and can be reviewed by other staff members.
                                        </p>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!showSuccess && (
                    <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-between bg-black">
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
                                    onClick={handleRestrictUser}
                                    disabled={!canProceedToNext()}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Ban className="w-4 h-4" />
                                            Apply Restriction
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
};

export default CreateRestrictionModal;