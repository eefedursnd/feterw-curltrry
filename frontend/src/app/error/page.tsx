'use client';

import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, MessageCircle, ExternalLink, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Footer from 'haze.bio/components/ui/Footer';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || "An unexpected error occurred.";
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirect only if countdown reaches 0
      if (countdown === 0) {
        window.location.href = "/";
      }
    }
  }, [countdown]);

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden bg-black"> {/* Base background */}
      {/* Background Effects - Consistent with Homepage */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-70">
        {/* Purple radial gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.1)_0%,transparent_70%)]"></div>
        <div className="absolute bottom-[-30%] right-[-20%] w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.08)_0%,transparent_70%)]"></div>
        {/* Subtle animated glow pills */}
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-900/20 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-800/15 blur-[100px] animate-float-slow animation-delay-2000"></div>
      </div>

      {/* Decorative grid overlay - Consistent with Homepage */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex-grow flex flex-col">
        {/* Navigation Button - Styled like secondary buttons */}
        <div className="py-6 px-4 sm:px-6 max-w-[100rem] mx-auto w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700/70 hover:border-purple-500/50 hover:bg-purple-900/30
                       text-zinc-300 hover:text-white transition-all hover:shadow-md hover:shadow-purple-900/15"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Content Area */}
        <div className="max-w-md mx-auto px-4 sm:px-6 py-8 flex-1 flex items-center justify-center">
          <div className="w-full space-y-6">
            {/* Header Card - Removed, integrated into Error Card */}

            {/* Error Card - Updated Styling */}
            <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-black/60 backdrop-blur-sm rounded-xl border border-purple-500/20 shadow-xl shadow-purple-900/15">
              {/* Background glows inside card */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

              <div className="relative p-6 sm:p-8"> {/* Adjusted padding */}
                <div className="flex flex-col items-center gap-4 mb-6"> {/* Centered icon and text */}
                  <div className="w-14 h-14 bg-purple-900/40 rounded-full flex items-center justify-center border border-purple-500/30">
                    <AlertTriangle className="w-7 h-7 text-purple-300" />
                  </div>
                  <h1 className="text-2xl font-bold text-white text-center">
                    Something Went Wrong
                  </h1>
                </div>

                <div className="text-center mb-6">
                  {/* Error Message Box - Updated Styling */}
                  <div className="bg-black/50 border border-purple-500/30 rounded-lg p-4 mb-4 text-left relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.05),transparent_70%)] opacity-50"></div>
                    <div className="relative">
                      <p className="text-purple-300 text-sm font-medium">Error Details:</p>
                      <p className="text-zinc-300 text-sm mt-1">
                        {message}
                      </p>
                    </div>
                  </div>

                  <p className="text-zinc-400 text-sm">
                    You'll be redirected to the home page in <span className="text-purple-400 font-medium">{countdown}</span> seconds.
                  </p>
                </div>

                {/* Actions - Updated Button Styles */}
                <div className="space-y-4">
                  <Link
                    href="/"
                    className="w-full group px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-xl hover:shadow-purple-800/40
                          transition-all text-sm font-semibold flex items-center justify-center gap-2 border border-purple-500/40 hover:border-purple-400/60
                          hover:from-purple-500 hover:to-purple-600 transform hover:-translate-y-0.5"
                  >
                    <Home className="w-4 h-4" />
                    Return to Home
                  </Link>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-700/70 hover:border-purple-500/50 hover:bg-purple-900/30
                            text-zinc-300 hover:text-white rounded-lg transition-all text-sm font-medium
                            flex items-center justify-center gap-2 hover:shadow-md hover:shadow-purple-900/15"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>

                    <Link
                      href="https://discord.gg/hazebio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-700/70 hover:border-purple-500/50 hover:bg-purple-900/30
                            text-zinc-300 hover:text-white rounded-lg transition-all text-sm font-medium
                            flex items-center justify-center gap-2 hover:shadow-md hover:shadow-purple-900/15"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Support <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Footer Note - Updated Styling */}
              <div className="px-5 py-4 border-t border-purple-500/10 bg-black/40">
                <p className="text-xs text-center text-zinc-500">
                  If this issue persists, please contact our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}