'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, KeyRound, LogIn, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { passwordAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';
import Footer from 'haze.bio/components/ui/Footer'; // Import Footer

export default function PasswordReset() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true); // Start loading to verify token
    const [isSubmitting, setIsSubmitting] = useState(false); // Separate state for form submission
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenValid(false);
                setError('Missing or invalid reset token');
                setIsLoading(false);
                return;
            }

            try {
                const isValid = await passwordAPI.verifyResetToken(token);
                setTokenValid(isValid);
                if (!isValid) {
                    setError('This password reset link has expired or is invalid');
                }
            } catch (err: any) {
                setTokenValid(false);
                setError('Failed to verify reset token');
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!isPasswordStrongEnough()) {
            toast.error('Password does not meet all requirements');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await passwordAPI.resetPassword(token as string, password);
            setSuccess(true);

            toast.success('Password reset successful! Redirecting...');

            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);

        } catch (err: any) {
            const errorMessage = err.message || 'Failed to reset password';
            setError(errorMessage);
            toast.error(errorMessage);
            setIsSubmitting(false);
        }
    };

    const passwordStrength = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
    };

    const isPasswordStrongEnough = () => {
        return Object.values(passwordStrength).every(Boolean);
    };

    const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">Verifying reset link...</p>
                </div>
            );
        }

        if (!tokenValid) {
            return (
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Invalid Link
                            </h2>
                            <p className="text-zinc-400 text-sm">
                                This reset link is no longer valid
                            </p>
                        </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-6 text-center">
                        <h3 className="text-white font-medium mb-2">Link Expired or Invalid</h3>
                        <p className="text-zinc-400 text-sm mb-6">{error || 'Please request a new password reset link.'}</p>
                        <Link
                            href="/login"
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 border border-purple-600/50 shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-800/30"
                        >
                            <LogIn className="w-4 h-4" />
                            Return to Login
                        </Link>
                    </div>
                </div>
            );
        }

        if (success) {
            return (
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-900/20 rounded-lg flex items-center justify-center border border-green-500/20">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Password Updated
                            </h2>
                            <p className="text-zinc-400 text-sm">
                                Redirecting you to login...
                            </p>
                        </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-6 text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <h3 className="text-white font-medium mb-2">Success!</h3>
                        <p className="text-zinc-400 text-sm mb-4">
                            Your password has been updated. You will be redirected shortly.
                        </p>
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
                    </div>
                </div>
            );
        }

        // Token is valid, show the form
        return (
            <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center border border-purple-500/20">
                        <KeyRound className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Create New Password
                        </h2>
                        <p className="text-zinc-400 text-sm">
                            Set a strong, secure password for your account
                        </p>
                    </div>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-5">
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">
                            New Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-zinc-500" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Enter new password"
                                className="block w-full pl-10 pr-10 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-xs font-medium text-zinc-400 mb-1.5">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <ShieldCheck className="h-4 w-4 text-zinc-500" />
                            </div>
                            <input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Confirm new password"
                                className={`block w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors
                                        ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : 'border-zinc-700/50'}`}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
                        )}
                    </div>

                    {/* Password Strength Indicator */}
                    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                        <h3 className="text-xs font-medium text-zinc-400 mb-3">Password Requirements</h3>
                        <div className="flex gap-1 mb-3">
                            <div className={`h-1 flex-1 rounded-full ${strengthScore >= 1 ? 'bg-red-500' : 'bg-zinc-800'}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${strengthScore >= 2 ? 'bg-orange-500' : 'bg-zinc-800'}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${strengthScore >= 3 ? 'bg-yellow-500' : 'bg-zinc-800'}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${strengthScore >= 4 ? 'bg-green-500' : 'bg-zinc-800'}`}></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {Object.entries(passwordStrength).map(([key, value]) => (
                                <div key={key} className={`flex items-center gap-2 ${value ? 'text-green-400' : 'text-zinc-500'}`}>
                                    {value ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <AlertCircle className="w-3.5 h-3.5 text-zinc-600" />}
                                    {key === 'length' && 'At least 8 characters'}
                                    {key === 'uppercase' && 'One uppercase letter'}
                                    {key === 'lowercase' && 'One lowercase letter'}
                                    {key === 'number' && 'One number'}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || password !== confirmPassword || !isPasswordStrongEnough()}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 border border-purple-600/50 shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-800/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Resetting Password...
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                Reset Password
                            </>
                        )}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Background Effects - Adjusted for Purple Theme */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-70">
                {/* Purple radial gradients */}
                <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.1)_0%,transparent_70%)]"></div>
                <div className="absolute bottom-[-30%] right-[-20%] w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.08)_0%,transparent_70%)]"></div>
                {/* Subtle animated glow pills */}
                <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-900/20 blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-800/15 blur-[100px] animate-float-slow animation-delay-2000"></div>
            </div>

            {/* Decorative grid overlay - More subtle */}
            <div className="fixed inset-0 z-[1] pointer-events-none">
                <div className="h-full w-full bg-[linear-gradient(to_right,rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
            </div>

            <div className="relative z-10 flex-grow flex flex-col">
                <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto w-full">
                    <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/70 transition-all text-zinc-300 hover:text-white border border-zinc-800/50 hover:border-purple-500/30 text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>

                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
                    <div className="w-full max-w-md">
                        <div className="relative overflow-hidden bg-black rounded-xl border border-zinc-800/50 shadow-xl shadow-purple-900/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>

                            {renderContent()}

                            {!success && tokenValid && !isLoading && (
                                <div className="px-8 py-5 border-t border-zinc-800/50 bg-black rounded-b-xl">
                                    <p className="text-sm text-center text-zinc-500">
                                        Remember your password?{" "}
                                        <Link href="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                                            Sign in instead
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