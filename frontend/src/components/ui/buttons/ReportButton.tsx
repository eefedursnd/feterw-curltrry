'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { User } from 'haze.bio/types';
import ReportModal from 'haze.bio/components/modals/ReportModal';
import Tooltip from 'haze.bio/components/ui/Tooltip';

interface ReportButtonProps {
  profileUsername: string;
  currentUser: User | null;
}

function ReportButton({ profileUsername, currentUser }: ReportButtonProps) {
  const [showReportModal, setShowReportModal] = useState(false);

  const isSelfProfile = currentUser?.username === profileUsername;
  if (isSelfProfile) return null;

  const handleOpenModal = () => {
    setShowReportModal(true);
  };

  return (
    <>
      <Tooltip text="Report this profile" position="left">
        <button
          onClick={handleOpenModal}
          className="bg-black/40 hover:bg-zinc-800/60 backdrop-blur-sm p-2.5 rounded-full 
                    border border-zinc-800/50 hover:border-purple-800/30 transition-all group"
          aria-label="Report this profile"
        >
          <Flag className="w-4 h-4 text-white/60 group-hover:text-purple-300" />
        </button>
      </Tooltip>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUsername={profileUsername}
        currentUser={currentUser}
      />
    </>
  );
}

export default ReportButton;