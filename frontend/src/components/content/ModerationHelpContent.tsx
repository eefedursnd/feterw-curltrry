'use client';

import { useEffect, useState } from 'react';
import {
    Search,
    HelpCircle,
    BookOpen,
    User,
    Shield,
    Award,
    Lock,
    AlertTriangle,
    Info,
    ChevronDown,
    ChevronUp,
    Bookmark,
    RefreshCw,
    BadgeCheck,
    LifeBuoy,
    ShieldQuestion,
    Users,
    UserPlus,
    UserX,
    ShieldOff,
    Key,
    Headphones,
    Link,
    ClipboardCheck,
    ChevronRight
} from 'lucide-react';
import DashboardLayout from 'haze.bio/components/dashboard/Layout';
import { DiscordIcon } from 'haze.bio/socials/Socials';

interface FAQItem {
    question: string;
    answer: React.ReactNode;
    category: string;
    keywords: string[];
}

export default function ModerationHelpContent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>('general');
    const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>([]);

    const faqItems: FAQItem[] = [
        // General Moderation Guidelines
        {
            question: 'What are the core principles of moderation?',
            answer: (
                <div>
                    <p>When moderating on haze.bio, always follow these principles:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Be objective and follow platform rules consistently</li>
                        <li>Document all moderation actions with clear notes</li>
                        <li>Escalate complex cases to head moderators when necessary</li>
                        <li>Respect user privacy while investigating issues</li>
                        <li>Use the least restrictive action needed to address the violation</li>
                    </ul>
                </div>
            ),
            category: 'general',
            keywords: ['guidelines', 'principles', 'rules', 'moderation', 'core']
        },
        {
            question: 'When should I escalate a case to a head moderator?',
            answer: (
                <div>
                    <p>Escalate a case if:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>The situation involves threats, harassment, or legal concerns</li>
                        <li>You're unsure about the correct restriction level</li>
                        <li>The user has a history of complex violations</li>
                        <li>There's a conflict of interest or personal connection</li>
                    </ul>
                    <p className="mt-2 text-zinc-400">When in doubt, it's better to escalate than to act without clarity.</p>
                </div>
            ),
            category: 'general',
            keywords: ['escalate', 'moderator', 'head', 'help', 'complex']
        },
        {
            question: 'What are the different types of restrictions?',
            answer: (
                <div>
                    <p>There are two main types of restrictions:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><span className="font-medium text-red-400">Full Restriction:</span> User cannot access their account at all</li>
                        <li><span className="font-medium text-amber-400">Partial Restriction:</span> User can access basic account functions but cannot modify profile content, add/edit widgets, socials, or badges</li>
                    </ul>
                    <p className="mt-2 text-zinc-400">Choose the appropriate restriction type based on the severity of the violation.</p>
                </div>
            ),
            category: 'general',
            keywords: ['restriction', 'ban', 'partial', 'full', 'types']
        },
        {
            question: 'What are the different staff levels and their permissions?',
            answer: (
                <div>
                    <p>haze.bio has a hierarchical staff structure with distinct permission levels:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><span className="font-medium">Trial Moderator (Level 1):</span> Can view user information, search users, and view reports. Cannot restrict users or unrestrict them.</li>
                        <li><span className="font-medium">Moderator (Level 2):</span> Can do everything a Trial Moderator can do, plus add restrictions to users.</li>
                        <li><span className="font-medium">Head Moderator (Level 3):</span> Can do everything a Moderator can do, plus remove restrictions from users.</li>
                        <li><span className="font-medium">Admin (Level 4):</span> Full access to all moderation features, including staff management.</li>
                    </ul>
                    <p className="mt-2 text-zinc-400">Each level has increasing responsibility and access to sensitive actions.</p>
                </div>
            ),
            category: 'general',
            keywords: ['staff', 'levels', 'permissions', 'hierarchy', 'roles', 'moderator', 'admin', 'trial']
        },
        {
            question: 'Who can remove restrictions from users?',
            answer: (
                <div>
                    <p>Only Head Moderators (Level 3) and Admins (Level 4) can remove restrictions from users.</p>
                    <p className="mt-2 text-zinc-400">This ensures that restrictions are only removed after careful consideration by head staff members.</p>
                </div>
            ),
            category: 'general',
            keywords: ['unrestrict', 'remove', 'ban', 'restriction', 'permissions']
        },

        // Badges & Rewards
        {
            question: 'Who receives the Early User badge?',
            answer: (
                <div>
                    <p>The Early User badge is automatically assigned to users with UID 1-25.</p>
                    <p className="mt-2 text-zinc-400">These badges were distributed to the first 25 users who registered on haze.bio and cannot be manually assigned to other users.</p>
                </div>
            ),
            category: 'badges',
            keywords: ['early', 'badge', 'uid', 'first', 'users']
        },
        {
            question: 'How do users get the Booster badge?',
            answer: (
                <div>
                    <p>To receive the Booster badge, users need to:</p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1">
                        <li>Link their Discord account with haze.bio</li>
                        <li>Boost our Discord server</li>
                    </ol>
                    <p className="mt-2 text-zinc-400">The badge is usually assigned automatically within one minute after boosting. If users report issues with receiving the badge, verify their Discord connection and server boost status before escalating.</p>
                </div>
            ),
            category: 'badges',
            keywords: ['booster', 'badge', 'discord', 'boost', 'server']
        },
        {
            question: 'How do users get Discord roles for their badges?',
            answer: (
                <div>
                    <p>Users automatically receive Discord roles corresponding to their haze.bio badges when they link their Discord account with haze.bio.</p>
                    <p className="mt-2 text-zinc-400">If a user reports missing roles, verify that:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Their Discord account is properly linked</li>
                        <li>They actually have the badges on their haze.bio profile</li>
                        <li>They've waited at least 5 minutes for sync to complete</li>
                    </ul>
                </div>
            ),
            category: 'badges',
            keywords: ['discord', 'roles', 'badges', 'link', 'connect']
        },

        // Account Issues
        {
            question: 'Are secondary accounts allowed?',
            answer: (
                <div>
                    <p>Secondary accounts are permitted with these restrictions:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>They must not be created explicitly to claim a username</li>
                        <li>The profiles must be properly set up and maintained</li>
                        <li>These rules don't apply to users who have purchased premium or other items on their secondary account</li>
                    </ul>
                    <p className="mt-2 text-zinc-400">When evaluating reports about alt accounts, consider the user's intent and whether the accounts are being actively used.</p>
                </div>
            ),
            category: 'accounts',
            keywords: ['alt', 'secondary', 'accounts', 'multiple', 'alt accounts']
        },
        {
            question: 'How do we handle impersonation or fake accounts?',
            answer: (
                <div>
                    <p>If a user is reported for impersonating someone else:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Request proof of the impersonated person’s identity</li>
                        <li>Check for misleading usernames, avatars, or bios</li>
                        <li>Restrict the account if impersonation is confirmed</li>
                        <li>Instruct the impersonated user to claim their identity through a Discord ticket</li>
                    </ul>
                    <p className="mt-2 text-zinc-400">Impersonation is taken seriously and may lead to a full restriction.</p>
                </div>
            ),
            category: 'accounts',
            keywords: ['impersonation', 'fake', 'identity', 'copy', 'scam']
        },
        {
            question: 'Can users delete their account?',
            answer: (
                <div>
                    <p>Yes, users can request account deletion via our Discord support system.</p>
                    <p className="mt-2 text-zinc-400">Upon confirmation, all data will be permanently removed.</p>
                </div>
            ),
            category: 'accounts',
            keywords: ['delete', 'account', 'remove', 'gdpr', 'privacy']
        },
        {
            question: 'What should users do if they can\'t access their account?',
            answer: (
                <div>
                    <p>If a user reports being unable to access their account, instruct them to:</p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1">
                        <li>Create an Account Recovery ticket on our Discord server</li>
                        <li>Provide as much information as possible about the account:</li>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Username</li>
                            <li>Email address</li>
                            <li>Approximate registration date</li>
                            <li>Any premium purchases</li>
                            <li>Badge information</li>
                            <li>Screenshot of profile (if available)</li>
                        </ul>
                    </ol>
                    <p className="mt-2 text-zinc-400">The support team will verify their information and assist with account recovery if the claim is legitimate.</p>
                </div>
            ),
            category: 'accounts',
            keywords: ['recovery', 'access', 'lost', 'password', 'locked', 'can\'t login']
        },

        // Report Handling
        {
            question: 'What information should I include in restriction notes?',
            answer: (
                <div>
                    <p>When adding restriction notes, always include:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>The specific rule violation</li>
                        <li>Evidence of the violation (exact content or description)</li>
                        <li>Any previous warnings or restrictions for similar issues</li>
                        <li>Your reasoning for the chosen restriction type and duration</li>
                    </ul>
                    <p className="mt-2 text-zinc-400">Clear, detailed notes help other moderators understand your decision and ensure consistency in our moderation approach.</p>
                </div>
            ),
            category: 'reports',
            keywords: ['notes', 'restriction', 'documentation', 'evidence', 'reasoning']
        },
        {
            question: 'How should I handle repeat offenders?',
            answer: (
                <div>
                    <p>When a user repeatedly violates rules:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Check for previous warnings and restrictions</li>
                        <li>Increase the restriction severity if previous actions were ineffective</li>
                        <li>Document the escalation clearly in the notes</li>
                        <li>Consider a full restriction for multiple major violations</li>
                    </ul>
                    <p className="mt-2 text-zinc-400">Consistency and fairness are key in dealing with repeat behavior.</p>
                </div>
            ),
            category: 'reports',
            keywords: ['repeat', 'violator', 'ban', 'escalation', 'multiple']
        }

    ];

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredFAQs(faqItems);
        } else {
            const lowerCaseSearch = searchTerm.toLowerCase();
            const filtered = faqItems.filter(faq =>
                faq.question.toLowerCase().includes(lowerCaseSearch) ||
                faq.keywords.some(keyword => keyword.toLowerCase().includes(lowerCaseSearch))
            );
            setFilteredFAQs(filtered);
        }
    }, [searchTerm]);

    const toggleCategory = (category: string) => {
        if (expandedCategory === category) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(category);
        }
    };

    const categories = [
        { id: 'general', name: 'General Moderation Guidelines', icon: <Shield className="w-4 h-4 text-red-400" /> },
        { id: 'badges', name: 'Badges & Rewards', icon: <Award className="w-4 h-4 text-red-400" /> },
        { id: 'accounts', name: 'Account Issues', icon: <User className="w-4 h-4 text-red-400" /> },
        { id: 'reports', name: 'Report Handling', icon: <AlertTriangle className="w-4 h-4 text-red-400" /> }
    ];

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-6">
                {/* Hero Section with Header */}
                <div className="bg-gradient-to-br from-black to-black rounded-xl p-8 border border-zinc-800/80 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_70%)]"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>

                    <div className="relative z-10 max-w-3xl">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                Moderation Help Center
                            </h1>
                            <span className="px-2 py-0.5 bg-red-900/30 border border-red-800/30 rounded-full text-[10px] font-medium text-red-300">
                                STAFF
                            </span>
                        </div>
                        <p className="text-white/70 text-sm md:text-base mb-6">
                            Find answers to common moderation questions and guidelines to help you make consistent decisions.
                        </p>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search for help topics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-lg py-3 pl-10 pr-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500/30"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        </div>
                    </div>
                </div>

                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => {
                                setExpandedCategory(category.id);
                                setSearchTerm('');
                            }}
                            className="bg-black rounded-xl border border-zinc-800 p-4 hover:border-red-500/20 transition-all duration-300 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                    {category.icon}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{category.name}</p>
                                    <p className="text-zinc-400 text-sm">View guides</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - FAQ Categories */}
                    <div className="lg:col-span-2 space-y-5">
                        {searchTerm ? (
                            <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Search className="w-4 h-4 text-red-400" />
                                        Search Results
                                    </h2>
                                </div>

                                <div className="p-5">
                                    {filteredFAQs.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredFAQs.map((faq, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-zinc-900/20 rounded-lg border border-zinc-800/50 overflow-hidden"
                                                >
                                                    <div className="p-4 border-b border-zinc-800/50">
                                                        <h3 className="text-white font-medium flex items-start gap-2">
                                                            <HelpCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                                                            <span>{faq.question}</span>
                                                        </h3>
                                                    </div>
                                                    <div className="p-4 text-zinc-300 text-sm">
                                                        {faq.answer}
                                                    </div>
                                                    <div className="px-4 py-2 bg-zinc-900/40 border-t border-zinc-800/50">
                                                        <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                                                            <Bookmark className="w-3 h-3" />
                                                            Category: {categories.find(c => c.id === faq.category)?.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <Search className="w-10 h-10 text-zinc-700 mb-3" />
                                            <p className="text-zinc-400">No results found for "{searchTerm}"</p>
                                            <p className="text-zinc-500 text-sm mt-1">Try a different search term or browse the categories</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {categories.map((category) => (
                                    <div key={category.id} className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
                                        <button
                                            onClick={() => toggleCategory(category.id)}
                                            className="w-full px-5 py-4 border-b border-zinc-800 flex items-center justify-between"
                                        >
                                            <h2 className="text-white font-semibold flex items-center gap-2">
                                                {category.icon}
                                                {category.name}
                                            </h2>
                                            {expandedCategory === category.id ? (
                                                <ChevronUp className="w-4 h-4 text-zinc-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                                            )}
                                        </button>

                                        {expandedCategory === category.id && (
                                            <div className="p-5 space-y-4">
                                                {filteredFAQs
                                                    .filter(faq => faq.category === category.id)
                                                    .map((faq, index) => (
                                                        <div
                                                            key={index}
                                                            className="bg-zinc-900/20 rounded-lg border border-zinc-800/50 overflow-hidden"
                                                        >
                                                            <div className="p-4 border-b border-zinc-800/50">
                                                                <h3 className="text-white font-medium flex items-start gap-2">
                                                                    <HelpCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                                                                    <span>{faq.question}</span>
                                                                </h3>
                                                            </div>
                                                            <div className="p-4 text-zinc-300 text-sm">
                                                                {faq.answer}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Right Column - Quick Guides & Resources */}
                    <div className="space-y-6">
                        {/* Common Tasks */}
                        <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4 text-red-400" />
                                    Quick Reference
                                </h2>
                            </div>

                            <div className="p-5">
                                <div className="space-y-3">
                                    <div className="bg-zinc-900/20 hover:bg-zinc-800/30 border border-zinc-800/50 hover:border-red-500/30 rounded-lg p-3 transition-colors">
                                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                                            <Shield className="w-4 h-4 text-red-400" />
                                            Restriction Guidelines
                                        </div>
                                        <p className="text-zinc-400 text-xs mt-1">
                                            Full restriction for severe violations, partial for minor issues
                                        </p>
                                    </div>

                                    <div className="bg-zinc-900/20 hover:bg-zinc-800/30 border border-zinc-800/50 hover:border-red-500/30 rounded-lg p-3 transition-colors">
                                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                                            <Award className="w-4 h-4 text-red-400" />
                                            Special Badges
                                        </div>
                                        <p className="text-zinc-400 text-xs mt-1">
                                            Early User (UID 1-25), Booster (Discord server booster)
                                        </p>
                                    </div>

                                    <div className="bg-zinc-900/20 hover:bg-zinc-800/30 border border-zinc-800/50 hover:border-red-500/30 rounded-lg p-3 transition-colors">
                                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                                            <UserPlus className="w-4 h-4 text-red-400" />
                                            Alt Account Policy
                                        </div>
                                        <p className="text-zinc-400 text-xs mt-1">
                                            Allowed if properly set up, not for username squatting
                                        </p>
                                    </div>

                                    <div className="bg-zinc-900/20 hover:bg-zinc-800/30 border border-zinc-800/50 hover:border-red-500/30 rounded-lg p-3 transition-colors">
                                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                                            <DiscordIcon size={14} className="text-[#5865f2]" />
                                            Discord Integration
                                        </div>
                                        <p className="text-zinc-400 text-xs mt-1">
                                            Link Discord for badges, roles, and account recovery
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}