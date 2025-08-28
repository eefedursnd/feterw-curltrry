import Footer from "haze.bio/components/ui/Footer";
import { Eye, ArrowLeft, ChevronRight, Home, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {/* Background Elements and Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-800/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-[90px]"></div>
      </div>

      <div className="max-w-lg w-full relative">
        <div className="bg-black rounded-xl p-6 sm:p-8 border border-zinc-800/50 shadow-[0_0_15px_rgba(0,0,0,0.4)] relative overflow-hidden">
          {/* Card background gradients */}
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>

          <div className="relative">
            {/* Header with Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-purple-800/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-white mb-3">
                Profile not found
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base">
                The profile you're looking for doesn't exist or has been removed.
                Please check the URL and try again.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white 
                         rounded-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all text-sm font-medium
                         flex items-center justify-center gap-2 border border-purple-500/20"
              >
                <Home className="w-4 h-4" />
                Return Home
              </Link>
              <Link
                href="https://discord.gg/cutz"
                className="w-full sm:w-auto px-6 py-2.5 bg-black/60 border border-white/10 hover:border-purple-500/30
                         text-white rounded-lg text-sm font-medium transition-all hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]
                         flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </Link>
            </div>

            {/* Additional Help Options */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-center">
                <p className="text-sm text-zinc-500 mb-4">
                  If you believe this is a mistake, please contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="https://discord.gg/cutz"
                    className="flex items-center justify-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Apply for cutz.lol
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="flex items-center justify-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Check our pricing
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}