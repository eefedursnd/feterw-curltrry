'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Briefcase, Search, Clock, FileText, Loader2 } from 'lucide-react';
import { Position } from 'haze.bio/types/apply';
import { applyAPI } from 'haze.bio/api';
import toast from 'react-hot-toast';

interface NewApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPositions?: Position[];
}

export default function NewApplicationModal({
    isOpen,
    onClose,
    initialPositions = []
}: NewApplicationModalProps) {
    const [positions, setPositions] = useState<Position[]>([]);
    const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setPositions(initialPositions);
            setFilteredPositions(initialPositions);
            setIsLoading(false);

            setSelectedPosition(null);
            setSearchQuery('');
        }
    }, [isOpen, initialPositions]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredPositions(positions);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = positions.filter(
                position =>
                    position.title.toLowerCase().includes(query) ||
                    position.description.toLowerCase().includes(query)
            );
            setFilteredPositions(filtered);
        }
    }, [searchQuery, positions]);

    const handleStartApplication = async () => {
        if (!selectedPosition) return;

        setIsStarting(true);
        try {
            await applyAPI.startApplication(selectedPosition.id);
            toast.success(`Starting application for ${selectedPosition.title}`);
            router.push(`/dashboard/applications/${selectedPosition.id}`);
        } catch (error: any) {
            console.error('Error starting application:', error);
            if (error.response?.data?.error &&
                error.response.data.error.includes('already have an active application')) {
                toast.error('You already have an active application for this position');
            } else {
                toast.error(error.message || 'Failed to start application');
            }
            setIsStarting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="bg-black rounded-xl border border-zinc-800/50 w-full max-w-xl overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">Available Positions</h3>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search bar */}
                <div className="px-5 py-3 border-b border-zinc-800/50">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 bg-zinc-900/50 border border-zinc-800/70 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                            placeholder="Search positions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Positions list */}
                <div className="max-h-[350px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : filteredPositions.length === 0 ? (
                        <div className="text-center py-12">
                            <Briefcase className="w-12 h-12 text-zinc-500 mx-auto mb-3 opacity-50" />
                            <h4 className="text-white font-medium mb-1">No Positions Found</h4>
                            <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                                {searchQuery.trim() !== ''
                                    ? `No positions matching "${searchQuery}" were found.`
                                    : "There are no open positions available at this time."}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {filteredPositions.map((position) => (
                                <div
                                    key={position.id}
                                    className={`px-5 py-4 border-b border-zinc-800/30 transition-colors cursor-pointer ${selectedPosition?.id === position.id
                                        ? 'bg-purple-900/10'
                                        : 'hover:bg-zinc-900/50'
                                        }`}
                                    onClick={() => setSelectedPosition(position)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-medium text-white">{position.title}</h4>
                                                {position.questions.length <= 5 && (
                                                    <span className="px-1.5 py-0.5 bg-green-800/20 text-green-300 rounded text-[10px] font-medium">
                                                        QUICK
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 max-w-md">
                                                {position.description}
                                            </p>

                                            <div className="flex mt-2 gap-3 text-xs text-zinc-500">
                                                <div className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    <span>{position.questions.length} questions</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>~{Math.ceil(position.questions.length * 1.2)} min</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`w-5 h-5 rounded-full ${selectedPosition?.id === position.id
                                            ? 'bg-purple-600 flex items-center justify-center'
                                            : 'border border-zinc-700'
                                            }`}>
                                            {selectedPosition?.id === position.id && (
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with action buttons */}
                <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-end items-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStartApplication}
                        disabled={!selectedPosition || isStarting}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-purple-600 disabled:cursor-not-allowed"
                    >
                        {isStarting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Start Application
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}