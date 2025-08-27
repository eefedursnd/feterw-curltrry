import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import {
  ArrowRight,
  CheckCircle,
  Link as LinkIcon,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import UserMarquee from 'haze.bio/components/UserMarquee';
import { publicAPI, userAPI } from 'haze.bio/api';
import Navigation from 'haze.bio/components/Navigation';
import Footer from 'haze.bio/components/ui/Footer';
import UsernameForm from 'haze.bio/components/ui/UsernameForm';

async function getMarqueeUsers() {
  try {
    const marqueeUsers = await publicAPI.getMarqueeUsers();
    return marqueeUsers;
  } catch (error) {
    console.error("Error fetching marquee users:", error);
    return [];
  }
}

async function getSiteStats() {
  try {
    const stats = await userAPI.getStats();
    return stats;
  } catch (error) {
    console.error("Error fetching site stats:", error);
    return {
      users: 0,
      premium: 0,
      total_views: 0,
      discord_linked: 0
    };
  }
}

export default async function Home() {
  const cookieStore = cookies();
  const sessionTokenCookie = (await cookieStore).get('sessionToken');
  const isLoggedIn = !!sessionTokenCookie;
  const marqueeUsers = await getMarqueeUsers();
  const siteStats = await getSiteStats();

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden bg-black">
      <Navigation isLoggedIn={isLoggedIn} />

      <div className="fixed inset-0 z-0 pointer-events-none opacity-70">
        <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.1)_0%,transparent_70%)]"></div>
        <div className="absolute bottom-[-30%] right-[-20%] w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.08)_0%,transparent_70%)]"></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-900/20 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-800/15 blur-[100px] animate-float-slow animation-delay-2000"></div>
      </div>

      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>

        <div className="absolute top-20 left-[15%] opacity-20 rotate-[-15deg] scale-125">
          <LinkIcon className="w-12 h-12 text-purple-500" />
        </div>
        <div className="absolute top-32 right-[20%] opacity-15 rotate-12 scale-150">
          <LinkIcon className="w-14 h-14 text-purple-300" />
        </div>
        <div className="absolute top-60 left-[25%] opacity-10 rotate-45">
          <LinkIcon className="w-10 h-10 text-purple-400" />
        </div>
        <div className="absolute top-80 right-[30%] opacity-25 rotate-[-30deg]">
          <LinkIcon className="w-8 h-8 text-purple-600" />
        </div>
        <div className="absolute top-40 left-[10%] opacity-20 rotate-[60deg] scale-75">
          <LinkIcon className="w-16 h-16 text-purple-700/70" />
        </div>
      </div>

      <div className="relative z-10 flex-grow flex flex-col">

        <div className="pt-32 space-y-24 md:space-y-32 mb-24">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 relative text-center">
            <div className="relative z-10 mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-5 max-w-4xl mx-auto animate-fade-in-up leading-tight">
                All your links, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">in one place</span>.
              </h1>

              <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-fade-in-up animation-delay-200">
                Create your profile in minutes. Share your social media, content and more with a single link.
              </p>

              <UsernameForm />

              <p className="text-zinc-600 text-sm animate-fade-in-up animation-delay-400">
                Claim your username before someone else does
              </p>
            </div>

            <div className="relative h-[600px] md:h-[700px] lg:h-[800px] mx-auto max-w-7xl animate-fade-in animation-delay-500">
              <div className="absolute inset-0">
                {/* Two-column layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-full">
                  {/* Left side: 3 Mobile Mockups */}
                  <div className="md:col-span-4 flex items-center justify-center relative">
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Mobile Mockup 1 - Bottom left - unchanged */}
                      <div className="absolute bottom-[5%] left-[10%] w-[140px] sm:w-[160px] aspect-[9/16] transform perspective-[1000px] rotate-y-[15deg] rotate-x-[-5deg] rotate-z-[-5deg] hover:scale-105 transition-all duration-500 animate-float animation-delay-100">
                        <div className="absolute inset-0 rounded-2xl border-[5px] border-zinc-800 bg-zinc-950 shadow-xl shadow-purple-900/20">
                          <div className="absolute inset-0 rounded-xl overflow-hidden">
                            <Image
                              src="/mockups/1.png"
                              alt="cutz.lol profile example"
                              width={400}
                              height={800}
                              className="w-full h-full object-cover"
                              priority
                              draggable="false"
                            />
                          </div>
                        </div>
                        <div className="absolute -inset-3 bg-purple-600/15 blur-xl rounded-full opacity-70 animate-pulse-slow"></div>
                      </div>

                      {/* Mobile Mockup 2 - Center, slightly raised - unchanged */}
                      <div className="absolute top-[35%] left-[30%] w-[160px] sm:w-[180px] aspect-[9/16] transform perspective-[1000px] rotate-y-[5deg] rotate-x-[8deg] hover:scale-105 transition-all duration-500 animate-float animation-delay-400 z-10">
                        <div className="absolute inset-0 rounded-2xl border-[5px] border-zinc-800 bg-zinc-950 shadow-2xl shadow-purple-900/30">
                          <div className="absolute inset-0 rounded-xl overflow-hidden">
                            <Image
                              src="/mockups/2.png"
                              alt="cutz.lol profile example"
                              width={400}
                              height={800}
                              className="w-full h-full object-cover"
                              priority
                              draggable="false"
                            />
                          </div>
                        </div>
                        <div className="absolute -inset-4 bg-purple-600/20 blur-xl rounded-full opacity-80 animate-pulse-slow animation-delay-1000"></div>
                      </div>

                      {/* Mobile Mockup 3 - Top right - unchanged */}
                      <div className="absolute top-[10%] right-[10%] w-[140px] sm:w-[160px] aspect-[9/16] transform perspective-[1000px] rotate-y-[-8deg] rotate-x-[12deg] rotate-z-[5deg] hover:scale-105 transition-all duration-500 animate-float animation-delay-700">
                        <div className="absolute inset-0 rounded-2xl border-[5px] border-zinc-800 bg-zinc-950 shadow-xl shadow-purple-900/20">
                          <div className="absolute inset-0 rounded-xl overflow-hidden">
                            <Image
                              src="/mockups/3.png"
                              alt="cutz.lol profile example"
                              width={400}
                              height={800}
                              className="w-full h-full object-cover"
                              priority
                              draggable="false"
                            />
                          </div>
                        </div>
                        <div className="absolute -inset-3 bg-purple-600/15 blur-xl rounded-full opacity-70 animate-pulse-slow animation-delay-500"></div>
                      </div>
                    </div>
                  </div>

                  {/* Right side: MUCH LARGER Dashboard Mockup */}
                  <div className="md:col-span-8 flex items-center justify-center relative">
                    {/* Dramatically expanded mockup container - repositioned and with static positioning */}
                    <div className="absolute right-[-20%] top-[60%] transform -translate-y-1/2 w-[120%] aspect-[16/9] perspective-[2500px] rotate-y-[-10deg] rotate-x-[5deg] rotate-z-[2deg] hover:rotate-y-[-7deg] hover:rotate-x-[3deg] transition-all duration-700">
                      {/* Enhanced glow effects */}
                      <div className="absolute -inset-10 bg-purple-600/10 blur-3xl rounded-3xl opacity-70"></div>
                      <div className="absolute -inset-5 bg-purple-800/5 blur-xl rounded-2xl opacity-60"></div>

                      {/* Laptop frame */}
                      <div className="absolute inset-0 rounded-xl border-[8px] border-zinc-800/90 bg-zinc-900 shadow-[0_0_100px_rgba(168,85,247,0.2)] shadow-purple-900/20 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-black to-zinc-900">
                          {/* Dashboard screenshot - optimized for 1920x1080 */}
                          <div className="absolute inset-[1px] rounded-md overflow-hidden">
                            <Image
                              src="/mockups/dashboard.png"
                              alt="cutz.lol dashboard"
                              width={1920}
                              height={1080}
                              className="w-full h-full object-cover object-center"
                              priority
                              draggable="false"
                            />
                          </div>
                        </div>

                        {/* Enhanced laptop bottom part with larger dimensions */}
                        <div className="absolute -bottom-[30px] left-0 right-0 h-[28px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-b-lg transform perspective-[1000px] rotate-x-[80deg]"></div>

                        {/* Add laptop keyboard part illusion */}
                        <div className="absolute -bottom-[60px] left-[5%] right-[5%] h-[30px] bg-zinc-900 rounded-b-xl transform perspective-[1000px] rotate-x-[75deg] opacity-40"></div>
                      </div>

                      {/* Enhanced reflection effects */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/5 to-white/10 rounded-xl"></div>
                      <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/5 to-transparent rounded-t-xl"></div>

                      {/* Screen corner reflections */}
                      <div className="absolute top-[5%] right-[5%] w-[100px] h-[100px] bg-white/5 rounded-full blur-xl"></div>
                      <div className="absolute bottom-[10%] left-[7%] w-[70px] h-[70px] bg-white/5 rounded-full blur-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="relative bg-black/60 backdrop-blur-lg rounded-2xl border border-zinc-800/60 shadow-xl px-6 py-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {[
                  { count: siteStats.users.toLocaleString(), label: "Users" },
                  { count: siteStats.total_views.toLocaleString(), label: "Total Views" },
                  { count: siteStats.premium.toLocaleString(), label: "Premium Users" },
                ].map((stat, i) => (
                  <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.count}</div>
                    <div className="text-zinc-400 text-sm uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 relative">
            <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Choose Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">Plan</span>
              </h2>
              <p className="text-zinc-400 text-lg">
                Start with our free plan or unlock all features with premium
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-zinc-900/70 to-black/80 backdrop-blur-lg rounded-2xl border border-zinc-800/50 p-8 flex flex-col relative overflow-hidden animate-fade-in-up md:self-end">
                <div className="mb-6">
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-medium rounded-full">FREE</span>
                  <h3 className="text-2xl font-bold text-white mt-4">Free Plan</h3>
                  <div className="flex items-baseline mt-3 mb-2">
                    <span className="text-3xl font-bold text-white">$0</span>
                    <span className="text-zinc-400 ml-1">/forever</span>
                  </div>
                  <p className="text-zinc-400 text-sm">Get started with basic features</p>
                </div>

                <div className="space-y-3 mb-6 flex-grow text-sm">
                  {["Free Custom Domains", "Basic Analytics", "Free Effects & Layouts"].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <CheckCircle className="w-5 h-5 text-zinc-500" />
                      </div>
                      <span className="text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register"
                  className="w-full py-3 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700
               text-white rounded-lg font-medium text-center transition-all transform hover:-translate-y-0.5
               shadow-md shadow-zinc-900/30 flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-gradient-to-br from-purple-900/20 to-black/80 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-8 flex flex-col relative overflow-hidden shadow-lg shadow-purple-900/20 animate-fade-in-up animation-delay-200 z-10">
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                  <LinkIcon className="absolute top-6 right-6 w-12 h-12 text-purple-400 rotate-12" />
                  <LinkIcon className="absolute bottom-12 left-8 w-8 h-8 text-purple-300 rotate-45" />
                  <LinkIcon className="absolute top-32 left-12 w-16 h-16 text-purple-500 rotate-[-15deg]" />
                  <LinkIcon className="absolute bottom-36 right-20 w-10 h-10 text-purple-400 rotate-[30deg]" />
                </div>

                <div className="absolute top-0 right-0 px-4 py-1 bg-purple-600 text-white text-xs font-bold rounded-bl-lg">POPULAR</div>

                <div className="mb-6 relative z-10">
                  <span className="px-3 py-1 bg-purple-700 text-purple-100 text-xs font-medium rounded-full">PREMIUM</span>
                  <h3 className="text-2xl font-bold text-white mt-4">Premium Plan</h3>
                  <div className="flex items-baseline mt-3 mb-2">
                    <span className="text-3xl font-bold text-white">$5.99</span>
                    <span className="text-zinc-400 ml-1">/one-time</span>
                  </div>
                  <p className="text-zinc-400 text-sm">Everything you need to stand out</p>
                </div>

                <div className="space-y-3 mb-6 relative z-10">
                  {[
                    "All Free features",
                    "Premium Custom Domains",
                    "Remove cutz.lol branding",
                    "Premium themes & effects",
                    "Advanced analytics",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-zinc-200">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/pricing"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600
               text-white rounded-lg font-medium text-center transition-all transform hover:-translate-y-0.5
               shadow-md shadow-purple-900/30 hover:shadow-lg hover:shadow-purple-800/40 flex items-center justify-center gap-2"
                >
                  Get Premium
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          <section className="max-w-4xl mx-auto px-4 sm:px-6 relative">
            <div className="text-center max-w-3xl mx-auto mb-10 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-900/30 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium mb-4">
                <HelpCircle className="w-4 h-4" />
                Frequently Asked
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Got Questions?
              </h2>
              <p className="text-zinc-400 text-lg">
                Find answers to common questions about cutz.lol
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                          question: "What is cutz.lol?",
        answer: "cutz.lol is a platform that allows you to create a personalized page to share all your links, social media profiles, and content in one place with a single, easy-to-remember link."
                },
                {
                          question: "Is cutz.lol really free?",
        answer: "Yes, cutz.lol offers a free plan that includes all essential features. Premium plans with advanced features are available for those who want more customization options and professional tools."
                },
                {
                  question: "Can I customize my profile?",
                  answer: "Absolutely! You can fully customize your profile with different themes, colors, backgrounds, and layouts to match your personal brand or style."
                },
                {
                  question: "Do I get analytics with my profile?",
                  answer: "Yes, all users get basic analytics. Premium users receive detailed insights including visitor geographic data, referral sources, click-through rates, and more."
                },
                {
                  question: "How do I get started?",
                  answer: "Simply click 'Get Started' or 'Register', choose your username, and follow the simple setup process. You can have your page up and running in minutes."
                }
              ].map((faq, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-zinc-900/50 to-black/60 backdrop-blur-sm rounded-xl border border-zinc-800/60 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <details className="group">
                    <summary className="flex items-center justify-between p-5 font-medium text-white cursor-pointer">
                      <span>{faq.question}</span>
                      <ChevronDown className="w-5 h-5 text-purple-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 pt-0">
                      <p className="text-zinc-400">{faq.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-5xl mx-auto px-4 sm:px-6 relative">
            <div className="relative overflow-hidden bg-black/60 backdrop-blur-md rounded-2xl border border-purple-500/20 shadow-lg p-6 sm:p-8 text-center">
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <LinkIcon className="absolute top-6 right-10% w-16 h-16 text-purple-400 rotate-12" />
                <LinkIcon className="absolute bottom-12 left-[15%] w-12 h-12 text-purple-300 rotate-45" />
                <LinkIcon className="absolute top-[40%] left-[8%] w-20 h-20 text-purple-500 rotate-[-15deg]" />
                <LinkIcon className="absolute bottom-[30%] right-[12%] w-14 h-14 text-purple-400 rotate-[30deg]" />
                <LinkIcon className="absolute top-[25%] right-[25%] w-10 h-10 text-purple-600 rotate-[-5deg]" />
                <LinkIcon className="absolute bottom-[15%] left-[35%] w-8 h-8 text-purple-200 rotate-[20deg]" />
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Ready to Create Your Profile?
                </h2>
                <p className="text-zinc-400 max-w-lg mx-auto text-base mb-6">
                  Join {siteStats.users.toLocaleString()} users already using cutz.lol to share their online presence.
                </p>

                <div className="max-w-md mx-auto">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {isLoggedIn ? (
                      <Link
                        href="/dashboard"
                        className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 
                                text-white rounded-lg text-base font-semibold transition-all"
                      >
                        Go to Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/register"
                          className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500
                                  text-white rounded-lg text-base font-semibold transition-all"
                        >
                          Get Started Free
                        </Link>
                        <Link
                          href="/login"
                          className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900/60 border border-zinc-700/70 hover:border-purple-500/50 hover:bg-purple-900/30
                                  text-zinc-300 hover:text-white rounded-lg text-base font-semibold transition-all"
                        >
                          Sign In
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </div>
  );
}