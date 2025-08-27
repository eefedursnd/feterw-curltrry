'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { userAPI } from 'haze.bio/api';
import { emailAPI } from 'haze.bio/api';
import { ArrowLeft, Check, Lock, User, Mail, Loader2, UserPlus, MailCheck, X, ArrowRight, Shield, Eye, EyeOff, Info } from 'lucide-react';
import Footer from 'haze.bio/components/ui/Footer';
import { useUser } from 'haze.bio/context/UserContext';
import Navigation from 'haze.bio/components/Navigation';

export default function Register() {
  const router = useRouter();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const claimedUsername = searchParams.get('claim') || '';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState(claimedUsername);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false
  });
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const steps = [
    { title: "Account Details", description: "Enter your username and email" },
    { title: "Create Password", description: "Set a secure password for your account" },
    { title: "Review & Submit", description: "Complete your registration" }
  ]

  const validatePassword = (pass: string, confirm: string = confirmPassword) => {
    setPasswordStrength({
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      match: pass === confirm && pass !== ''
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword, confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPass = e.target.value;
    setConfirmPassword(confirmPass);
    validatePassword(password, confirmPass);
  };

  const isEmailValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValid = Object.values(passwordStrength).every(Boolean) &&
    username.length >= 3 &&
    isEmailValid(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error('Please complete all required fields correctly');
      return;
    }

    try {
      setIsLoading(true);
      await userAPI.register(email, username, password);

      setRegistrationEmail(email);
      setRegistrationSubmitted(true);

      toast.success('Registration initiated! Please check your email to verify your account');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Registration failed');
      }
      setIsLoading(false);
    }
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit({ preventDefault: () => { } } as React.FormEvent);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return username.length >= 3 && isEmailValid(email);
      case 1:
        return passwordStrength.length &&
          passwordStrength.uppercase &&
          passwordStrength.lowercase &&
          passwordStrength.number &&
          passwordStrength.match;
      case 2:
        return isValid && !isLoading;
      default:
        return false;
    }
  };

  if (registrationSubmitted) {
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

        <div className="relative z-10 flex-grow flex flex-col">
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
            <div className="w-full max-w-md">
              <div className="relative overflow-hidden bg-black rounded-xl p-8 border border-zinc-800/50 shadow-xl shadow-purple-900/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>

                <div className="relative text-center mb-8">
                  <div className="w-16 h-16 bg-purple-800/20 rounded-full mx-auto flex items-center justify-center mb-4 border border-purple-500/20">
                    <MailCheck className="w-8 h-8 text-purple-400" />
                  </div>

                  <h1 className="text-2xl font-bold text-white mb-2">
                    Check Your Email
                  </h1>

                  <p className="text-zinc-400 text-sm mb-4">
                    We sent a verification link to:
                  </p>

                  <p className="text-white font-medium break-all bg-zinc-800/50 py-3 px-4 rounded-lg border border-zinc-700/50">
                    {registrationEmail}
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
                    <p className="text-zinc-400 text-sm">
                      Click the verification link in your email to complete your registration. The link will expire in 24 hours.
                    </p>
                  </div>

                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 border border-purple-600/50 shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-800/30"
                  >
                    Go to Login
                  </Link>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-zinc-500">
                      Didn't receive an email?{" "}
                      <button
                        onClick={() => {
                          setRegistrationSubmitted(false);
                          setIsLoading(false);
                        }}
                        className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                      >
                        Try Again
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

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
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
          <div className="w-full max-w-md">
            <div className="relative overflow-hidden bg-black rounded-xl p-8 border border-zinc-800/50 shadow-xl shadow-purple-900/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>

              <div className="relative mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h1 className="text-xl font-bold text-white">
                        Create an Account
                      </h1>
                      <p className="text-zinc-400 text-sm">
                        Sign up to create your cutz.lol profile
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <form className="space-y-5">
                {currentStep === 0 && (
                  <>
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
                          placeholder="Choose a username"
                          className="block w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        Must be at least 3 characters long.
                      </p>
                    </div>

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
                          placeholder="Enter your email address"
                          className={`block w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors
                                  ${email && !isEmailValid(email) ? 'border-red-500/50' : 'border-zinc-700/50'}`}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      {email && !isEmailValid(email) ? (
                        <p className="mt-2 text-xs text-red-400">Please enter a valid email address</p>
                      ) : (
                        <p className="text-xs text-zinc-500 mt-2">
                          We'll send a verification link to this email.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {currentStep === 1 && (
                  <>
                    <div>
                      <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Create Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-zinc-500" />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          placeholder="Create a password"
                          className="block w-full pl-10 pr-10 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          value={password}
                          onChange={handlePasswordChange}
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
                          <Shield className="h-4 w-4 text-zinc-500" />
                        </div>
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                          className={`block w-full pl-10 pr-10 py-2.5 bg-zinc-900/50 border rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors
                                  ${confirmPassword && !passwordStrength.match ? 'border-red-500/50' : 'border-zinc-700/50'}`}
                          value={confirmPassword}
                          onChange={handleConfirmPasswordChange}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && !passwordStrength.match && (
                        <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
                      )}
                    </div>

                    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                      <h3 className="text-xs font-medium text-zinc-400 mb-3">Password Requirements</h3>
                      <div className="flex gap-1 mb-3">
                        <div className={`h-1 flex-1 rounded-full ${strengthScore >= 1 ? 'bg-red-500' : 'bg-zinc-800'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${strengthScore >= 2 ? 'bg-orange-500' : 'bg-zinc-800'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${strengthScore >= 3 ? 'bg-yellow-500' : 'bg-zinc-800'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${strengthScore >= 4 ? 'bg-lime-500' : 'bg-zinc-800'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${strengthScore >= 5 ? 'bg-green-500' : 'bg-zinc-800'}`}></div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className={`flex items-center gap-2 ${passwordStrength.length ? 'text-green-400' : 'text-zinc-500'}`}>
                          {passwordStrength.length ? <Check className="w-3 h-3 text-green-400" /> : <X className="w-3 h-3 text-zinc-600" />}
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-2 ${passwordStrength.uppercase ? 'text-green-400' : 'text-zinc-500'}`}>
                          {passwordStrength.uppercase ? <Check className="w-3 h-3 text-green-400" /> : <X className="w-3 h-3 text-zinc-600" />}
                          One uppercase letter
                        </div>
                        <div className={`flex items-center gap-2 ${passwordStrength.lowercase ? 'text-green-400' : 'text-zinc-500'}`}>
                          {passwordStrength.lowercase ? <Check className="w-3 h-3 text-green-400" /> : <X className="w-3 h-3 text-zinc-600" />}
                          One lowercase letter
                        </div>
                        <div className={`flex items-center gap-2 ${passwordStrength.number ? 'text-green-400' : 'text-zinc-500'}`}>
                          {passwordStrength.number ? <Check className="w-3 h-3 text-green-400" /> : <X className="w-3 h-3 text-zinc-600" />}
                          One number
                        </div>
                        <div className={`flex items-center gap-2 ${passwordStrength.match ? 'text-green-400' : 'text-zinc-500'}`}>
                          {passwordStrength.match ? <Check className="w-3 h-3 text-green-400" /> : <X className="w-3 h-3 text-zinc-600" />}
                          Passwords match
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50 space-y-4">
                      <h3 className="text-xs font-medium text-zinc-400">Review Your Information</h3>

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
                        <div className="h-px bg-zinc-800/50"></div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Password</span>
                          <span className="text-sm text-white font-medium">
                            {password.replace(/./g, '•')}
                          </span>
                        </div>
                        <div className="h-px bg-zinc-800/50"></div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Password Strength</span>
                          <div className="flex items-center gap-1">
                            {strengthScore < 3 && <span className="text-xs text-red-400">Weak</span>}
                            {strengthScore >= 3 && strengthScore < 5 && <span className="text-xs text-yellow-400">Good</span>}
                            {strengthScore === 5 && <span className="text-xs text-green-400">Strong</span>}
                            <div className="flex h-1.5 w-12 gap-0.5">
                              <div className={`h-full flex-1 rounded-full ${strengthScore >= 1 ? 'bg-red-500' : 'bg-zinc-800'}`}></div>
                              <div className={`h-full flex-1 rounded-full ${strengthScore >= 2 ? 'bg-orange-500' : 'bg-zinc-800'}`}></div>
                              <div className={`h-full flex-1 rounded-full ${strengthScore >= 3 ? 'bg-yellow-500' : 'bg-zinc-800'}`}></div>
                              <div className={`h-full flex-1 rounded-full ${strengthScore >= 4 ? 'bg-lime-500' : 'bg-zinc-800'}`}></div>
                              <div className={`h-full flex-1 rounded-full ${strengthScore >= 5 ? 'bg-green-500' : 'bg-zinc-800'}`}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                      <div className="flex items-start gap-3">
                        <div className="p-1 rounded-full bg-blue-500/10 text-blue-400 mt-0.5">
                          <Info className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-300/90">
                            After registration, you'll need to verify your email before your account is activated.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </form>

              <div className="flex justify-between mt-6 pt-6 border-t border-zinc-800/50">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0}
                  className={`px-4 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-1.5
                          ${currentStep === 0
                      ? 'text-zinc-600 cursor-not-allowed'
                      : 'text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50'}`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={currentStep === 2 ? handleSubmit : goToNextStep}
                  disabled={!canProceedToNext()}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 border border-purple-600/50 shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-800/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {currentStep === 2 ? 'Creating...' : 'Processing...'}
                    </>
                  ) : currentStep === 2 ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-zinc-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div >
  );
}