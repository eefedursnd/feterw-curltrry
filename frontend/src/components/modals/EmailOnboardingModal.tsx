'use client';

import { useState } from 'react';
import { Mail, LogOut, Lock, KeyRound, AlertCircle, Loader2, CheckCircle2, CalendarClock, ShieldAlert, Clock } from 'lucide-react';
import { emailAPI, userAPI } from 'haze.bio/api';
import { User } from 'haze.bio/types';
import toast from 'react-hot-toast';
import { useUser } from 'haze.bio/context/UserContext';

interface EmailOnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserUpdate: (updatedUser: User) => void;
}

export default function EmailOnboardingModal({ isOpen, onClose, onUserUpdate }: EmailOnboardingModalProps) {
    const [step, setStep] = useState<'email' | 'verification'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { user } = useUser();

    if (!isOpen || !user) return null;

    const handleSendVerification = async () => {
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            await emailAPI.sendVerificationEmail(email);
            setStep('verification');
        } catch (err: any) {
            toast.error(err.message || 'Failed to send verification email');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code || code.length < 6) {
            toast.error('Please enter a valid verification code');
            return;
        }

        setIsLoading(true);

        try {
            await emailAPI.verifyEmailCode(code);

            const updatedUser = await userAPI.getCurrentUser();
            onUserUpdate(updatedUser);

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            toast.error(err.message || 'Failed to verify email code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await userAPI.logout();
        } catch (error) {
            console.error('Logout failed', error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                            <Mail className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">
                                {step === 'email' ? 'Email Verification Required' : 'Verify Email Code'}
                            </h3>
                            <p className="text-xs text-white/60">Secure your account with email verification</p>
                        </div>
                    </div>
                    {/* No close button as this modal is mandatory */}
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {success ? (
                        <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-5 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-green-800/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-400" />
                            </div>
                            <h4 className="text-lg font-medium text-white mb-2">Email Verified!</h4>
                            <p className="text-sm text-white/60 max-w-md">
                                Your email has been successfully verified. You'll now enjoy enhanced account security.
                            </p>
                        </div>
                    ) : step === 'email' ? (
                        <div className="space-y-5">
                            <div className="bg-purple-900/10 rounded-lg border border-purple-800/30 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <AlertCircle className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-white mb-1">Important Security Update</h4>
                                        <p className="text-xs text-white/60">
                                            Starting March 31, all users are required to verify their email address to continue using haze.bio.
                                            This helps us protect your account and provide better security features.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column - Benefits */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-white ml-1">Benefits</h4>
                                    
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <ShieldAlert className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white mb-0.5">Enhanced Security</p>
                                                <p className="text-xs text-white/60">
                                                    Protect your account with email verification for important changes
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <KeyRound className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white mb-0.5">Account Recovery</p>
                                                <p className="text-xs text-white/60">
                                                    Reset your password and recover your account if you lose access
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <CalendarClock className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white mb-0.5">30-Day Requirement</p>
                                                <p className="text-xs text-white/60">
                                                    You have 30 days to verify your email. After this period,
                                                    unverified accounts will have limited functionality
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Email Input */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-white ml-1">Your Email</h4>
                                    
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="your.email@example.com"
                                                className="w-full px-4 py-3 bg-black/50 border border-zinc-800/50 rounded-lg
                                                        text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/30"
                                            />
                                            <div className="absolute top-3 right-3 text-zinc-600">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-white/40">
                                            Your email is protected and will only be used for account security
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={handleSendVerification}
                                            disabled={isLoading || !email}
                                            className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg
                                                    transition-colors text-sm disabled:opacity-50 disabled:hover:bg-purple-600
                                                    disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Mail size={16} />
                                                    <span>Send Verification Code</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            className="w-full px-4 py-2.5 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg
                                                    transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            {isLoggingOut ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <LogOut size={16} />
                                                    <span>Log Out</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="bg-purple-900/10 rounded-lg border border-purple-800/30 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Mail className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-white mb-1">Verification Code Sent</h4>
                                        <p className="text-xs text-white/60">
                                            We've sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>.
                                            Please check your inbox and enter the code below to verify your email address.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column - Code Verification Tips */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-white ml-1">Tips</h4>
                                    
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white mb-0.5">Check Your Inbox</p>
                                                <p className="text-xs text-white/60">
                                                    The verification code is valid for 10 minutes. Look for an email from haze.bio
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white mb-0.5">Check Spam Folder</p>
                                                <p className="text-xs text-white/60">
                                                    If you don't see the email in your inbox, please check your spam or junk folder
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <AlertCircle className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white mb-0.5">Need Help?</p>
                                                <p className="text-xs text-white/60">
                                                    If you haven't received the email, you can <button
                                                        onClick={() => setStep('email')}
                                                        className="text-purple-400 hover:underline"
                                                    >
                                                        try a different email
                                                    </button> or check if the address was entered correctly
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Code Input */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-white ml-1">Enter Code</h4>
                                    
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-white">
                                                Verification Code
                                            </label>
                                            <div className="flex items-center text-xs text-white/40">
                                                <Clock className="w-3 h-3 mr-1" />
                                                <span>Valid for 10 minutes</span>
                                            </div>
                                        </div>

                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                            className="w-full px-4 py-3 bg-black/50 border border-zinc-800/50 rounded-lg
                                                text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/30
                                                tracking-wider text-center text-lg font-mono"
                                        />
                                        <div className="flex justify-center gap-1 mt-2">
                                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full ${i < code.length ? 'bg-purple-500' : 'bg-zinc-800'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-2 text-xs text-white/40 text-center">
                                            Enter the 6-digit code sent to your email
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={handleVerifyCode}
                                            disabled={isLoading || !code || code.length < 6}
                                            className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg
                                                transition-colors text-sm disabled:opacity-50 disabled:hover:bg-purple-600
                                                disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Lock size={16} />
                                                    <span>Verify Email</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setStep('email')}
                                            disabled={isLoading}
                                            className="w-full px-4 py-2.5 bg-zinc-800/70 hover:bg-zinc-700/50 text-white rounded-lg
                                                transition-colors text-sm flex items-center justify-center"
                                        >
                                            Back
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}