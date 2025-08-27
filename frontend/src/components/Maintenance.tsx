'use client';

import { Status } from 'haze.bio/types';
import { DiscordIcon } from 'haze.bio/socials/Socials';
import { Wrench, Clock, AlertTriangle, ExternalLink, Calendar, BarChart, ArrowRight, Globe, Mail } from 'lucide-react';
import moment from 'moment';
import { useEffect, useState } from 'react';

interface MaintenanceProps {
  status: Status;
}

export default function Maintenance({ status }: MaintenanceProps) {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 });
  const [isClient, setIsClient] = useState(false);

  const startTime = moment(status.start_date);
  const endTime = moment(status.end_date);
  const formattedStartDate = startTime.format('MMMM D, YYYY [at] h:mm A');
  const formattedEndDate = endTime.format('MMMM D, YYYY [at] h:mm A');

  useEffect(() => {
    setIsClient(true);

    calculateProgress();
    calculateTimeRemaining();

    const timer = setInterval(() => {
      calculateProgress();
      calculateTimeRemaining();
    }, 60000);

    return () => clearInterval(timer);
  }, [status.start_date, status.end_date]);

  const calculateProgress = () => {
    const now = moment();
    const totalDuration = moment.duration(endTime.diff(startTime));
    const elapsedDuration = moment.duration(now.diff(startTime));
    const progress = Math.min(100, Math.max(0,
      (elapsedDuration.asMilliseconds() / totalDuration.asMilliseconds()) * 100
    ));

    setProgressPercentage(Math.round(progress * 10) / 10);
  };

  const calculateTimeRemaining = () => {
    const now = moment();
    const duration = moment.duration(endTime.diff(now));
    setTimeRemaining({
      hours: Math.floor(duration.asHours()),
      minutes: Math.floor(duration.minutes())
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Gradient orbs for visual interest with purple tones */}
          <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -z-10" />
          <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] -z-10" />

          {/* Maintenance card */}
          <div className="bg-black backdrop-blur-md rounded-xl border border-zinc-800/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">System Maintenance</h3>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-amber-400 text-xs font-medium">In Progress</span>
              </div>
            </div>

            {/* Main content area */}
            <div className="p-6 space-y-6">
              {/* Introduction */}
              <div className="p-4 bg-black/40 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-white/80 leading-relaxed">
                    {status.reason}
                  </p>
                </div>
              </div>

              {/* Status Information - 2-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left column - Time Info */}
                <div className="bg-black/30 rounded-xl border border-zinc-800/50 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Start Time</p>
                      <p className="text-white font-medium text-sm">{formattedStartDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Expected End Time</p>
                      <p className="text-white font-medium text-sm">{formattedEndDate}</p>
                    </div>
                  </div>
                </div>

                {/* Right column - Progress Info */}
                <div className="bg-black/30 rounded-xl border border-zinc-800/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                      <BarChart className="w-4 h-4 text-purple-400" />
                    </div>
                    <h4 className="text-sm font-medium text-white">Progress</h4>
                  </div>

                  <div className="bg-black/40 rounded-lg p-3 mb-3 border border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <div>
                        <span className="text-xs font-medium text-white/60">Time remaining: </span>
                        {isClient ? (
                          <span className="text-xs font-bold text-white">
                            {timeRemaining.hours > 0 ? `${timeRemaining.hours}h ` : ''}
                            {timeRemaining.minutes}m
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-white">Calculating...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-white/50">
                      <span>Progress</span>
                      {isClient ? (
                        <span>{progressPercentage}% complete</span>
                      ) : (
                        <span>Loading...</span>
                      )}
                    </div>
                    {isClient ? (
                      <div className="w-full h-2 bg-zinc-800/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="w-full h-2 bg-zinc-800/70 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-700 rounded-full animate-pulse" style={{ width: "5%" }}></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Discord Information - Adapting Discord branding to match site theme */}
              <div className="bg-black/30 rounded-xl border border-purple-800/20 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <DiscordIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <h4 className="text-sm font-medium text-white">Stay Updated</h4>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Join our Discord server to receive real-time updates about the maintenance progress and to be notified when all systems are operational again.
                </p>
                <div className="flex justify-end">
                  <a
                    href="https://discord.gg/hazebio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 
                            transition-colors rounded-lg text-white text-sm font-medium"
                  >
                    Join Discord
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Alternative resources section */}
              <div className="bg-black/30 rounded-xl border border-zinc-800/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-purple-400" />
                  </div>
                  <h4 className="text-sm font-medium text-white">Alternative Resources</h4>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  While we're performing maintenance, our main services are temporarily unavailable. Need immediate assistance? Our support team remains available.
                </p>
                <div className="flex flex-wrap gap-2 justify-end">
                  <a
                    href="mailto:help@haze.bio"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/50 
                            transition-colors rounded-lg text-white text-sm font-medium"
                  >
                    Contact Support
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800/50 p-4 bg-black/20">
              <p className="text-white/40 text-xs text-center">
                We appreciate your patience while we make improvements to enhance your experience
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}