'use client';

import React, { useEffect, useState } from 'react';
import { Domain, DomainWithDetails, AssignDomainRequest, DomainAssignment } from 'haze.bio/types/domain';
import { domainAPI } from 'haze.bio/api';
import { toast } from 'react-hot-toast';
import {
    AlertCircle,
    CheckCircle,
    Globe,
    Loader2,
    Trash2,
    Zap,
    Shield,
    Copy,
    Star,
    ExternalLink,
    Users,
    Plus,
    Info,
    Sparkles
} from 'lucide-react';
import { differenceInDays, format, parseISO } from 'date-fns';
import RemoveDomainModal from 'haze.bio/components/modals/RemoveDomainModal';
import { useUser } from 'haze.bio/context/UserContext';
import DashboardLayout from '../dashboard/Layout';
import AssignDomainModal from '../modals/AssignDomainModal';
import { PremiumBadge } from 'haze.bio/badges/Badges';
import ExperimentalFeatureModal from '../modals/ExperimentalFeatureModal';

interface DomainsContentProps {
    initialAvailableDomains: Domain[];
    initialUserDomains: DomainWithDetails[];
}

export default function DomainsContent({ initialAvailableDomains, initialUserDomains }: DomainsContentProps) {
    const { user } = useUser();
    const [availableDomains, setAvailableDomains] = useState<Domain[]>(initialAvailableDomains || []);
    const [userDomains, setUserDomains] = useState<DomainWithDetails[]>(initialUserDomains || []);
    const [isLoadingAssign, setIsLoadingAssign] = useState(false);
    const [isLoadingRemove, setIsLoadingRemove] = useState(false);
    const [selectedDomainForAssign, setSelectedDomainForAssign] = useState<Domain | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [domainToRemove, setDomainToRemove] = useState<DomainWithDetails | null>(null);
    //const [showExperimentalModal, setShowExperimentalModal] = useState(false);

    // useEffect(() => {
    //     const hasSeenModal = localStorage.getItem('experimental_custom_domains_seen');
    //     if (!hasSeenModal) {
    //         setShowExperimentalModal(true);
    //     }
    // }, []);

    // const handleAcceptExperiment = () => {
    //     setShowExperimentalModal(false);
    // };

    const [newDomain, setNewDomain] = useState<Partial<Domain>>({
        id: '',
        name: '',
        only_premium: false,
        max_usage: 0,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });
    const [isAddingDomain, setIsAddingDomain] = useState(false);

    const isPremium = user?.has_premium;
    const isAdmin = user?.staff_level === 4;
    const domainLimit = isPremium ? 2 : 1;

    const openAssignModal = (domain: Domain) => {
        if (userDomains.length >= domainLimit) {
            toast.error(`You have reached your limit of ${domainLimit} domain${domainLimit > 1 ? 's' : ''}.`);
            return;
        }
        if (domain.only_premium && !isPremium) {
            toast.error('This domain requires a Premium subscription.');
            return;
        }
        if (domain.max_usage > 0 && domain.current_usage >= domain.max_usage) {
            toast.error('This domain is currently at capacity.');
            return;
        }
        setSelectedDomainForAssign(domain);
        setIsAssignModalOpen(true);
    };

    const handleAssignDomain = async () => {
        if (!selectedDomainForAssign || !user) return;
        if (userDomains.length >= domainLimit) {
            toast.error(`You have reached your limit of ${domainLimit} domain${domainLimit > 1 ? 's' : ''}.`);
            setIsAssignModalOpen(false);
            return;
        }

        setIsLoadingAssign(true);
        const payload: AssignDomainRequest = {
            domain_id: selectedDomainForAssign.id,
        };

        try {
            await domainAPI.assignDomain(payload);

            const assignedDomain = selectedDomainForAssign;

            const newAssignment: DomainAssignment = {
                id: Date.now(),
                uid: user.uid,
                domain_id: assignedDomain.id,
                assigned_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const newUserDomain: DomainWithDetails = {
                assignment: newAssignment,
                domain: { ...assignedDomain, current_usage: assignedDomain.current_usage + 1 },
                is_expiring: isExpiringSoon(assignedDomain.expires_at),
            };

            setUserDomains(prev => [...prev, newUserDomain]);

            setAvailableDomains(prev =>
                prev
                    .map(d =>
                        d.id === assignedDomain.id
                            ? { ...d, current_usage: d.current_usage + 1 }
                            : d
                    )
                    .filter(d => !(d.max_usage > 0 && d.current_usage >= d.max_usage))
            );

            const assignedUrl = getAssignedUrl(assignedDomain.name);
            toast.success(`Successfully assigned ${assignedUrl}`);
            setIsAssignModalOpen(false);
            setSelectedDomainForAssign(null);

        } catch (error: any) {
            toast.error(error.message || 'Failed to assign domain.');
        } finally {
            setIsLoadingAssign(false);
        }
    };

    const openRemoveModal = (domainDetail: DomainWithDetails) => {
        setDomainToRemove(domainDetail);
        setIsRemoveModalOpen(true);
    };

    const handleRemoveDomain = async () => {
        if (!domainToRemove || !user) return;

        setIsLoadingRemove(true);
        try {
            await domainAPI.removeDomain(domainToRemove.domain.id);

            const removedDomainDetail = domainToRemove;
            const removedDomain = removedDomainDetail.domain;

            setUserDomains(prev => prev.filter(d => d.assignment.id !== removedDomainDetail.assignment.id));

            setAvailableDomains(prev => {
                const existingIndex = prev.findIndex(d => d.id === removedDomain.id);
                const updatedDomain = { ...removedDomain, current_usage: Math.max(0, removedDomain.current_usage - 1) };

                const meetsCriteria =
                    parseISO(updatedDomain.expires_at) > new Date() &&
                    (!updatedDomain.only_premium || isPremium) &&
                    (updatedDomain.max_usage === 0 || updatedDomain.current_usage < updatedDomain.max_usage);

                if (existingIndex !== -1) {
                    const newState = [...prev];
                    newState[existingIndex] = updatedDomain;
                    return newState;
                } else if (meetsCriteria) {
                    return [...prev, updatedDomain];
                } else {
                    return prev;
                }
            });

            const removedUrl = getAssignedUrl(removedDomain.name);
            toast.success(`Successfully removed ${removedUrl}`);
            setIsRemoveModalOpen(false);
            setDomainToRemove(null);

        } catch (error: any) {
            toast.error(error.message || 'Failed to remove domain.');
        } finally {
            setIsLoadingRemove(false);
        }
    };

    const handleAddDomain = async () => {
        if (!newDomain.id || !newDomain.name) {
            toast.error('Domain ID and name are required');
            return;
        }

        setIsAddingDomain(true);
        const domainToAdd: Domain = {
            id: newDomain.id,
            name: newDomain.name,
            only_premium: newDomain.only_premium || false,
            max_usage: newDomain.max_usage || 0,
            expires_at: newDomain.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            current_usage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        try {
            await domainAPI.addDomain(domainToAdd);

            setAvailableDomains(prev => [...prev, domainToAdd]);
            toast.success(`Successfully added domain ${domainToAdd.name}`);
            setNewDomain({
                id: '',
                name: '',
                only_premium: false,
                max_usage: 0,
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            });

        } catch (error: any) {
            toast.error(error.message || 'Failed to add domain');
        } finally {
            setIsAddingDomain(false);
        }
    };

    const isExpiringSoon = (expiresAt: string): boolean => {
        try {
            const expiryDate = parseISO(expiresAt);
            const now = new Date();
            return differenceInDays(expiryDate, now) <= 14 && expiryDate > now;
        } catch (e) {
            return false;
        }
    };

    const getExpiryText = (expiresAt: string): string => {
        try {
            const expiryDate = parseISO(expiresAt);
            const now = new Date();
            if (isNaN(expiryDate.getTime())) return "Invalid date";

            if (expiryDate < now) return "Expired";
            const daysLeft = differenceInDays(expiryDate, now);
            if (daysLeft <= 0) return "Expires today";
            if (daysLeft === 1) return "Expires in 1 day";
            return `Expires in ${daysLeft} days`;
        } catch (e) {
            console.error("Error formatting expiry date:", expiresAt, e);
            return "Invalid date";
        }
    };

    const getAssignedUrl = (domainName: string) => {
        const subdomain = user?.alias || user?.username || 'yourname';
        return `${subdomain}.${domainName}`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success('URL copied to clipboard!'))
            .catch(err => toast.error('Failed to copy URL.'));
    };

    const formatDate = (dateString: string): string => {
        try {
            return format(parseISO(dateString), 'MMM d, yyyy');
        } catch (e) {
            return 'Invalid date';
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-8">
                <div className="bg-black rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                    <div className="relative z-10 max-w-3xl">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 flex items-center gap-2">
                            Custom Domains
                        </h1>
                        <p className="text-white/70 text-sm md:text-base">
                            Select a custom domain for your profile. This will create a unique URL that points to your haze.bio profile.
                        </p>
                    </div>
                </div>

                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-zinc-800/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-400" /> Your Selected Domains
                        </h2>
                        {userDomains.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-zinc-800/80 text-zinc-400">
                                {userDomains.length} / {isPremium ? '2' : '1'} selected
                            </span>
                        )}
                    </div>

                    {userDomains.length === 0 ? (
                        <div className="p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-zinc-900/60 mb-4">
                                <Globe className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No domains selected yet</h3>
                            <p className="text-white/60 max-w-md mb-6">
                                Browse the available domains below and select one to assign to your profile.
                            </p>
                            {availableDomains.length > 0 && (
                                <button
                                    onClick={() => document.getElementById('available-domains')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
                                >
                                    View Available Domains
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {userDomains.map((detail) => {
                                    const assignedUrl = getAssignedUrl(detail.domain.name);
                                    const fullUrl = `https://${assignedUrl}`;
                                    const expiringSoon = isExpiringSoon(detail.domain.expires_at);
                                    const expiryText = getExpiryText(detail.domain.expires_at);
                                    const assignedDate = formatDate(detail.assignment.assigned_at);

                                    return (
                                        <div key={detail.assignment.id} className="bg-zinc-900/20 rounded-xl border border-zinc-800/50 overflow-hidden transition-all duration-200 hover:border-purple-800/30 flex flex-col">
                                            <div className="p-4 flex-grow space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-white font-medium">{detail.domain.name}</h3>
                                                    {detail.domain.only_premium && (
                                                        <div className="flex-shrink-0 flex items-center gap-1 text-purple-400 bg-purple-800/20 px-1.5 py-0.5 rounded-full text-xs border border-purple-800/30 ml-2">
                                                            <Star className="w-3 h-3" />
                                                            <span className="font-medium">Premium</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-2 bg-black/60 rounded-lg border border-zinc-800/50 flex items-center">
                                                    <span className="text-white text-sm font-mono truncate mr-2">{fullUrl}</span>
                                                    <div className="ml-auto flex-shrink-0 flex gap-1">
                                                        <button
                                                            onClick={() => copyToClipboard(fullUrl)}
                                                            className="p-1.5 rounded-md hover:bg-zinc-800/80 transition-colors"
                                                            title="Copy URL"
                                                        >
                                                            <Copy className="w-4 h-4 text-purple-400" />
                                                        </button>
                                                        <a
                                                            href={fullUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 rounded-md hover:bg-zinc-800/80 transition-colors"
                                                            title="Visit URL"
                                                        >
                                                            <ExternalLink className="w-4 h-4 text-purple-400" />
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-xs text-white/50">
                                                    <span>Assigned: {assignedDate}</span>
                                                    {expiringSoon && (
                                                        <span className="flex items-center text-red-400 gap-1">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            {expiryText}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-4 pt-0 mt-auto flex justify-end">
                                                <button
                                                    onClick={() => openRemoveModal(detail)}
                                                    disabled={isLoadingRemove && domainToRemove?.assignment.id === detail.assignment.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isLoadingRemove && domainToRemove?.assignment.id === detail.assignment.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    )}
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div id="available-domains" className="bg-black/40 backdrop-blur-sm rounded-xl border border-zinc-800/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-400" /> Available Domains
                        </h2>
                        {availableDomains.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-zinc-800/80 text-zinc-400">
                                {availableDomains.length} available
                            </span>
                        )}
                    </div>

                    {availableDomains.length === 0 ? (
                        <div className="p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-zinc-900/60 mb-4">
                                <AlertCircle className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No domains currently available</h3>
                            <p className="text-white/60 max-w-md">
                                Please check back later for new domain options.
                            </p>
                        </div>
                    ) : (
                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableDomains.map((domain) => {
                                    const expiringSoon = isExpiringSoon(domain.expires_at);
                                    const expiryText = getExpiryText(domain.expires_at);
                                    const isAtCapacity = domain.max_usage > 0 && domain.current_usage >= domain.max_usage;
                                    const needsPremium = domain.only_premium && !isPremium;
                                    const hasReachedLimit = userDomains.length >= domainLimit;
                                    const isDisabled = needsPremium || isAtCapacity || hasReachedLimit;

                                    let buttonText = "Select Domain";
                                    let buttonIcon = <CheckCircle className="w-4 h-4" />;
                                    if (needsPremium) {
                                        buttonText = "Premium Required";
                                        buttonIcon = <Star className="w-4 h-4" />;
                                    } else if (isAtCapacity) {
                                        buttonText = "At Capacity";
                                        buttonIcon = <Users className="w-4 h-4" />;
                                    } else if (hasReachedLimit) {
                                        buttonText = "Limit Reached";
                                        buttonIcon = <AlertCircle className="w-4 h-4" />;
                                    }

                                    return (
                                        <div key={domain.id} className={`bg-zinc-900/20 rounded-xl border ${isDisabled ? 'border-zinc-800/50' : 'border-zinc-800/50 hover:border-purple-800/30'} transition-all duration-200 overflow-hidden flex flex-col`}>
                                            <div className="p-4 flex-grow space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-white font-medium">{domain.name}</h3>
                                                    <div className="text-white/60 text-xs font-mono text-right flex-shrink-0 pl-2">
                                                        {getAssignedUrl(domain.name)}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {domain.only_premium && (
                                                        <div className="flex items-center gap-1 text-purple-400 bg-purple-800/20 px-1.5 py-0.5 rounded-full text-xs border border-purple-800/30">
                                                            <Star className="w-3 h-3" />
                                                            <span className="font-medium">Premium</span>
                                                        </div>
                                                    )}
                                                    {domain.max_usage === 0 ? (
                                                        <span className="flex items-center gap-1 text-blue-400 bg-blue-800/20 px-1.5 py-0.5 rounded-full text-xs border border-blue-800/30">
                                                            <Users className="w-3 h-3" />
                                                            <span className="font-medium">Unlimited Usage</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-white/60 bg-zinc-800/80 px-1.5 py-0.5 rounded-full text-xs">
                                                            <Users className="w-3 h-3" />
                                                            <span>{domain.current_usage}/{domain.max_usage} Used</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {domain.max_usage > 0 && (
                                                    <div>
                                                        <div className="w-full bg-zinc-800/80 rounded-full h-1">
                                                            <div
                                                                className={`h-1 rounded-full ${isAtCapacity ? 'bg-red-500' : 'bg-purple-600'}`}
                                                                style={{ width: `${(domain.current_usage / domain.max_usage) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {expiringSoon && (
                                                    <div className="flex items-center text-xs text-red-400 gap-1.5">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        <span>{expiryText}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 pt-0 mt-auto">
                                                <button
                                                    onClick={() => openAssignModal(domain)}
                                                    disabled={isDisabled}
                                                    className={`w-full mt-2 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${isDisabled
                                                        ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                                                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                                                        }`}
                                                >
                                                    {buttonIcon}
                                                    {buttonText}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-800/30 overflow-hidden">
                        <div className="px-5 py-4 border-b border-purple-800/30 bg-purple-900/10 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-400" />
                            <h2 className="text-white font-semibold">Admin: Add New Domain</h2>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                <div className="bg-zinc-900/20 rounded-lg p-4 border border-zinc-800/50">
                                    <label className="block text-sm font-medium text-white/70 mb-2">Domain ID</label>
                                    <input
                                        type="text"
                                        value={newDomain.id}
                                        onChange={(e) => setNewDomain({ ...newDomain, id: e.target.value })}
                                        placeholder="example-com"
                                        className="w-full px-3 py-2 bg-black/40 border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                                    />
                                    <p className="text-xs text-white/50 mt-1.5">Unique identifier (e.g., "example-com")</p>
                                </div>

                                <div className="bg-zinc-900/20 rounded-lg p-4 border border-zinc-800/50">
                                    <label className="block text-sm font-medium text-white/70 mb-2">Domain Name</label>
                                    <input
                                        type="text"
                                        value={newDomain.name}
                                        onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                                        placeholder="example.com"
                                        className="w-full px-3 py-2 bg-black/40 border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                                    />
                                    <p className="text-xs text-white/50 mt-1.5">Full domain name (e.g., "example.com")</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                <div className="bg-zinc-900/20 rounded-lg p-4 border border-zinc-800/50">
                                    <label className="block text-sm font-medium text-white/70 mb-2">Max Usage</label>
                                    <input
                                        type="number"
                                        value={newDomain.max_usage}
                                        onChange={(e) => setNewDomain({ ...newDomain, max_usage: parseInt(e.target.value) || 0 })}
                                        placeholder="0 (unlimited)"
                                        className="w-full px-3 py-2 bg-black/40 border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                                    />
                                    <p className="text-xs text-white/50 mt-1.5">Maximum number of users (0 = unlimited)</p>
                                </div>

                                <div className="bg-zinc-900/20 rounded-lg p-4 border border-zinc-800/50 flex flex-col justify-center">
                                    <label className="block text-sm font-medium text-white/70 mb-2">Restrictions</label>
                                    <div className="flex items-center h-10">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newDomain.only_premium}
                                                onChange={(e) => setNewDomain({ ...newDomain, only_premium: e.target.checked })}
                                                className="w-4 h-4 text-purple-600 bg-zinc-800 border-zinc-700 rounded focus:ring-purple-500 focus:ring-offset-black"
                                            />
                                            <span className="text-sm text-white">Premium users only</span>
                                            <div className="flex items-center gap-1 text-purple-400 bg-purple-800/20 px-1.5 py-0.5 rounded-full text-xs border border-purple-800/30 ml-1">
                                                <Star className="w-3 h-3" />
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleAddDomain}
                                    disabled={isAddingDomain || !newDomain.id || !newDomain.name}
                                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-900/20"
                                >
                                    {isAddingDomain ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" /> Add Domain
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AssignDomainModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                domain={selectedDomainForAssign}
                username={user?.username || ''}
                alias={user?.alias || ''}
                onSubmit={handleAssignDomain}
                isLoading={isLoadingAssign}
            />

            <RemoveDomainModal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                domainDetail={domainToRemove}
                username={user?.username || ''}
                alias={user?.alias || ''}
                onSubmit={handleRemoveDomain}
                isLoading={isLoadingRemove}
            />

            {/* <ExperimentalFeatureModal
                featureKey="custom_domains"
                featureName="Custom Domains"
                description="Use custom domain names that point to your profile, making it easier for others to find and remember your link."
                onAccept={handleAcceptExperiment}
                onClose={() => setShowExperimentalModal(false)}
                isOpen={showExperimentalModal}
            /> */}
        </DashboardLayout>
    );
}