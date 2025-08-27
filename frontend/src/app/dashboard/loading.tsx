export default function Loading() {
  return (
    <div className="min-h-screen relative bg-black flex items-center justify-center">
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
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo Placeholder */}
        <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800/50 flex items-center justify-center mb-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_70%)]"></div>
          {/* Simple h logo */}
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">h</span>
        </div>
        
        {/* Loading Text */}
        <div className="text-center mb-2">
          <h1 className="text-white font-medium">Loading your dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Please wait a moment...</p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-48 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 animate-[progressBar_1.5s_ease-in-out_infinite] origin-left" />
        </div>
        
        {/* Pulse Dots */}
        <div className="flex gap-2 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/80 animate-pulse"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 animate-pulse animation-delay-300"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40 animate-pulse animation-delay-600"></div>
        </div>
      </div>
    </div>
  );
}