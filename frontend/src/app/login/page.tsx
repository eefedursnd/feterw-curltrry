'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { FaDiscord } from 'react-icons/fa';
import { userAPI, mfaAPI, discordAPI, passwordAPI } from 'haze.bio/api';
import { ArrowLeft, Lock, Shield, User, Mail, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import Footer from 'haze.bio/components/ui/Footer';
import Navigation from 'haze.bio/components/Navigation';
import { useUser } from 'haze.bio/context/UserContext';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { user } = useUser();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [userID, setUserID] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [resetRequestSent, setResetRequestSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await userAPI.login(username, password);
      if (response.requiresMfa) {
        setShowMfa(true);
        setUserID(response.userID || 0);
        setIsLoading(false);
        return;
      }
      window.location.href = redirectUrl || '/dashboard';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await mfaAPI.verifyMFA(userID, mfaCode);
      window.location.href = redirectUrl || '/dashboard';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'MFA verification failed');
      setIsLoading(false);
    }
  };

  const handleDiscordRedirect = async () => {
    try {
      const discordRedirectUrl = await discordAPI.getOAuth2URL(true);
      window.location.href = discordRedirectUrl;
    } catch (error) {
      toast.error('Failed to redirect to Discord');
    }
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setForgotPasswordLoading(true);
    try {
      await passwordAPI.requestPasswordReset(forgotEmail);
      setResetRequestSent(true);
      toast.success('If your email exists, you will receive reset instructions.');
    } catch (error) {
      setResetRequestSent(true);
      toast.success('If your email exists, you will receive reset instructions.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navigation */}
      <Navigation isLoggedIn={user != null} />
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
        <div className="max-w-md mx-auto px-4 sm:px-6 py-8 flex-1 flex items-center justify-center w-full">
          <div className="w-full space-y-6">
            <div className="relative overflow-hidden bg-black rounded-xl border border-zinc-800/50 shadow-xl shadow-purple-900/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>

              {!showMfa && !showForgotPassword && !resetRequestSent && (
                <div className="relative p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Account Login
                      </h2>
                      <p className="text-zinc-400 text-sm">
                        Login to your account to continue
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="username" className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-zinc-500" />
                        </div>
                        <input
                          id="username"
                          type="text"
                          required
                          autoComplete="username"
                          autoCapitalize="none"
                          placeholder="Enter your username"
                          className="block w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="password" className="block text-xs font-medium text-zinc-400">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-zinc-500" />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          placeholder="Enter your password"
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

                    <button
                      type="submit"
                      disabled={isLoading || !username || !password}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 border border-purple-600/50 shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-800/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          Sign in
                        </>
                      )}
                    </button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-zinc-800/50"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-black text-zinc-500">or continue with</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDiscordRedirect}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors text-sm font-medium"
                    >
                      <FaDiscord className="w-5 h-5" />
                      Discord
                    </button>
                  </form>
                </div>
              )}

              {showMfa && (
                <div className="relative p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                      <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Security Verification
                      </h2>
                      <p className="text-zinc-400 text-sm">
                        Enter the code from your authenticator app
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleMfaSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="mfa-code" className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Authentication Code
                      </label>
                      <input
                        id="mfa-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="one-time-code"
                        required
                        className="block w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-center tracking-[0.5em] placeholder:tracking-normal text-lg placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="123456"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                      />
                      <p className="mt-2 text-xs text-zinc-500 text-center">
                        Enter the 6-digit code from your authenticator app.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || mfaCode.length !== 6}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 border border-purple-600/50 shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-800/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Verify Code
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {showForgotPassword && !resetRequestSent && (
                <div className="relative p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                      <Mail className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Reset Your Password
                      </h2>
                      <p className="text-zinc-400 text-sm">
                        Enter your email to receive a reset link
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-zinc-500" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          autoComplete="email"
                          autoCapitalize="none"
                          placeholder="you@example.com"
                          className="block w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                        />
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        We'll send a password reset link to this email address.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        type="submit"
                        disabled={forgotPasswordLoading || !forgotEmail || !forgotEmail.includes('@')}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 border border-purple-600/50 shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-800/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {forgotPasswordLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            Send Reset Link
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium border border-zinc-700/50"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {resetRequestSent && (
                <div className="relative p-8 text-center">
                  <div className="mx-auto w-14 h-14 bg-purple-800/20 rounded-lg flex items-center justify-center mb-6 border border-purple-500/20">
                    <Mail className="h-7 w-7 text-purple-400" />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-xl font-bold text-white">
                      Check Your Email
                    </h2>
                    <p className="text-zinc-300 text-sm">
                      If an account exists for <span className="font-medium text-white">{forgotEmail}</span>, you'll receive an email with instructions to reset your password shortly.
                    </p>
                    <p className="text-zinc-500 text-xs">
                      Please check your inbox and spam folder.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetRequestSent(false);
                      setForgotEmail('');
                    }}
                    className="mt-6 w-full px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition-colors text-sm font-medium border border-zinc-700/50"
                  >
                    Return to Login
                  </button>
                </div>
              )}

              {!showMfa && !resetRequestSent && (
                <div className="px-8 py-5 border-t border-zinc-800/50 bg-black rounded-b-xl">
                  <p className="text-sm text-center text-zinc-500">
                    {showForgotPassword
                      ? "Remember your password? "
                      : "Don't have an account? "}
                    <Link
                      href={showForgotPassword ? "#" : "/register"}
                      onClick={showForgotPassword ? (e) => { e.preventDefault(); setShowForgotPassword(false); } : undefined}
                      className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showForgotPassword ? "Sign in" : "Create account"}
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