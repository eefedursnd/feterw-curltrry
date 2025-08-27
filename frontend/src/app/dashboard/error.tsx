'use client';

import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw, MessageCircle, Terminal, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen relative flex flex-col bg-black">
      {/* Modern Gradient Background */}
      <div className="fixed inset-0 z-0">
        {/* Base dark background */}
        <div className="absolute inset-0 bg-black"></div>

        {/* Rich purple gradient elements */}
        <div className="absolute top-0 left-0 right-0 h-[40%] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-purple-900/5 to-transparent"></div>
        <div className="absolute bottom-0 right-0 left-0 h-[30%] bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-purple-800/10 via-purple-900/5 to-transparent"></div>
        
        {/* Subtle animated glow elements */}
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[300px] rounded-full bg-purple-900/5 blur-[120px] animate-float-slow"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[300px] rounded-full bg-purple-800/5 blur-[100px] animate-float-slow animation-delay-2000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] bg-repeat opacity-[0.015]"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex-grow flex flex-col">
        {/* Navigation */}
        <div className="py-6 px-4 sm:px-6 max-w-[100rem] mx-auto w-full">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 hover:bg-zinc-900 transition-all text-zinc-400 hover:text-white border border-zinc-800/50 hover:border-purple-500/30">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Content Area */}
        <div className="max-w-md mx-auto px-4 sm:px-6 py-8 flex-1 flex items-center justify-center">
          <div className="w-full space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-black to-zinc-900 rounded-xl p-8 border border-zinc-800/80 overflow-hidden relative shadow-xl shadow-purple-900/5">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.05),transparent_80%)]"></div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-700/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Dashboard Error
                </h1>
                <p className="text-zinc-400 text-sm md:text-base">
                  We encountered a problem while loading this page
                </p>
              </div>
            </div>

            {/* Error Card */}
            <div className="relative overflow-hidden bg-black rounded-xl border border-zinc-800/80 shadow-lg">
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

              <div className="relative p-8">
                <div className="flex items-center gap-3 mb-6 justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-700/10 rounded-full flex items-center justify-center border border-purple-500/20">
                    <AlertTriangle className="w-7 h-7 text-purple-400" />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-3">
                    Something Went Wrong
                  </h2>
                  <p className="text-zinc-400 text-sm mb-6">
                    We couldn't load this page. Try refreshing or return home.
                  </p>
                  
                  {error.message && (
                    <div className="bg-gradient-to-r from-black to-zinc-900 border border-purple-800/30 rounded-lg p-4 mb-4 text-left relative overflow-hidden">
                      <div className="absolute inset-0 bg-purple-900/5"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Terminal className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs text-purple-400/70 uppercase tracking-wider font-medium">Error Details</span>
                        </div>
                        <p className="text-purple-300 text-sm font-mono break-words">
                          {error.message}
                        </p>
                        {error.digest && (
                          <p className="text-xs text-purple-400/60 mt-2 font-mono">
                            Error ID: {error.digest}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <button
                    onClick={reset}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg 
                          hover:from-purple-500 hover:to-purple-600 transition-all text-sm font-medium 
                          flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/dashboard"
                      className="px-4 py-3 bg-black/40 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-lg 
                            transition-all text-sm font-medium border border-zinc-800/50 hover:border-purple-500/30 
                            flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Dashboard
                    </Link>
                    
                    <Link
                      href="https://discord.gg/cutz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 bg-black/40 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-lg 
                            transition-all text-sm font-medium border border-zinc-800/50 hover:border-purple-500/30 
                            flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Support
                    </Link>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="px-5 py-4 border-t border-zinc-800/50 bg-black/40">
                <p className="text-xs text-center text-zinc-500">
                  If this issue persists, please contact our support team with the error ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-zinc-800/50 mt-auto">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 text-center">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} cutz.lol | All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}