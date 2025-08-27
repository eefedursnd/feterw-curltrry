'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, UserCheck, User } from 'lucide-react';
import { emailAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import Footer from 'haze.bio/components/ui/Footer';

export default function VerifyRegistration() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get('token');
    const [isLoading, setIsLoading] = useState(true);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isCompleting, setIsCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenValid(false);
                setError('Missing or invalid verification token');
                setIsLoading(false);
                return;
            }

            try {
                const userData = await emailAPI.verifyRegistration(token);
                setUsername(userData.username);
                setEmail(userData.email);
                setTokenValid(true);
            } catch (err: any) {
                setTokenValid(false);
                setError(err.message || 'Failed to verify registration');
                console.error("Verification error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleCompleteRegistration = async () => {
        if (!token) return;

        try {
            setIsCompleting(true);
            await emailAPI.completeRegistration(token);
            setCompleted(true);

            toast.success('Registration completed successfully!');

            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);

        } catch (err: any) {
            setError(err.message || 'Failed to complete registration');
            toast.error(err.message || 'Failed to complete registration');
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <div className="fixed inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.1),transparent_60%)]"></div>
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.08),transparent_70%)]"></div>
            </div>

            <div className="relative z-10 flex-grow flex flex-col">
                <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto w-full">
                    <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/70 transition-all text-zinc-300 hover:text-white border border-zinc-800/50 hover:border-purple-500/30 text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
                    <div className="w-full max-w-md">
                        <div className="relative overflow-hidden bg-black rounded-xl border border-zinc-800/50 shadow-xl shadow-purple-900/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>

                            <div className="relative p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {isLoading ? 'Verifying Link' :
                                                completed ? 'Account Activated' :
                                                    tokenValid ? 'Email Verified' :
                                                        'Invalid Link'}
                                        </h2>
                                        <p className="text-zinc-400 text-sm">
                                            {isLoading ? 'Checking your verification link...' :
                                                completed ? 'Your account is now ready to use' :
                                                    tokenValid ? `Finish setting up ${username}'s account` :
                                                        error || 'This verification link is invalid or has expired'}
                                        </p>
                                    </div>
                                </div>

                                {isLoading && (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
                                        <p className="text-zinc-400 text-center">Validating your verification link...</p>
                                    </div>
                                )}

                                {!isLoading && tokenValid === false && (
                                    <div className="bg-zinc-900/50 rounded-lg p-6 text-center border border-zinc-800/50">
                                        <h3 className="text-white font-medium mb-2">Invalid Verification Link</h3>
                                        <p className="text-zinc-400 text-sm mb-6">{error || 'This link has expired or is invalid.'}</p>

                                        <div className="space-y-3">
                                            <Link
                                                href="/register"
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 border border-purple-600/50 shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-800/30"
                                            >
                                                Sign Up Again
                                            </Link>
                                            <Link
                                                href="/login"
                                                className="w-full px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium border border-zinc-700/50 inline-block"
                                            >
                                                Go to Login
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {!isLoading && tokenValid === true && !completed && (
                                    <div className="space-y-6">
                                        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">
                                                Account Information
                                            </label>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-zinc-400">Username</span>
                                                    <span className="text-sm text-white font-medium">{username}</span>
                                                </div>
                                                <div className="h-px bg-zinc-800/50"></div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-zinc-400">Email</span>
                                                    <span className="text-sm text-white font-medium break-all">{email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/20">
                                            <div className="flex items-start gap-3">
                                                <div>
                                                    <p className="text-sm text-purple-300/90">
                                                        Click the button below to activate your account and start using cutz.lol.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCompleteRegistration}
                                            disabled={isCompleting}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 border border-purple-600/50 shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-800/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                                        >
                                            {isCompleting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Activating Account...
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck className="w-4 h-4" />
                                                    Activate Account
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {completed && (
                                    <div className="bg-zinc-900/50 rounded-lg p-6 text-center border border-zinc-800/50">
                                        <h3 className="text-white font-medium mb-2">Welcome to cutz.lol!</h3>
                                        <p className="text-zinc-400 text-sm mb-6">
                                            Your account has been activated successfully. You'll be redirected to the login page shortly.
                                        </p>
                                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                                    </div>
                                )}
                            </div>

                            {!completed && !isLoading && (
                                <div className="px-8 py-5 border-t border-zinc-800/50 bg-black rounded-b-xl">
                                    <p className="text-sm text-center text-zinc-500">
                                        {tokenValid
                                            ? "Already have an account? "
                                            : "Need help? "}
                                        <Link
                                            href={tokenValid ? "/login" : "https://discord.gg/cutz"}
                                            className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
                                            target={tokenValid ? "_self" : "_blank"}
                                            rel={tokenValid ? "" : "noopener noreferrer"}
                                        >
                                            {tokenValid ? "Sign in" : "Contact support"}
                                        </Link>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>

        </div>
    );
}