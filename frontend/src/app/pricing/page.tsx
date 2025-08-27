'use client';

import { ArrowRight, ArrowLeft, Check, Sparkles, Shield, Infinity, Zap, ExternalLink, User, Loader2, X, ChevronRight, BadgeCheck, CheckCircle, HelpCircle, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from 'haze.bio/components/ui/Footer';
import toast from 'react-hot-toast';

import { useUser } from 'haze.bio/context/UserContext';
import Navigation from 'haze.bio/components/Navigation';

export default function PricingPage() {
    const { user: contextUser } = useUser();
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const router = useRouter();
    const featuresTableRef = useRef<HTMLDivElement>(null);

    const handlePurchasePremium = async () => {
        if (!contextUser) {
            router.push('/login?redirect=/pricing');
            return;
        }

        setIsCheckoutLoading(true);
        try {
            // TODO: Implement payment integration
            toast.error('Payment system is not implemented yet');
        } catch (error) {
            toast.error('Failed to create checkout session');
            console.error(error);
        } finally {
            setIsCheckoutLoading(false);
        }
    };

    const scrollToFeatures = () => {
        if (featuresTableRef.current) {
            featuresTableRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navigation isLoggedIn={contextUser != null} />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-70">
                <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.1)_0%,transparent_70%)]"></div>
                <div className="absolute bottom-[-30%] right-[-20%] w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.08)_0%,transparent_70%)]"></div>
                <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-900/20 blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-800/15 blur-[100px] animate-float-slow animation-delay-2000"></div>
            </div>

            {/* Decorative grid overlay */}
            <div className="fixed inset-0 z-[1] pointer-events-none">
                <div className="h-full w-full bg-[linear-gradient(to_right,rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>

                <div className="absolute top-20 left-[15%] opacity-20 rotate-[-15deg] scale-125">
                    <LinkIcon className="w-12 h-12 text-purple-500" />
                </div>
                <div className="absolute top-32 right-[20%] opacity-15 rotate-12 scale-150">
                    <LinkIcon className="w-14 h-14 text-purple-300" />
                </div>
                <div className="absolute top-60 left-[25%] opacity-10 rotate-45">
                    <LinkIcon className="w-10 h-10 text-purple-400" />
                </div>
                <div className="absolute top-80 right-[30%] opacity-25 rotate-[-30deg]">
                    <LinkIcon className="w-8 h-8 text-purple-600" />
                </div>
                <div className="absolute top-40 left-[10%] opacity-20 rotate-[60deg] scale-75">
                    <LinkIcon className="w-16 h-16 text-purple-700/70" />
                </div>
            </div>

            <div className="relative z-10 flex-grow flex flex-col">
                <div className="pt-32 space-y-24 md:space-y-32 mb-24">
                    {/* Hero section */}
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 relative text-center">
                        <div className="relative z-10 mb-8">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-5 max-w-4xl mx-auto animate-fade-in-up leading-tight">
                                Upgrade to <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">Premium</span>
                            </h1>

                            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-fade-in-up animation-delay-200">
                                Buy once and unlock all premium features forever. No subscriptions, no recurring fees.
                            </p>
                        </div>
                    </section>

                    {/* Premium Plan Section - Same style as homepage */}
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 relative">
                        <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Choose Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">Plan</span>
                            </h2>
                            <p className="text-zinc-400 text-lg">
                                Start with our free plan or unlock all features with premium
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="bg-gradient-to-br from-zinc-900/70 to-black/80 backdrop-blur-lg rounded-2xl border border-zinc-800/50 p-8 flex flex-col relative overflow-hidden animate-fade-in-up md:self-end">
                                <div className="mb-6">
                                    <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-medium rounded-full">FREE</span>
                                    <h3 className="text-2xl font-bold text-white mt-4">Free Plan</h3>
                                    <div className="flex items-baseline mt-3 mb-2">
                                        <span className="text-3xl font-bold text-white">$0</span>
                                        <span className="text-zinc-400 ml-1">/forever</span>
                                    </div>
                                    <p className="text-zinc-400 text-sm">Get started with basic features</p>
                                </div>

                                <div className="space-y-3 mb-6 flex-grow text-sm">
                                    				{["Basic Analytics", "Free Effects & Layouts"].map((feature, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <div className="mt-0.5">
                                                <CheckCircle className="w-5 h-5 text-zinc-500" />
                                            </div>
                                            <span className="text-zinc-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href="/register"
                                    className="w-full py-3 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700
               text-white rounded-lg font-medium text-center transition-all transform hover:-translate-y-0.5
               shadow-md shadow-zinc-900/30 flex items-center justify-center gap-2"
                                >
                                    Get Started
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="bg-gradient-to-br from-purple-900/20 to-black/80 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-8 flex flex-col relative overflow-hidden shadow-lg shadow-purple-900/20 animate-fade-in-up animation-delay-200 z-10">
                                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                                    <LinkIcon className="absolute top-6 right-6 w-12 h-12 text-purple-400 rotate-12" />
                                    <LinkIcon className="absolute bottom-12 left-8 w-8 h-8 text-purple-300 rotate-45" />
                                    <LinkIcon className="absolute top-32 left-12 w-16 h-16 text-purple-500 rotate-[-15deg]" />
                                    <LinkIcon className="absolute bottom-36 right-20 w-10 h-10 text-purple-400 rotate-[30deg]" />
                                </div>

                                <div className="absolute top-0 right-0 px-4 py-1 bg-purple-600 text-white text-xs font-bold rounded-bl-lg">POPULAR</div>

                                <div className="mb-6 relative z-10">
                                    <span className="px-3 py-1 bg-purple-700 text-purple-100 text-xs font-medium rounded-full">PREMIUM</span>
                                    <h3 className="text-2xl font-bold text-white mt-4">Premium Plan</h3>
                                    <div className="flex items-baseline mt-3 mb-2">
                                        <span className="text-3xl font-bold text-white">$4.99</span>
                                        <span className="text-zinc-400 ml-1">/one-time</span>
                                    </div>
                                    <p className="text-zinc-400 text-sm">Everything you need to stand out</p>
                                </div>

                                <div className="space-y-3 mb-6 relative z-10">
                                    {[
                                        "All Free features",
                                        
                                        "Remove cutz.lol branding",
                                        "Premium themes & effects",
                                        "Advanced analytics",
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <div className="mt-0.5">
                                                <CheckCircle className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <span className="text-zinc-200">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handlePurchasePremium}
                                    disabled={isCheckoutLoading || contextUser?.has_premium}
                                    className={`w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 
                                    ${contextUser?.has_premium
                                            ? 'opacity-70 cursor-not-allowed'
                                            : isCheckoutLoading
                                                ? 'opacity-70 cursor-not-allowed'
                                                : 'hover:from-purple-500 hover:to-purple-600 hover:-translate-y-0.5'
                                        }
                                    text-white rounded-lg font-medium text-center transition-all transform
                                    shadow-md shadow-purple-900/30 hover:shadow-lg hover:shadow-purple-800/40 flex items-center justify-center gap-2`}
                                >
                                    {isCheckoutLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : contextUser?.has_premium ? (
                                        'Already Purchased'
                                    ) : (
                                        <>
                                            Get Premium
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Feature comparison table */}
                    <div ref={featuresTableRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-4">Feature Comparison</h2>
                            <p className="text-zinc-400 max-w-2xl mx-auto">A detailed look at what's included with each plan</p>
                        </div>

                        <div className="bg-gradient-to-br from-zinc-900/50 to-black/80 backdrop-blur-lg rounded-2xl border border-zinc-800/50 overflow-hidden shadow-lg">
                            <div className="px-5 py-4 border-b border-zinc-800/50">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <BadgeCheck className="w-5 h-5 text-purple-400" />
                                    Features Breakdown
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto border-collapse text-sm min-w-[600px]">
                                    <thead>
                                        <tr className="bg-zinc-900/40 border-b border-zinc-800/50">
                                            <th className="py-4 px-6 text-left font-medium text-zinc-400 uppercase tracking-wider">Feature</th>
                                            <th className="py-4 px-6 text-center font-medium text-purple-400 uppercase tracking-wider w-[150px]">Premium</th>
                                            <th className="py-4 px-6 text-center font-medium text-zinc-400 uppercase tracking-wider w-[150px]">Free</th>
                                            <th className="py-4 px-6 text-left font-medium text-zinc-400 uppercase tracking-wider">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/30">
                                        {/* Premium Features */}
                                        <tr className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white">Custom Templates</td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-purple-400" /></td>
                                            <td className="py-4 px-6 text-center text-zinc-500">―</td>
                                            <td className="py-4 px-6 text-zinc-400">Access to premium templates like "modern" (centered layout)</td>
                                        </tr>
                                        <tr className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white">Custom Layout Width</td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-purple-400" /></td>
                                            <td className="py-4 px-6 text-center text-zinc-500">―</td>
                                            <td className="py-4 px-6 text-zinc-400">Ability to adjust profile layout width beyond default 776px</td>
                                        </tr>
                                        <tr className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white">Username Effects</td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-purple-400" /></td>
                                            <td className="py-4 px-6 text-center text-zinc-500">―</td>
                                            <td className="py-4 px-6 text-zinc-400">Special text effects like "hacker" style for usernames</td>
                                        </tr>
                                        <tr className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white">Premium Fonts</td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-purple-400" /></td>
                                            <td className="py-4 px-6 text-center text-zinc-500">―</td>
                                            <td className="py-4 px-6 text-zinc-400">Access to special fonts like "grand-theft-auto"</td>
                                        </tr>
                                        <tr className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white">Advanced Analytics</td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-purple-400" /></td>
                                            <td className="py-4 px-6 text-center text-zinc-500">―</td>
                                            <td className="py-4 px-6 text-zinc-400">Detailed visitor insights, geographic data, and device statistics</td>
                                        </tr>
                                        <tr className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white">Premium Badge</td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-purple-400" /></td>
                                            <td className="py-4 px-6 text-center text-zinc-500">―</td>
                                            <td className="py-4 px-6 text-zinc-400">Displays a premium badge on user profiles</td>
                                        </tr>

                                        {/* Features Available to All */}
                                        <tr className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white">Basic Profile Creation</td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-purple-400" /></td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-zinc-500" /></td>
                                            <td className="py-4 px-6 text-zinc-400">Create and customize a basic user profile</td>
                                        </tr>
                                        <tr className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white">Link Management</td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-purple-400" /></td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-zinc-500" /></td>
                                            <td className="py-4 px-6 text-zinc-400">Add, edit, and organize links on profiles</td>
                                        </tr>
                                        <tr className="hover:bg-zinc-800/20 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white">Basic Analytics</td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-purple-400" /></td>
                                            <td className="py-4 px-6 text-center"><Check className="inline w-5 h-5 text-zinc-500" /></td>
                                            <td className="py-4 px-6 text-zinc-400">View basic visitor count and traffic statistics</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section - Same style as homepage */}
                    <section className="max-w-5xl mx-auto px-4 sm:px-6 relative">
                        <div className="relative overflow-hidden bg-black/60 backdrop-blur-md rounded-2xl border border-purple-500/20 shadow-lg p-6 sm:p-8 text-center">
                            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                                <LinkIcon className="absolute top-6 right-10% w-16 h-16 text-purple-400 rotate-12" />
                                <LinkIcon className="absolute bottom-12 left-[15%] w-12 h-12 text-purple-300 rotate-45" />
                                <LinkIcon className="absolute top-[40%] left-[8%] w-20 h-20 text-purple-500 rotate-[-15deg]" />
                                <LinkIcon className="absolute bottom-[30%] right-[12%] w-14 h-14 text-purple-400 rotate-[30deg]" />
                                <LinkIcon className="absolute top-[25%] right-[25%] w-10 h-10 text-purple-600 rotate-[-5deg]" />
                                <LinkIcon className="absolute bottom-[15%] left-[35%] w-8 h-8 text-purple-200 rotate-[20deg]" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                    Ready to Upgrade Your Profile?
                                </h2>
                                <p className="text-zinc-400 max-w-lg mx-auto text-base mb-6">
                                    Join now and unlock all premium features for a one-time payment of just $4.99.
                                </p>

                                <div className="max-w-md mx-auto">
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        {contextUser?.has_premium ? (
                                            <Link
                                                href="/dashboard"
                                                className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 
                                                        text-white rounded-lg text-base font-semibold transition-all"
                                            >
                                                Go to Dashboard
                                            </Link>
                                        ) : contextUser ? (
                                            <button
                                                onClick={handlePurchasePremium}
                                                disabled={isCheckoutLoading}
                                                className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500
                                                        text-white rounded-lg text-base font-semibold transition-all"
                                            >
                                                {isCheckoutLoading ? (
                                                    <>
                                                        <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    'Upgrade to Premium'
                                                )}
                                            </button>
                                        ) : (
                                            <>
                                                <Link
                                                    href="/register?premium=true"
                                                    className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500
                                                            text-white rounded-lg text-base font-semibold transition-all"
                                                >
                                                    Sign Up & Get Premium
                                                </Link>
                                                <Link
                                                    href="/login?redirect=/pricing"
                                                    className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900/60 border border-zinc-700/70 hover:border-purple-500/50 hover:bg-purple-900/30
                                                            text-zinc-300 hover:text-white rounded-lg text-base font-semibold transition-all"
                                                >
                                                    Sign In
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                <Footer />
            </div>
        </div>
    );
}