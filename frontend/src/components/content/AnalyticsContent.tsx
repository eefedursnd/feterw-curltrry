'use client';

import { useState, useEffect } from 'react';
import { analyticsAPI } from 'haze.bio/api';
import { Eye, Share2, Globe, Monitor, CalendarDays, Info, ArrowRight, Crown, Gem, ChevronRight, Sparkles } from 'lucide-react';
import DashboardLayout from 'haze.bio/components/dashboard/Layout';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import Link from 'next/link';
import { useUser } from 'haze.bio/context/UserContext';
import { PremiumBadge } from 'haze.bio/badges/Badges';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false }) as any;

interface AnalyticsContentProps {
    initialData?: any;
}

interface AnalyticsData {
    profile_views?: Record<string, number>;
    top_countries?: Record<string, number>;
    top_socials?: Record<string, number>;
    device_breakdown?: Record<string, number>;
    top_referrers?: Record<string, number>;
}

export default function AnalyticsContent({ initialData }: AnalyticsContentProps) {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | undefined>(initialData);
    const [timeFrame, setTimeFrame] = useState(7);
    const [isLoading, setIsLoading] = useState(!initialData);
    const { user } = useUser();

    const isPremium = user?.subscription?.status === 'active';

    const chartColors = {
        primary: '#ffffff',
        secondary: '#a3a3a3',
        tertiary: '#737373',
        quaternary: '#525252',
        quinary: '#404040',
        accent: '#a855f7',
        background: 'rgba(255, 255, 255, 0.1)',
        text: '#a3a3a3'
    };

    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .apexcharts-tooltip {
              background: rgba(0, 0, 0, 0.85) !important;
              border: 1px solid rgba(168, 85, 247, 0.2) !important;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
              backdrop-filter: blur(4px);
              border-radius: 8px !important;
              padding: 0 !important;
              color: white !important;
              overflow: hidden !important;
            }
            
            .apexcharts-tooltip-title {
              background: rgba(168, 85, 247, 0.1) !important;
              border-bottom: 1px solid rgba(168, 85, 247, 0.1) !important;
              padding: 8px 12px !important;
              font-weight: 500 !important;
              font-size: 12px !important;
            }
            
            .apexcharts-tooltip-series-group {
              padding: 8px 12px !important;
            }
            
            .apexcharts-tooltip-y-group {
              padding: 2px 0 !important;
            }
            
            .apexcharts-tooltip-text-y-value {
              font-weight: 600 !important;
              font-size: 14px !important;
            }
            
            .apexcharts-tooltip-marker {
              width: 10px !important;
              height: 10px !important;
              border-radius: 50% !important;
              margin-right: 8px !important;
            }
            
            .apexcharts-pie-label {
              fill: white !important;
              font-weight: 600 !important;
            }
            
            .apexcharts-legend-text {
              color: rgba(255, 255, 255, 0.7) !important;
              font-size: 12px !important;
            }
            
            .apexcharts-legend-marker {
              border-radius: 3px !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
        if (!initialData && isPremium) {
            fetchAnalyticsData();
        }
    }, [initialData, isPremium]);

    const fetchAnalyticsData = async () => {
        if (!isPremium) return;

        setIsLoading(true);
        try {
            const response = await analyticsAPI.getAnalytics(timeFrame);
            setAnalyticsData(response);
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTimeFrameChange = (days: number) => {
        if (!isPremium) return;

        setTimeFrame(days);
        setIsLoading(true);
        analyticsAPI.getAnalytics(days)
            .then(response => {
                setAnalyticsData(response);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Failed to fetch analytics data:', error);
                toast.error('Failed to load analytics data');
                setIsLoading(false);
            });
    };

    const formatForChart = (data: Record<string, number> = {}) => {
        return Object.entries(data || {}).map(([name, value]) => ({
            x: name,
            y: value
        }));
    };

    const formatProfileViews = (data: Record<string, number> = {}) => {
        return Object.entries(data || {})
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, count]) => ({
                x: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                y: count
            }));
    };

    const commonChartOptions: ApexOptions = {
        chart: {
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            },
            background: 'transparent',
            foreColor: '#fff',
            fontFamily: 'Inter, sans-serif',
        },
        theme: {
            mode: 'dark'
        },
        stroke: {
            curve: 'smooth',
            width: 2.5
        },
        colors: [chartColors.primary, chartColors.secondary, chartColors.tertiary, chartColors.quaternary, chartColors.quinary],
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            strokeDashArray: 6,
            yaxis: {
                lines: {
                    show: true
                }
            },
            padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            labels: {
                style: {
                    colors: chartColors.text,
                    fontSize: '12px',
                    fontFamily: 'Inter, sans-serif',
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: chartColors.text,
                    fontSize: '12px',
                    fontFamily: 'Inter, sans-serif',
                },
                formatter: function (val) {
                    return val.toFixed(0);
                }
            }
        },
        tooltip: {
            enabled: true,
            theme: 'dark',
            style: {
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif'
            },
            shared: true,
            intersect: false,
            followCursor: true,
            marker: {
                show: true
            },
            fillSeriesColor: false,
            onDatasetHover: {
                highlightDataSeries: true,
            },
            y: {
                formatter: function (value) {
                    return value.toString();
                },
                title: {
                    formatter: function (seriesName) {
                        return seriesName;
                    }
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            offsetY: 0,
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            labels: {
                colors: '#fff'
            },
            markers: {
                size: 12,
                strokeWidth: 0,
            },
            itemMargin: {
                horizontal: 10,
                vertical: 0
            }
        },
        states: {
            hover: {
                filter: {
                    type: 'lighten',
                }
            },
            active: {
                filter: {
                    type: 'none'
                }
            }
        }
    };

    const profileViewsOptions: ApexOptions = {
        ...commonChartOptions,
        chart: {
            ...commonChartOptions.chart,
            type: 'area',
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 90, 100],
                colorStops: [
                    {
                        offset: 0,
                        color: '#a855f7',
                        opacity: 0.4
                    },
                    {
                        offset: 100,
                        color: '#a855f7',
                        opacity: 0.1
                    }
                ]
            }
        },
        colors: ['#a855f7'],
        dataLabels: {
            ...commonChartOptions.dataLabels,
            enabled: true,
            formatter: function (val, opts) {
                return val.toString();
            },
            style: {
                fontSize: '11px',
                fontWeight: '600',
                colors: ['#000000']
            },
            background: {
                enabled: true,
                foreColor: '#ffffff',
                padding: 3,
                borderRadius: 3,
                borderWidth: 0,
                opacity: 0.85
            },
            dropShadow: {
                enabled: false
            }
        }
    };

    const barChartOptions: ApexOptions = {
        ...commonChartOptions,
        chart: {
            ...commonChartOptions.chart,
            type: 'bar',
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '70%',
            }
        },
        colors: ['#a855f7'],
        fill: {
            opacity: 0.8,
            type: 'solid'
        }
    };

    const pieChartOptions: ApexOptions = {
        ...commonChartOptions,
        chart: {
            ...commonChartOptions.chart,
            type: 'pie',
            animations: {
                enabled: true,
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        colors: ['#a855f7', '#c084fc', '#d8b4fe', '#f0abfc', '#f5d0fe'],
        legend: {
            position: 'bottom',
            offsetY: 0,
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            formatter: function (seriesName, opts) {
                return `${seriesName}: ${opts.w.globals.series[opts.seriesIndex]}`;
            },
            labels: {
                colors: '#fff'
            },
            markers: {
                size: 10,
            }
        },
        stroke: {
            width: 0,
            colors: ['transparent']
        },
        labels: [],
        tooltip: {
            ...commonChartOptions.tooltip,
            y: {
                formatter: function (value) {
                    return value.toString();
                }
            }
        },
        plotOptions: {
            pie: {
                expandOnClick: false,
                donut: {
                    size: '0%'
                },
                dataLabels: {
                    offset: -10,
                    minAngleToShowLabel: 10
                }
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    height: 280
                },
                legend: {
                    position: 'bottom',
                    offsetY: 10
                }
            }
        }],
        dataLabels: {
            ...commonChartOptions.dataLabels,
            enabled: true,
            formatter: function (val, opts) {
                const percentage = (typeof val === 'number' ? val.toFixed(0) : '0') + '%';
                return percentage;
            },
            style: {
                fontSize: '11px',
                fontWeight: '600',
                colors: ['#000000']
            },
            background: {
                enabled: true,
                foreColor: '#ffffff',
                padding: 3,
                borderRadius: 3,
                borderWidth: 0,
                opacity: 0.85
            },
            dropShadow: {
                enabled: false
            }
        }
    };

    const hasData = analyticsData && Object.keys(analyticsData).length > 0;

    if (!isPremium) {
        return (
            <DashboardLayout>
                <div className="max-w-[100rem] mx-auto space-y-8 relative">
                    {/* Hero Section with Header */}
                    <div className="bg-black rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>

                        <div className="relative z-10 max-w-3xl">
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                Profile Analytics
                            </h1>
                            <p className="text-white/70 text-sm md:text-base">
                                Unlock with Premium advanced analytics.
                            </p>
                        </div>
                    </div>

                    {/* Premium Required UI */}
                    <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800/50">
                            <h2 className="text-white font-semibold flex items-center gap-2">
                                <PremiumBadge size={16} />
                                Premium Feature
                            </h2>
                        </div>
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-purple-800/20 rounded-xl flex items-center justify-center mb-6">
                                <Crown className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                Unlock Advanced Analytics
                            </h3>
                            <p className="text-white/60 mb-8 max-w-md mx-auto text-sm">
                                Understand your audience better with detailed visitor data, demographics, and interaction patterns to optimize your profile.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-2xl mb-8">
                                <div className="bg-zinc-800/30 rounded-xl p-4 border border-purple-800/10 flex flex-col items-center">
                                    <Eye className="w-5 h-5 text-purple-400 mb-2" />
                                    <h4 className="text-white text-sm font-medium mb-1">Profile Views</h4>
                                    <p className="text-white/50 text-xs text-center">Track engagement over time</p>
                                </div>

                                <div className="bg-zinc-800/30 rounded-xl p-4 border border-purple-800/10 flex flex-col items-center">
                                    <Globe className="w-5 h-5 text-purple-400 mb-2" />
                                    <h4 className="text-white text-sm font-medium mb-1">Geographic Data</h4>
                                    <p className="text-white/50 text-xs text-center">See where visitors come from</p>
                                </div>

                                <div className="bg-zinc-800/30 rounded-xl p-4 border border-purple-800/10 flex flex-col items-center">
                                    <Share2 className="w-5 h-5 text-purple-400 mb-2" />
                                    <h4 className="text-white text-sm font-medium mb-1">Link Analytics</h4>
                                    <p className="text-white/50 text-xs text-center">Track your most popular links</p>
                                </div>
                            </div>

                            <Link
                                href="/pricing"
                                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md 
                                      transition-all duration-200 text-sm font-medium flex items-center gap-2"
                            >
                                <Gem size={14} className="text-white/90" />
                                <span>Upgrade to Premium</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-[100rem] mx-auto space-y-8 relative">
                {/* Hero Section with Header */}
                <div className="bg-black rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>

                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="max-w-3xl">
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                Profile Analytics
                            </h1>
                            <p className="text-white/70 text-sm md:text-base">
                                Detailed analytics for your profile.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-zinc-800/30 rounded-lg border border-zinc-700/50 p-1 backdrop-blur-sm">
                            {[7, 14, 30].map(days => (
                                <button
                                    key={days}
                                    onClick={() => handleTimeFrameChange(days)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all 
                                    ${timeFrame === days
                                            ? 'bg-purple-600 text-white'
                                            : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                                >
                                    {days} days
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800/50">
                            <h2 className="text-white font-semibold flex items-center gap-2">
                                <Eye className="w-4 h-4 text-purple-400" />
                                Loading Analytics
                            </h2>
                        </div>
                        <div className="flex items-center justify-center h-64 p-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin h-8 w-8 border-4 border-zinc-800/50 rounded-full border-t-purple-500"></div>
                                <p className="text-white/60">Loading your analytics data...</p>
                            </div>
                        </div>
                    </div>
                ) : !hasData ? (
                    <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800/50">
                            <h2 className="text-white font-semibold flex items-center gap-2">
                                <Info className="w-4 h-4 text-purple-400" />
                                No Data Available
                            </h2>
                        </div>
                        <div className="p-8 text-center">
                            <div className="mx-auto w-14 h-14 bg-purple-800/20 rounded-lg flex items-center justify-center mb-4">
                                <Info className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No Analytics Data Available</h3>
                            <p className="text-white/60 mb-6 max-w-md mx-auto">
                                There isn't enough data to display your analytics yet. Check back soon as more visitors interact with your profile.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-black rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs">Total Views</p>
                                        <p className="text-white font-medium text-lg">
                                            {Object.values(analyticsData?.profile_views || {}).reduce((sum, views) => sum + (views as number), 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs">Top Country</p>
                                        <p className="text-white font-medium text-lg">
                                            {Object.entries(analyticsData?.top_countries || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                        <Share2 className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs">Top Social</p>
                                        <p className="text-white font-medium text-lg capitalize">
                                            {Object.entries(analyticsData?.top_socials || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black rounded-lg border border-zinc-800/50 overflow-hidden p-5 hover:border-purple-500/20 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                        <Monitor className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs">Primary Device</p>
                                        <p className="text-white font-medium text-lg capitalize">
                                            {Object.entries(analyticsData?.device_breakdown || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Profile Views Chart */}
                            <div className="lg:col-span-2 bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-purple-400" />
                                        Profile Views
                                    </h2>
                                    <div className="text-xs text-white/60">Last {timeFrame} days</div>
                                </div>
                                <div className="h-[300px] p-4">
                                    <Chart
                                        options={{
                                            ...profileViewsOptions,
                                            xaxis: {
                                                ...profileViewsOptions.xaxis,
                                                categories: formatProfileViews(analyticsData.profile_views).map(item => item.x)
                                            }
                                        }}
                                        series={[{
                                            name: 'Profile Views',
                                            data: formatProfileViews(analyticsData.profile_views).map(item => item.y)
                                        }]}
                                        type="area"
                                        height="100%"
                                    />
                                </div>
                            </div>

                            {/* Top Countries Chart */}
                            <div className="lg:col-span-1 bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-purple-400" />
                                        Top Countries
                                    </h2>
                                </div>
                                <div className="h-[300px] p-4">
                                    <Chart
                                        options={{
                                            ...barChartOptions,
                                            xaxis: {
                                                ...barChartOptions.xaxis,
                                                categories: formatForChart(analyticsData.top_countries).map(item => item.x)
                                            },
                                            plotOptions: {
                                                bar: {
                                                    ...barChartOptions.plotOptions?.bar,
                                                    horizontal: true
                                                }
                                            }
                                        }}
                                        series={[{
                                            name: 'Visitors',
                                            data: formatForChart(analyticsData.top_countries).map(item => item.y)
                                        }]}
                                        type="bar"
                                        height="100%"
                                    />
                                </div>
                            </div>

                            {/* Most Clicked Socials Chart */}
                            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Share2 className="w-4 h-4 text-purple-400" />
                                        Most Clicked Socials
                                    </h2>
                                </div>
                                <div className="h-[300px] p-4">
                                    <Chart
                                        options={{
                                            ...pieChartOptions,
                                            labels: formatForChart(analyticsData.top_socials).map(item => item.x),
                                        }}
                                        series={formatForChart(analyticsData.top_socials).map(item => item.y)}
                                        type="pie"
                                        height="100%"
                                    />
                                </div>
                            </div>

                            {/* Device Breakdown Chart */}
                            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <Monitor className="w-4 h-4 text-purple-400" />
                                        Device Breakdown
                                    </h2>
                                </div>
                                <div className="h-[300px] p-4">
                                    <Chart
                                        options={{
                                            ...pieChartOptions,
                                            labels: formatForChart(analyticsData.device_breakdown).map(item => item.x),
                                        }}
                                        series={formatForChart(analyticsData.device_breakdown).map(item => item.y)}
                                        type="pie"
                                        height="100%"
                                    />
                                </div>
                            </div>

                            {/* Top Referrers Chart */}
                            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-800/50">
                                    <h2 className="text-white font-semibold flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-purple-400" />
                                        Top Referrers
                                    </h2>
                                </div>
                                <div className="h-[300px] p-4">
                                    <Chart
                                        options={{
                                            ...pieChartOptions,
                                            labels: formatForChart(analyticsData.top_referrers).map(item => item.x),
                                        }}
                                        series={formatForChart(analyticsData.top_referrers).map(item => item.y)}
                                        type="pie"
                                        height="100%"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tips for Improving Engagement */}
                        <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800/50">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                    <Info className="w-4 h-4 text-purple-400" />
                                    Tips for Improving Engagement
                                </h2>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-700/50 p-4 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                                <Eye className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="text-sm font-medium text-white">Optimize Profile</div>
                                        </div>
                                        <p className="text-white/60 text-xs">
                                            Add a clear profile picture and compelling bio to increase your profile view rate.
                                        </p>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-700/50 p-4 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                                <Share2 className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="text-sm font-medium text-white">Add More Links</div>
                                        </div>
                                        <p className="text-white/60 text-xs">
                                            Including diverse social links gives visitors more ways to connect with you.
                                        </p>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-700/50 p-4 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                                                <Globe className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="text-sm font-medium text-white">Share Your Profile</div>
                                        </div>
                                        <p className="text-white/60 text-xs">
                                            Promote your haze.bio link on your other social platforms to drive more traffic.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}